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
import {
  formatCity,
  toCitySlug,
  cityQueryVariants,
  parseAdditionalCities,
} from './constants/cities';

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

// Every city slug a helper can actually work in: their home city plus the
// optional "I can also travel to …" list. Nearly half of all helpers fill
// in additional_cities, so ignoring it hides them from most of their matches.
export function helperCitySlugs(helper) {
  const home = toCitySlug(helper?.city);
  const extra = parseAdditionalCities(helper?.additional_cities, home).map(toCitySlug);
  return [...new Set([home, ...extra])].filter((c) => c && c !== 'other');
}

// helper_profiles.category is a comma-joined list for helpers who offer more
// than one service ("nanny, driver, elder_care") — the same shape as
// employer_accounts.looking_for. Comparing the raw column to a single slug
// misses every multi-service helper.
export function helperCategorySlugs(helper) {
  return parseLookingFor(helper?.category);
}

// The cities and categories an employer and a helper have in common.
// Returns nulls when they don't overlap — callers use the shared values
// to label the notification with something the recipient recognises.
export function matchOverlap(employer, helper) {
  const empCity = toCitySlug(employer.city);
  if (!empCity || empCity === 'other') return null;
  if (!helperCitySlugs(helper).includes(empCity)) return null;

  const wanted = parseLookingFor(employer.looking_for);
  const offered = helperCategorySlugs(helper);
  if (offered.length === 0) return null;

  // Legacy "multiple" helpers match anything the employer is looking for.
  if (offered.includes('multiple')) {
    return { city: empCity, category: wanted[0] || 'multiple' };
  }
  const sharedCategory = offered.find((c) => wanted.includes(c));
  if (!sharedCategory) return null;

  return { city: empCity, category: sharedCategory };
}

function employerMatchesHelper(employer, helper) {
  return matchOverlap(employer, helper) !== null;
}

// ─── NOTIFY EMPLOYERS OF NEW HELPER ─────────────────────────────────────────
// Called right after a new helper registers. Finds all verified, opted-in
// employers in any city the helper covers (home + additional_cities) whose
// looking_for overlaps the helper's categories, and emails each one.
export async function notifyEmployersOfNewHelper(helper) {
  if (!process.env.RESEND_API_KEY) return { sent: 0, skipped: 'no_resend_key' };
  if (!helper?.city || !helper?.category) return { sent: 0, skipped: 'missing_fields' };
  const coveredCities = helperCitySlugs(helper);
  if (coveredCities.length === 0) return { sent: 0, skipped: 'city_other' };
  // Don't advertise a helper who hid their profile.
  if (helper.availability_status === 'hidden') return { sent: 0, skipped: 'helper_hidden' };

  const supabase = getServiceSupabase();

  // One query across every city the helper covers. Employers store display
  // names, so widen each slug to its spellings before filtering.
  const cityFilter = [...new Set(coveredCities.flatMap(cityQueryVariants))];

  const { data: employers, error } = await supabase
    .from('employer_accounts')
    .select(
      'employer_ref, first_name, email, city, looking_for, notify_on_message, email_verified, ' +
      'search_status, line_user_id, notify_via_line, last_match_notification_at'
    )
    .in('city', cityFilter)
    .eq('email_verified', true);

  if (error) {
    console.error('Match notify (helper→employers) fetch error:', error);
    return { sent: 0, error: error.message };
  }

  // Keep the overlap alongside each match so the email/LINE message names
  // the city and service this employer actually asked for — not the helper's
  // raw multi-service CSV or a travel-to city the employer doesn't live in.
  const matches = [];
  for (const emp of employers || []) {
    if (!emp.email) continue;
    // Skip employers who paused or hid their search — they don't want
    // new-helper alerts. NULL (pre-migration) counts as 'searching'.
    if (emp.search_status === 'paused' || emp.search_status === 'hidden') continue;
    const overlap = matchOverlap(emp, helper);
    if (overlap) matches.push({ emp, overlap });
  }

  let sent = 0;
  let lineSent = 0;
  let cooldownSkipped = 0;
  for (const { emp, overlap } of matches) {
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
          helperCity: overlap.city,
          helperCategory: overlap.category,
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
          city: formatCity(overlap.city) || overlap.city,
          categoryLabel: categoryLabel(overlap.category),
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

// Fetch every helper who can work in `city` — either as their home city or
// via additional_cities. Postgres can't intersect the comma-joined list, so
// the ilike is a deliberately wide prefilter: matchOverlap() narrows it again
// in JS. Two queries instead of one `.or()` string keeps the slug quoting
// (values like "Koh Samui" contain a space) out of PostgREST's filter grammar.
export async function fetchHelpersCoveringCity(supabase, city, columns, opts = {}) {
  const slug = toCitySlug(city);
  if (!slug || slug === 'other') return { data: [], error: null };

  const withFilters = (q) => {
    let out = q.select(columns).eq('email_verified', true);
    if (opts.verifiedSince) out = out.gt('email_verified_at', opts.verifiedSince);
    if (opts.limit) out = out.limit(opts.limit);
    return out;
  };

  const [home, travelling] = await Promise.all([
    withFilters(supabase.from('helper_profiles')).in('city', cityQueryVariants(city)),
    withFilters(supabase.from('helper_profiles')).ilike('additional_cities', `%${slug}%`),
  ]);

  const error = home.error || travelling.error;
  if (error) return { data: [], error };

  const byRef = new Map();
  for (const row of [...(home.data || []), ...(travelling.data || [])]) {
    byRef.set(row.helper_ref, row);
  }
  return { data: [...byRef.values()], error: null };
}

// ─── NOTIFY HELPERS OF NEW EMPLOYER ─────────────────────────────────────────
// Called right after a new employer registers. Finds all verified, opted-in
// helpers in the same city whose category is in the employer's looking_for
// list (or whose category is "multiple"), and emails each one.
export async function notifyHelpersOfNewEmployer(employer) {
  if (!process.env.RESEND_API_KEY) return { sent: 0, skipped: 'no_resend_key' };
  if (!employer?.city) return { sent: 0, skipped: 'missing_city' };
  if (toCitySlug(employer.city) === 'other') return { sent: 0, skipped: 'city_other' };

  const wanted = parseLookingFor(employer.looking_for);
  if (wanted.length === 0) return { sent: 0, skipped: 'no_looking_for' };

  const supabase = getServiceSupabase();

  // Pull helpers who live in the employer's city OR list it under
  // additional_cities, then filter on category in JS (categories are a
  // comma-joined list, which SQL can't intersect cleanly).
  const { data: helpers, error } = await fetchHelpersCoveringCity(
    supabase,
    employer.city,
    'helper_ref, first_name, email, city, category, additional_cities, notify_on_message, ' +
    'email_verified, status, availability_status, line_user_id, notify_via_line, ' +
    'last_match_notification_at'
  );

  if (error) {
    console.error('Match notify (employer→helpers) fetch error:', error);
    return { sent: 0, error: error.message };
  }

  // Primary category the employer is looking for — used as the "Looking for"
  // label when the helper offers several services.
  const primary = wanted[0];

  const matches = (helpers || []).filter((hlp) => {
    if (!hlp.email) return false;
    if (hlp.status && hlp.status !== 'active') return false;
    // Helper took their profile offline — no new-family alerts.
    if (hlp.availability_status === 'hidden') return false;
    return employerMatchesHelper(employer, hlp);
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

    // Show the service this family actually wants from THIS helper so the
    // notification feels targeted. Falls back to the employer's first request.
    const displayCategory = matchOverlap(employer, hlp)?.category || primary;

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
