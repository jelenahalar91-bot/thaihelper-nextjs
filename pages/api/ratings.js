// GET    /api/ratings?helper=REF                       → public, list reviews + eligibility for current user
// POST   /api/ratings { helperRef, stars, comment? }   → employer only, upsert own rating
// DELETE /api/ratings?helper=REF                       → employer only, remove own rating
//
// Eligibility rule: a family can only rate a helper after a real exchange —
// MIN_MESSAGES_PER_SIDE each way, spread over MIN_CONVERSATION_SPAN_MS. See
// the constants below for why those numbers, and what they do not prove.
//
// Reviews are public from the first one (lib/rating-visibility.js). What
// protects a helper from a single false review is the eligibility rule above,
// plus the two things that happen the moment a review lands: the helper is
// emailed a one-click dispute link, and anything at 1-2 stars also alerts the
// admin.
//
// employer_first_name is snapshotted on each upsert so reviews keep
// rendering a name even if the family later deletes their account.

import { getEmployerSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import { MIN_PUBLIC_REVIEWS } from '../../lib/rating-visibility';
import { sendNewRatingNotification } from '../../lib/send-confirmation-email';
import { createDisputeToken, buildDisputeUrl } from '../../lib/review-dispute';
import { sendLowRatingAlert } from '../../lib/emails/rating-alerts';

const MAX_COMMENT = 400;

// What has to have happened before a family may review a helper.
//
// Until 2026-09-12 one message from each side was enough. EMP-572KZV messaged
// a helper, she replied, and that made him eligible to publish "she is a
// scammer, I caught her stealing money from my daughters money box". Two
// messages is not a working relationship; it is an introduction.
//
// Calibrated against the message corpus rather than picked by feel (the same
// rule as the spam thresholds): of 1,330 conversations, 337 clear the old
// 1+1 bar, 120 clear 3+3, and 66 clear 3+3 spread over a day. Tightening to
// 3+3/24h therefore removes ~80% of the drive-by surface — and costs close to
// nothing in real reviews, because in 3.5 months exactly 3 reviews were ever
// written, 2 of them by this one man.
//
// Neither number can prove a job happened; nothing in the schema can, since
// hiring occurs off-platform. They raise the price of a drive-by accusation
// from four clicks to a sustained exchange over a day, which is what the
// abuse case actually needed.
const MIN_MESSAGES_PER_SIDE = 3;
const MIN_CONVERSATION_SPAN_MS = 24 * 60 * 60 * 1000;

// Returns { canRate: boolean, reason: string|null } describing whether
// `employer_ref` is allowed to rate `helper_ref`. Reason codes:
//   'not_messaged'      — no conversation, or only one side has spoken
//   'too_few_messages'  — talked, but not enough either way
//   'too_recent'        — the whole exchange fits inside one day
//   null                — eligible
async function checkEligibility(supabase, employer_ref, helper_ref) {
  // Deliberately counts conversations either side has hidden
  // (lib/conversation-visibility.js). Eligibility is about whether the two
  // actually talked, and that stays true once it happened — if hiding a
  // thread revoked it, a helper could drop an honest review by deleting the
  // conversation behind it, and a family could strip their own review of the
  // evidence backing it.
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .eq('helper_ref', helper_ref)
    .eq('employer_id', employer_ref);

  if (!convs || convs.length === 0) {
    return { canRate: false, reason: 'not_messaged' };
  }

  const convIds = convs.map(c => c.id);

  const { data: msgs } = await supabase
    .from('messages')
    .select('sender_type, created_at')
    .in('conversation_id', convIds);

  const rows = msgs || [];
  const fromEmployer = rows.filter(m => m.sender_type === 'employer').length;
  const fromHelper = rows.filter(m => m.sender_type === 'helper').length;

  if (fromEmployer === 0 || fromHelper === 0) {
    return { canRate: false, reason: 'not_messaged' };
  }
  if (fromEmployer < MIN_MESSAGES_PER_SIDE || fromHelper < MIN_MESSAGES_PER_SIDE) {
    return { canRate: false, reason: 'too_few_messages' };
  }

  const times = rows.map(m => new Date(m.created_at).getTime()).filter(t => !Number.isNaN(t));
  const span = times.length ? Math.max(...times) - Math.min(...times) : 0;
  if (span < MIN_CONVERSATION_SPAN_MS) {
    return { canRate: false, reason: 'too_recent' };
  }

  return { canRate: true, reason: null };
}

/**
 * Email the helper that a rating landed, and tell them how to dispute it.
 *
 * Reads the live review count so the mail can say whether the review is
 * actually on their profile yet (see lib/rating-visibility.js) — being told
 * "you were rated 1 star" without "and nobody can see it yet" would frighten
 * people for no reason.
 */
async function notifyHelperOfRating(supabase, helper_ref, employerName, stars, comment, ratingId) {
  const [{ data: helper }, { count }] = await Promise.all([
    supabase
      .from('helper_profiles')
      .select('first_name, email, notify_on_message')
      .eq('helper_ref', helper_ref)
      .single(),
    supabase
      .from('helper_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('helper_ref', helper_ref),
  ]);

  // notify_on_message is the helper's "leave me alone" switch. A review about
  // you is not marketing, but it is still their choice to be emailed.
  if (!helper?.email || helper.notify_on_message === false) return;

  // One-click dispute, no login. The people most likely to need it are the
  // least likely to still know their ref number, and someone who has just
  // been called a thief in public should not have to fight a login form
  // first. See lib/review-dispute.js.
  const disputeUrl = ratingId
    ? buildDisputeUrl(await createDisputeToken(ratingId, helper_ref))
    : null;

  await sendNewRatingNotification({
    recipientName: helper.first_name,
    recipientEmail: helper.email,
    employerName,
    stars,
    comment,
    isPublic: (count || 0) >= MIN_PUBLIC_REVIEWS,
    minPublicReviews: MIN_PUBLIC_REVIEWS,
    disputeUrl,
  });
}

/**
 * Tell the admin about a 1-2 star review, whether or not it is disputed.
 *
 * Publishing from review #1 means a revenge review is visible to everyone the
 * second it is written. The helper can dispute it, but only if they read
 * their email — this is the path that does not depend on them.
 */
async function alertAdminOfLowRating(supabase, helper_ref, employer_ref, employerName, stars, comment) {
  if (stars > 2) return;

  const [{ data: helper }, { count }] = await Promise.all([
    supabase
      .from('helper_profiles')
      .select('first_name')
      .eq('helper_ref', helper_ref)
      .single(),
    supabase
      .from('helper_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('helper_ref', helper_ref),
  ]);

  await sendLowRatingAlert({
    helperRef: helper_ref,
    helperName: helper?.first_name || null,
    employerRef: employer_ref,
    employerName,
    ratingStars: stars,
    comment,
    totalReviews: count || 1,
  });
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

    // Below MIN_PUBLIC_REVIEWS nothing is shown — not the average, not the
    // reviews themselves. Hiding only the average would leave a lone "she is
    // a scammer" sitting on the profile, which is the actual damage. The rows
    // are kept and keep counting; all of them appear together once the third
    // arrives. The author still gets myRating below, or a saved review would
    // look like it had failed. See lib/rating-visibility.js.
    const isPublic = rows.length >= MIN_PUBLIC_REVIEWS;
    const reviews = !isPublic ? [] : rows.map(r => ({
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
      // How many more are needed before any become public, so the UI can say
      // "not enough reviews yet" rather than "no reviews".
      pendingReviewCount: isPublic ? 0 : rows.length,
      minPublicReviews: MIN_PUBLIC_REVIEWS,
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

    // Tell the helper. Fire-and-forget: a mail failure must not fail the
    // rating, and the family should not wait on Resend. Before this the
    // subject of a review had no way of learning it existed — which is how a
    // false accusation of theft sat on a profile for two weeks.
    notifyHelperOfRating(supabase, cleanHelperRef, firstName, numStars, cleanComment, upserted.id)
      .catch(err => console.error('Rating notification failed:', err.message));

    alertAdminOfLowRating(supabase, cleanHelperRef, employer_ref, firstName, numStars, cleanComment)
      .catch(err => console.error('Low-rating alert failed:', err.message));

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
