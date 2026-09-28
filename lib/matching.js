// Who matches whom — the one definition of a match, shared by the server
// (match emails, LINE pushes, the digest cron) and the browser (the
// "Families looking for you" panel in the helper dashboard).
//
// It lives apart from lib/match-notifications.js on purpose: that module
// pulls in Supabase and Resend, which must never reach a client bundle.
// Everything here is pure — rows in, slugs out.
//
// Both shapes of a record are accepted: the snake_case database row the API
// routes work with (looking_for, additional_cities) and the camelCase card
// the browse endpoints return (lookingFor, additionalCities). Matching the
// same two people differently on the server and in the dashboard is how you
// end up mailing someone about a family they can't find.

import { toCitySlug, parseAdditionalCities } from './constants/cities';

// A comma-joined list of category slugs → array. Used for both
// employer.looking_for and helper.category, which share the same shape.
export function parseCategoryList(csv) {
  if (!csv) return [];
  return String(csv)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// Every city slug a helper can actually work in: their home city plus the
// optional "I can also travel to …" list. Nearly half of all helpers fill
// in additional_cities, so ignoring it hides them from most of their matches.
export function helperCitySlugs(helper) {
  const home = toCitySlug(helper?.city);
  const extraCsv = helper?.additional_cities ?? helper?.additionalCities;
  const extra = parseAdditionalCities(extraCsv, home).map(toCitySlug);
  return [...new Set([home, ...extra])].filter((c) => c && c !== 'other');
}

// helper_profiles.category is a comma-joined list for helpers who offer more
// than one service ("nanny, driver, elder_care") — the same shape as
// employer_accounts.looking_for. Comparing the raw column to a single slug
// misses every multi-service helper.
export function helperCategorySlugs(helper) {
  return parseCategoryList(helper?.category);
}

// What an employer is looking for, from either record shape.
export function employerWantedCategories(employer) {
  return parseCategoryList(employer?.looking_for ?? employer?.lookingFor);
}

// The cities and categories an employer and a helper have in common.
// Returns null when they don't overlap — callers use the shared values
// to label the notification with something the recipient recognises.
export function matchOverlap(employer, helper) {
  const empCity = toCitySlug(employer?.city);
  if (!empCity || empCity === 'other') return null;
  if (!helperCitySlugs(helper).includes(empCity)) return null;

  const wanted = employerWantedCategories(employer);
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

// A family who paused or hid their search doesn't want to hear from anyone —
// and shouldn't be offered to a helper as someone to write to. NULL (rows
// from before the column existed) counts as still searching.
export function employerIsSearching(employer) {
  const status = employer?.search_status ?? employer?.searchStatus;
  return status !== 'paused' && status !== 'hidden';
}

// The families a helper can usefully write to today: they overlap on city
// and service, and they are still looking. Newest first — a family who
// registered this week is far likelier to answer than one from March.
export function matchingEmployersFor(helper, employers) {
  if (!helper || !Array.isArray(employers)) return [];
  return employers
    .filter((e) => employerIsSearching(e) && matchOverlap(e, helper) !== null)
    .sort((a, b) => {
      const ta = new Date(a.createdAt || a.created_at || 0).getTime();
      const tb = new Date(b.createdAt || b.created_at || 0).getTime();
      return tb - ta;
    });
}
