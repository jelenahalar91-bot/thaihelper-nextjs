// Match notifications: when a new helper or employer registers, find existing
// users on the opposite side whose city + category match, and send them an
// email. Non-blocking — callers wrap this in try/catch and never let a failure
// break the registration flow.
//
// Matching rules:
//   - City must match exactly (skip when either side is "other" — unknown city).
//   - Helper category must appear in employer.looking_for (comma-separated).
//     A helper whose category is "multiple" matches every employer in the city.
//   - Skip recipients with notify_on_message = false (respect unsubscribe).
//   - Skip recipients that aren't email_verified (don't spam unverified accounts).

import { getServiceSupabase } from './supabase';
import {
  sendNewHelperMatchEmail,
  sendNewEmployerMatchEmail,
} from './send-confirmation-email';
import { createUnsubscribeToken, buildUnsubscribeUrl } from './unsubscribe';

// Returns the list of helper categories an employer is looking for, parsed
// from the comma-joined string stored in employer_accounts.looking_for.
function parseLookingFor(lookingFor) {
  if (!lookingFor) return [];
  return lookingFor
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function employerMatchesHelper(employer, helper) {
  if (!employer.city || !helper.city) return false;
  if (employer.city === 'other' || helper.city === 'other') return false;
  if (employer.city !== helper.city) return false;

  // Helpers who offer "multiple" match any employer in the city.
  if (helper.category === 'multiple') return true;

  const wanted = parseLookingFor(employer.looking_for);
  return wanted.includes(helper.category);
}

// ─── NOTIFY EMPLOYERS OF NEW HELPER ─────────────────────────────────────────
// Called right after a new helper registers. Finds all verified, opted-in
// employers in the same city whose looking_for includes the helper's category
// (or matches "multiple"), and emails each one.
export async function notifyEmployersOfNewHelper(helper) {
  if (!process.env.RESEND_API_KEY) return { sent: 0, skipped: 'no_resend_key' };
  if (!helper?.city || !helper?.category) return { sent: 0, skipped: 'missing_fields' };
  if (helper.city === 'other') return { sent: 0, skipped: 'city_other' };

  const supabase = getServiceSupabase();

  const { data: employers, error } = await supabase
    .from('employer_accounts')
    .select('employer_ref, first_name, email, city, looking_for, notify_on_message, email_verified')
    .eq('city', helper.city)
    .eq('email_verified', true);

  if (error) {
    console.error('Match notify (helper→employers) fetch error:', error);
    return { sent: 0, error: error.message };
  }

  const matches = (employers || []).filter((emp) => {
    if (emp.notify_on_message === false) return false;
    if (!emp.email) return false;
    return employerMatchesHelper(emp, helper);
  });

  let sent = 0;
  for (const emp of matches) {
    try {
      const token = await createUnsubscribeToken('employer', emp.employer_ref);
      const unsubscribeUrl = buildUnsubscribeUrl(token);
      await sendNewHelperMatchEmail({
        recipientName: emp.first_name || '',
        recipientEmail: emp.email,
        helperFirstName: helper.first_name || 'A new helper',
        helperCity: helper.city,
        helperCategory: helper.category,
        unsubscribeUrl,
      });
      sent++;
    } catch (err) {
      console.error(`Match notify: failed to email employer ${emp.employer_ref}:`, err.message);
    }
  }

  return { sent, total: matches.length };
}

// ─── NOTIFY HELPERS OF NEW EMPLOYER ─────────────────────────────────────────
// Called right after a new employer registers. Finds all verified, opted-in
// helpers in the same city whose category is in the employer's looking_for
// list (or whose category is "multiple"), and emails each one.
export async function notifyHelpersOfNewEmployer(employer) {
  if (!process.env.RESEND_API_KEY) return { sent: 0, skipped: 'no_resend_key' };
  if (!employer?.city) return { sent: 0, skipped: 'missing_city' };
  if (employer.city === 'other') return { sent: 0, skipped: 'city_other' };

  const wanted = parseLookingFor(employer.looking_for);
  if (wanted.length === 0) return { sent: 0, skipped: 'no_looking_for' };

  const supabase = getServiceSupabase();

  // Pull helpers in the same city — we filter on category in JS (categories
  // list is short, this avoids a complex IN-clause with "multiple" wildcard).
  const { data: helpers, error } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, email, city, category, notify_on_message, email_verified, status')
    .eq('city', employer.city)
    .eq('email_verified', true);

  if (error) {
    console.error('Match notify (employer→helpers) fetch error:', error);
    return { sent: 0, error: error.message };
  }

  // Primary category the employer is looking for — first item wins for the
  // "Looking for" label in the email. Helpers whose category is "multiple"
  // get notified about every employer regardless of wanted list.
  const primary = wanted[0];

  const matches = (helpers || []).filter((hlp) => {
    if (hlp.notify_on_message === false) return false;
    if (!hlp.email) return false;
    if (hlp.status && hlp.status !== 'active') return false;
    if (hlp.category === 'multiple') return true;
    return wanted.includes(hlp.category);
  });

  let sent = 0;
  for (const hlp of matches) {
    try {
      const token = await createUnsubscribeToken('helper', hlp.helper_ref);
      const unsubscribeUrl = buildUnsubscribeUrl(token);
      // Show the helper's own category as the "Looking for" label so the
      // email feels targeted. Fall back to the employer's primary request.
      const displayCategory =
        hlp.category && hlp.category !== 'multiple' && wanted.includes(hlp.category)
          ? hlp.category
          : primary;
      await sendNewEmployerMatchEmail({
        recipientName: hlp.first_name || '',
        recipientEmail: hlp.email,
        employerFirstName: employer.first_name || 'A new family',
        employerCity: employer.city,
        lookingForCategory: displayCategory,
        unsubscribeUrl,
      });
      sent++;
    } catch (err) {
      console.error(`Match notify: failed to email helper ${hlp.helper_ref}:`, err.message);
    }
  }

  return { sent, total: matches.length };
}
