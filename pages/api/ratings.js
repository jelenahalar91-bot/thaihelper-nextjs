// GET    /api/ratings?helper=REF                       → public, list reviews + eligibility for current user
// POST   /api/ratings { helperRef, stars, comment? }   → employer only, upsert own rating
// DELETE /api/ratings?helper=REF                       → employer only, remove own rating
//
// Eligibility rule: a family can only rate a helper if a conversation
// exists between them AND both sides have sent at least one message
// in it. This prevents drive-by spam ratings + retaliation reviews.
//
// employer_first_name is snapshotted on each upsert so reviews keep
// rendering a name even if the family later deletes their account.

import { getEmployerSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';

const MAX_COMMENT = 400;

// Returns { canRate: boolean, reason: string|null } describing whether
// `employer_ref` is allowed to rate `helper_ref`. Reason codes:
//   'not_messaged'      — no conversation, or only one side has spoken
//   null                — eligible
async function checkEligibility(supabase, employer_ref, helper_ref) {
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .eq('helper_ref', helper_ref)
    .eq('employer_id', employer_ref);

  if (!convs || convs.length === 0) {
    return { canRate: false, reason: 'not_messaged' };
  }

  const convIds = convs.map(c => c.id);

  // Both sides must have sent at least one message. We don't care
  // about order or volume — one each is enough.
  const { data: senders } = await supabase
    .from('messages')
    .select('sender_type')
    .in('conversation_id', convIds);

  const types = new Set((senders || []).map(m => m.sender_type));
  if (!types.has('helper') || !types.has('employer')) {
    return { canRate: false, reason: 'not_messaged' };
  }

  return { canRate: true, reason: null };
}

export default async function handler(req, res) {
  const supabase = getServiceSupabase();

  // ─── GET: list reviews + eligibility (public, employer-aware) ──────
  if (req.method === 'GET') {
    const helperRef = String(req.query.helper || '').trim().toUpperCase();
    if (!helperRef) return res.status(400).json({ error: 'helper required' });

    const { data, error } = await supabase
      .from('helper_ratings')
      .select('stars, comment, employer_first_name, employer_ref, created_at, updated_at')
      .eq('helper_ref', helperRef)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ratings list error:', error);
      return res.status(500).json({ error: 'Failed to load ratings' });
    }

    const rows = data || [];
    const reviews = rows.map(r => ({
      stars: r.stars,
      comment: r.comment || '',
      employerFirstName: r.employer_first_name || 'Anonymous',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    // If the requester is a logged-in employer, also tell them whether
    // they're eligible to rate this helper + return their existing
    // rating (so the form can pre-fill).
    const session = await getEmployerSession(req);
    let canRate = false;
    let cannotRateReason = 'not_logged_in';
    let myRating = null;

    if (session) {
      const eligibility = await checkEligibility(supabase, session.ref, helperRef);
      canRate = eligibility.canRate;
      cannotRateReason = eligibility.reason; // null if eligible

      const mine = rows.find(r => r.employer_ref === session.ref);
      if (mine) {
        myRating = {
          stars: mine.stars,
          comment: mine.comment || '',
          createdAt: mine.created_at,
          updatedAt: mine.updated_at,
        };
      }
    }

    // Short cache — reviews change rarely but we don't want week-old
    // averages on hot helpers. 60s is enough to absorb burst traffic.
    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(200).json({
      reviews,
      canRate,
      cannotRateReason,
      myRating,
    });
  }

  // ─── Mutations require employer session ────────────────────────────
  const session = await getEmployerSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  const employer_ref = session.ref;

  // ─── POST: submit / update rating ──────────────────────────────────
  if (req.method === 'POST') {
    const { helperRef, stars, comment } = req.body || {};

    const cleanHelperRef = String(helperRef || '').trim().toUpperCase();
    if (!cleanHelperRef) {
      return res.status(400).json({ error: 'helperRef required' });
    }

    const numStars = Number(stars);
    if (!Number.isInteger(numStars) || numStars < 1 || numStars > 5) {
      return res.status(400).json({ error: 'stars must be an integer 1-5' });
    }

    let cleanComment = null;
    if (comment !== undefined && comment !== null && comment !== '') {
      if (typeof comment !== 'string') {
        return res.status(400).json({ error: 'comment must be a string' });
      }
      const trimmed = comment.trim();
      if (trimmed.length > MAX_COMMENT) {
        return res.status(400).json({
          error: `comment must be at most ${MAX_COMMENT} characters`,
        });
      }
      cleanComment = trimmed || null;
    }

    // Eligibility: family must have messaged with this helper
    const eligibility = await checkEligibility(supabase, employer_ref, cleanHelperRef);
    if (!eligibility.canRate) {
      return res.status(403).json({
        error: 'You can only rate helpers after you have exchanged messages with them.',
        reason: eligibility.reason,
      });
    }

    // Fetch fresh first_name (session value can be stale after profile edit)
    const { data: emp } = await supabase
      .from('employer_accounts')
      .select('first_name')
      .eq('employer_ref', employer_ref)
      .single();
    const firstName = emp?.first_name || session.firstName || null;

    const now = new Date().toISOString();
    const { data: upserted, error } = await supabase
      .from('helper_ratings')
      .upsert(
        {
          helper_ref: cleanHelperRef,
          employer_ref,
          employer_first_name: firstName,
          stars: numStars,
          comment: cleanComment,
          updated_at: now,
        },
        { onConflict: 'helper_ref,employer_ref' }
      )
      .select()
      .single();

    if (error) {
      console.error('Rating upsert error:', error);
      return res.status(500).json({ error: 'Failed to save rating' });
    }

    return res.status(200).json({
      success: true,
      rating: {
        stars: upserted.stars,
        comment: upserted.comment || '',
        employerFirstName: upserted.employer_first_name || '',
        createdAt: upserted.created_at,
        updatedAt: upserted.updated_at,
      },
    });
  }

  // ─── DELETE: remove own rating ─────────────────────────────────────
  if (req.method === 'DELETE') {
    const helperRef = String(req.query.helper || '').trim().toUpperCase();
    if (!helperRef) return res.status(400).json({ error: 'helper required' });

    const { error } = await supabase
      .from('helper_ratings')
      .delete()
      .eq('helper_ref', helperRef)
      .eq('employer_ref', employer_ref);

    if (error) {
      console.error('Rating delete error:', error);
      return res.status(500).json({ error: 'Failed to delete rating' });
    }
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
