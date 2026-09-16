// GET  /api/review-dispute?t=<token>  → the review the token points at
// POST /api/review-dispute { token, reason } → flag it, alert the admin
//
// Reached from the link in the "someone rated you" email. No session: the
// signed token IS the authorisation, and it names exactly one review
// (lib/review-dispute.js). A helper who lost their ref number can still
// defend themselves.
//
// Disputing does NOT hide the review. Hiding on the accused person's say-so
// would hand the same weapon to whoever shouts first — every helper with a
// bad review would simply press the button. What it buys is speed: the admin
// mail lands immediately, and a false review can be deleted in minutes
// instead of whenever a support reply gets read.

import { getServiceSupabase } from '../../lib/supabase';
import { verifyDisputeToken } from '../../lib/review-dispute';
import { sendRatingDisputeAlert } from '../../lib/emails/rating-alerts';

const MAX_REASON = 1000;

async function loadReview(supabase, token) {
  const claim = await verifyDisputeToken(token);
  if (!claim) return { error: 'This link is not valid. Please reply to the email instead.' };

  const { data: rating } = await supabase
    .from('helper_ratings')
    .select('id, helper_ref, employer_ref, employer_first_name, stars, comment, created_at, disputed_at')
    .eq('id', claim.ratingId)
    .single();

  // Gone means it was already removed — the best possible outcome, and the
  // page says so rather than showing an error.
  if (!rating) return { removed: true };

  // The token names the helper as well as the review, so a token can never be
  // pointed at someone else's review even if the id were guessed.
  if (rating.helper_ref !== claim.helperRef) {
    return { error: 'This link is not valid. Please reply to the email instead.' };
  }

  return { rating };
}

export default async function handler(req, res) {
  const supabase = getServiceSupabase();

  if (req.method === 'GET') {
    const { rating, removed, error } = await loadReview(supabase, String(req.query.t || ''));
    if (error) return res.status(400).json({ error });
    if (removed) return res.status(200).json({ removed: true });

    const { data: helper } = await supabase
      .from('helper_profiles')
      .select('first_name')
      .eq('helper_ref', rating.helper_ref)
      .single();

    return res.status(200).json({
      review: {
        stars: rating.stars,
        comment: rating.comment || '',
        employerFirstName: rating.employer_first_name || 'A family',
        createdAt: rating.created_at,
        alreadyDisputed: !!rating.disputed_at,
      },
      helperName: helper?.first_name || null,
    });
  }

  if (req.method === 'POST') {
    const { token, reason } = req.body || {};
    const { rating, removed, error } = await loadReview(supabase, String(token || ''));
    if (error) return res.status(400).json({ error });
    if (removed) return res.status(200).json({ removed: true });

    const cleanReason = String(reason || '').trim().slice(0, MAX_REASON);

    // Re-disputing overwrites the reason rather than being refused: someone
    // who presses the button twice is trying to add something, not attack.
    const { error: updateError } = await supabase
      .from('helper_ratings')
      .update({ disputed_at: new Date().toISOString(), dispute_reason: cleanReason || null })
      .eq('id', rating.id);

    if (updateError) {
      console.error('Dispute update error:', updateError);
      return res.status(500).json({ error: 'Could not record this. Please reply to the email instead.' });
    }

    const { data: helper } = await supabase
      .from('helper_profiles')
      .select('first_name')
      .eq('helper_ref', rating.helper_ref)
      .single();

    // The alert is the point of the whole flow, but it must not swallow the
    // helper's confirmation if Resend is down — the dispute is already saved.
    sendRatingDisputeAlert({
      helperRef: rating.helper_ref,
      helperName: helper?.first_name || null,
      employerRef: rating.employer_ref,
      employerName: rating.employer_first_name || null,
      ratingStars: rating.stars,
      comment: rating.comment || '',
      reason: cleanReason,
    }).catch(err => console.error('Dispute alert failed:', err.message));

    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
