// Match notifications: when a new helper or employer registers, find existing
// users on the opposite side whose city + category match, and send them an
// email — plus a LINE push when they have LINE connected.
// Non-blocking — callers wrap this in try/catch and never let a failure
// break the registration flow.
//
// Matching rules:
//   - City must match exactly (skip when either side is "other" — unknown city).
//   - Helper category must appear in employer.looking_for (comma-separated).
//     A helper whose category is "multiple" matches every employer in the city.
//   - Skip recipients with notify_on_message = false (respect email unsubscribe).
//   - Skip recipients that aren't email_verified (don't spam unverified accounts).
//   - LINE push goes out additionally when line_user_id is set AND
//     notify_via_line is true. Email and LINE are independent — a LINE
//     failure never blocks the email and vice versa.

import { getServiceSupabase } from './supabase';
import {
  sendNewHelperMatchEmail,
  sendNewEmployerMatchEmail,
} from './send-confirmation-email';
import { createUnsubscribeToken, buildUnsubscribeUrl } from './unsubscribe';
import { sendPush, templates as lineTemplates } from './line';
import { CATEGORIES } from './constants/categories';
import { formatCity } from './constants/cities';

// Recipients who got a match notification (immediate or digest) less than
// this many days ago are skipped — the digest cron will pick them up later.
// Keep this in sync with /api/cron/match-digest which uses the same window.
export const MATCH_COOLDOWN_DAYS = 3;

function isInCooldown(timestamp) {
  if (!timestamp) return false;
  const last = new Date(timestamp).getTime();
  if (Number.isNaN(last)) return false;
  const ageMs = Date.now() - last;
  return ageMs < MATCH_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
}

// Map a category slug (e.g. 'elder_care') to its English display label
// (e.g. 'Elder Care & Caregiver'). Falls back to the raw value if unknown
// so the LINE message is never blank.
function categoryLabel(slug) {
  if (!slug) return '';
  const cat = CATEGORIES.find((c) => c.value === String(slug).trim());
  return cat ? cat.en : String(slug);
}

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
    .select(
      'employer_ref, first_name, email, city, looking_for, notify_on_message, email_verified, ' +
      'line_user_id, notify_via_line, last_match_notification_at'
    )
    .eq('city', helper.city)
    .eq('email_verified', true);

  if (error) {
    console.error('Match notify (helper→employers) fetch error:', error);
    return { sent: 0, error: error.message };
  }

  const matches = (employers || []).filter((emp) => {
    if (!emp.email) return false;
    return employerMatchesHelper(emp, helper);
  });

  let sent = 0;
  let lineSent = 0;
  let cooldownSkipped = 0;
  for (const emp of matches) {
    // Cooldown — recipient was notified <3 days ago, defer to digest cron.
    if (isInCooldown(emp.last_match_notification_at)) {
      cooldownSkipped++;
      continue;
    }

    let didNotify = false;

    // Email — best-effort, gated by notify_on_message.
    if (emp.notify_on_message !== false) {
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
        didNotify = true;
      } catch (err) {
        console.error(`Match notify: failed to email employer ${emp.employer_ref}:`, err.message);
      }
    }

    // LINE push — independent of email; gated by notify_via_line + linked account.
    if (emp.line_user_id && emp.notify_via_line === true) {
      try {
        const messages = lineTemplates.newHelperMatch({
          city: formatCity(helper.city) || helper.city,
          categoryLabel: categoryLabel(helper.category),
          lang: 'both',
        });
        const r = await sendPush(emp.line_user_id, messages);
        if (r.ok) {
          lineSent++;
          didNotify = true;
        }
      } catch (err) {
        console.error(`Match notify: failed LINE push to employer ${emp.employer_ref}:`, err.message);
      }
    }

    // Stamp the cooldown only if at least one channel actually fired.
    if (didNotify) {
      await supabase
        .from('employer_accounts')
        .update({ last_match_notification_at: new Date().toISOString() })
        .eq('employer_ref', emp.employer_ref);
    }
  }

  return { sent, lineSent, cooldownSkipped, total: matches.length };
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
    .select(
      'helper_ref, first_name, email, city, category, notify_on_message, email_verified, status, ' +
      'line_user_id, notify_via_line, last_match_notification_at'
    )
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
    if (!hlp.email) return false;
    if (hlp.status && hlp.status !== 'active') return false;
    if (hlp.category === 'multiple') return true;
    return wanted.includes(hlp.category);
  });

  let sent = 0;
  let lineSent = 0;
  let cooldownSkipped = 0;
  for (const hlp of matches) {
    // Cooldown — recipient was notified <3 days ago, defer to digest cron.
    if (isInCooldown(hlp.last_match_notification_at)) {
      cooldownSkipped++;
      continue;
    }

    // Show the helper's own category as the "Looking for" label so the
    // notification feels targeted. Fall back to the employer's primary request.
    const displayCategory =
      hlp.category && hlp.category !== 'multiple' && wanted.includes(hlp.category)
        ? hlp.category
        : primary;

    let didNotify = false;

    // Email — best-effort, gated by notify_on_message.
    if (hlp.notify_on_message !== false) {
      try {
        const token = await createUnsubscribeToken('helper', hlp.helper_ref);
        const unsubscribeUrl = buildUnsubscribeUrl(token);
        await sendNewEmployerMatchEmail({
          recipientName: hlp.first_name || '',
          recipientEmail: hlp.email,
          employerFirstName: employer.first_name || 'A new family',
          employerCity: employer.city,
          lookingForCategory: displayCategory,
          unsubscribeUrl,
        });
        sent++;
        didNotify = true;
      } catch (err) {
        console.error(`Match notify: failed to email helper ${hlp.helper_ref}:`, err.message);
      }
    }

    // LINE push — independent of email; gated by notify_via_line + linked account.
    if (hlp.line_user_id && hlp.notify_via_line === true) {
      try {
        const messages = lineTemplates.newJobMatch({
          city: formatCity(employer.city) || employer.city,
          categoryLabel: categoryLabel(displayCategory),
          lang: 'both',
        });
        const r = await sendPush(hlp.line_user_id, messages);
        if (r.ok) {
          lineSent++;
          didNotify = true;
        }
      } catch (err) {
        console.error(`Match notify: failed LINE push to helper ${hlp.helper_ref}:`, err.message);
      }
    }

    // Stamp the cooldown only if at least one channel actually fired.
    if (didNotify) {
      await supabase
        .from('helper_profiles')
        .update({ last_match_notification_at: new Date().toISOString() })
        .eq('helper_ref', hlp.helper_ref);
    }
  }

  return { sent, lineSent, cooldownSkipped, total: matches.length };
}
