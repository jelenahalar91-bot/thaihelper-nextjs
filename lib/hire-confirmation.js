// Recording that a job happened.
//
// Extracted from pages/api/hire-confirmation.js on 2026-10-14 so the same
// statement can be made from more than one place: the button under the chat
// (the original), and the "why are you hiding your profile?" prompt on both
// dashboards (lib/../pages/api/hiring-outcome.js). Before this, hiring was
// recorded only when a helper happened to find a button inside a
// conversation she might never reopen.
//
// Two authors, two behaviours:
//
//   helper says "I work for them"  → row + ONE email to the family asking
//                                    for a review (if they are eligible to
//                                    write one — see checkEligibility).
//   family says "yes, we hired X"  → row, no email. The family is already
//                                    here; the review form is on the same
//                                    screen.
//
// UNIQUE(helper_ref, employer_ref) means the pair is recorded once, whoever
// speaks first. A second statement from the other side is not an error; it
// is simply already known.

import { sendHireConfirmedEmail } from './emails/hire-confirmation';
import { createUnsubscribeToken, buildUnsubscribeUrl } from './unsubscribe';
import { checkEligibility } from './rating-eligibility';

/**
 * Record a hire. Returns { ok, alreadyConfirmed } or { ok: false, error }.
 *
 * `confirmedBy` is 'helper' or 'employer'. Only the helper's statement
 * triggers the review-request email — the reasons are above.
 */
export async function recordHireConfirmation(supabase, { helperRef, employerRef, confirmedBy }) {
  // Insert first, mail second. If the insert loses the race the row already
  // exists and we stop — better a missing email than a family told twice.
  const { data: inserted, error } = await supabase
    .from('hire_confirmations')
    .insert({ helper_ref: helperRef, employer_ref: employerRef, confirmed_by: confirmedBy })
    .select()
    .maybeSingle();

  if (error) {
    // 23505 = unique violation: this pair is already recorded.
    if (error.code === '23505') return { ok: true, alreadyConfirmed: true };
    console.error('Hire confirmation insert error:', error);
    return { ok: false, error: 'Could not save that. Please try again.' };
  }

  if (confirmedBy !== 'helper') return { ok: true, alreadyConfirmed: false };

  const [{ data: employer }, { data: helper }] = await Promise.all([
    supabase
      .from('employer_accounts')
      .select('first_name, email, notify_on_message')
      .eq('employer_ref', employerRef)
      .single(),
    supabase
      .from('helper_profiles')
      .select('first_name')
      .eq('helper_ref', helperRef)
      .single(),
  ]);

  // Do not invite a family to rate someone the rating box will refuse them.
  // Helpers misread this button: of the first nine presses, three came from
  // helpers who had only applied or asked a question, one of them to a
  // family suspended for scam days earlier. Those families would have been
  // asked to review a stranger, found no box, and trusted us slightly less.
  const { canRate } = await checkEligibility(supabase, employerRef, helperRef);

  if (canRate && employer?.email && employer.notify_on_message !== false) {
    try {
      const token = await createUnsubscribeToken('employer', employerRef);
      await sendHireConfirmedEmail({
        employerName: employer.first_name,
        employerEmail: employer.email,
        helperName: helper?.first_name,
        helperRef,
        unsubscribeUrl: buildUnsubscribeUrl(token),
      });
      await supabase
        .from('hire_confirmations')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', inserted.id);
    } catch (err) {
      // The confirmation itself stands — it is real data about a real hire
      // either way, and notified_at staying null is how we find the ones
      // that never went out.
      console.error('Hire confirmation email failed:', err.message);
    }
  }

  return { ok: true, alreadyConfirmed: false };
}

/**
 * The two must actually have a conversation here. Not proof of a job —
 * nothing can be — but it stops either button from reaching someone the
 * speaker never met.
 */
export async function haveConversation(supabase, helperRef, employerRef) {
  const { data } = await supabase
    .from('conversations')
    .select('id')
    .eq('helper_ref', helperRef)
    .eq('employer_id', employerRef)
    .limit(1);
  return !!(data && data.length);
}
