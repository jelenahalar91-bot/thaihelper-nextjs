/**
 * Validation for the /partners directory application.
 *
 * One module, used by both sides: the form imports it to show errors as the
 * user types, the API route imports it to decide what actually gets stored.
 * The server call is the authoritative one — the client copy is a courtesy.
 *
 * Errors come back as short codes rather than sentences, because the form is
 * bilingual (EN/TH) and the wording lives in the page's own `T` object.
 *
 * Why these rules, from the November 2026 review of the first seven
 * applications:
 *   - `contactName` rejects digits. One applicant typed "+974  70939845" into
 *     the contact field and left the real name blank.
 *   - `phone` is split into a dial-code dropdown and a local number, so a
 *     non-Thai number is visible at a glance instead of being pasted bare.
 *   - `lineId` is its own field. One applicant put a line.me URL in `phone`.
 *   - `city` is required: directory_listings.city is NOT NULL, so without it
 *     an approved application can never become a listing.
 *   - website OR googleMapsUrl is required. This is the strongest spam filter
 *     we have — a company with neither is almost never a real business.
 *   - `description` has a floor of 100 characters. Blind applicants quit here;
 *     genuine ones write their own listing copy for us.
 */

import { DIRECTORY_TYPE_VALUES, DIRECTORY_LANGUAGES, NATIONALITIES_PLACED } from '@/lib/constants/directory';
import { VALID_CITY_SLUGS } from '@/lib/constants/cities';
import { PHONE_COUNTRY_CODES } from '@/lib/constants/phone-countries';

export const MIN_DESCRIPTION = 100;
export const MAX_DESCRIPTION = 2000;
export const MAX_CITIES_SERVED = 5;

/** Types that get asked which nationalities they place. */
export const PLACEMENT_TYPES = ['agency', 'mou_agency'];

// Same country list the signup phone-verification step offers, so a company
// is never asked to pick a code that the rest of the site doesn't know.
export const DEFAULT_DIAL = '+66';
const DIAL_CODES = PHONE_COUNTRY_CODES.map(c => c.code);

const LANGUAGE_VALUES = DIRECTORY_LANGUAGES.map(o => o.value);
const NATIONALITY_VALUES = NATIONALITIES_PLACED.map(o => o.value);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Any digit, including Thai numerals — a name field has no business holding one.
const DIGIT_RE = /[0-9๐-๙]/;

const trim = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Accept a URL with or without a scheme and return it normalised to https://,
 * or '' when it isn't a usable web address. Rejects anything that isn't
 * http(s) so a "javascript:" or "mailto:" can't reach the admin email.
 */
export function normalizeUrl(value) {
  const raw = trim(value);
  if (!raw) return '';
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed;
  try {
    parsed = new URL(withScheme);
  } catch {
    return '';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
  // A bare "foo" parses fine as a hostname; insist on a dotted domain.
  if (!parsed.hostname.includes('.')) return '';
  return parsed.toString();
}

/** Keep only allowed slugs from an array or CSV, dedup, re-join as CSV. */
function csvOf(value, allowed, limit = 50) {
  const items = Array.isArray(value) ? value : String(value || '').split(',');
  const seen = new Set();
  for (const raw of items) {
    const s = String(raw).trim().toLowerCase();
    if (s && allowed.includes(s)) seen.add(s);
    if (seen.size >= limit) break;
  }
  return [...seen].join(',');
}

function citiesCsv(value, primary) {
  const items = Array.isArray(value) ? value : String(value || '').split(',');
  const seen = new Set();
  for (const raw of items) {
    const s = String(raw).trim().toLowerCase();
    if (s && s !== primary && VALID_CITY_SLUGS.has(s)) seen.add(s);
    if (seen.size >= MAX_CITIES_SERVED) break;
  }
  return [...seen].join(',');
}

/**
 * Validate a raw application body.
 *
 * Returns { ok, errors, clean } where `errors` maps field name → error code
 * and `clean` is the normalised application (only meaningful when ok).
 */
export function validateApplication(body = {}) {
  const errors = {};

  const companyName = trim(body.companyName).slice(0, 120);
  if (companyName.length < 2) errors.companyName = 'required';

  const contactName = trim(body.contactName).slice(0, 80);
  if (contactName.length < 2) errors.contactName = 'required';
  else if (DIGIT_RE.test(contactName)) errors.contactName = 'no_digits';

  const email = trim(body.email).toLowerCase().slice(0, 160);
  if (!email) errors.email = 'required';
  else if (!EMAIL_RE.test(email)) errors.email = 'bad_email';

  const phoneDial = DIAL_CODES.includes(trim(body.phoneDial)) ? trim(body.phoneDial) : DEFAULT_DIAL;
  // Strip everything a human might decorate a number with, then count digits.
  const phoneLocal = trim(body.phoneLocal).replace(/[^\d]/g, '').replace(/^0+/, '').slice(0, 15);
  if (!phoneLocal) errors.phoneLocal = 'required';
  else if (phoneLocal.length < 6) errors.phoneLocal = 'bad_phone';

  const lineId = trim(body.lineId).replace(/^@/, '').slice(0, 60);

  const type = DIRECTORY_TYPE_VALUES.includes(body.type) ? body.type : '';
  if (!type) errors.type = 'required';

  const city = trim(body.city).toLowerCase();
  if (!city) errors.city = 'required';
  else if (!VALID_CITY_SLUGS.has(city)) errors.city = 'bad_city';

  const citiesServed = citiesCsv(body.citiesServed, city);

  // The spam filter: a real company has a website, a Facebook page or at
  // least a pin on Google Maps. Either link satisfies the rule.
  const website = normalizeUrl(body.website);
  const googleMapsUrl = normalizeUrl(body.googleMapsUrl);
  if (!website && !googleMapsUrl) {
    errors.website = 'link_required';
  } else {
    if (trim(body.website) && !website) errors.website = 'bad_url';
    if (trim(body.googleMapsUrl) && !googleMapsUrl) errors.googleMapsUrl = 'bad_url';
  }

  const description = trim(body.description).slice(0, MAX_DESCRIPTION);
  if (!description) errors.description = 'required';
  else if (description.length < MIN_DESCRIPTION) errors.description = 'too_short';

  const licenseNumber = trim(body.licenseNumber).slice(0, 80);
  const languagesSpoken = csvOf(body.languagesSpoken, LANGUAGE_VALUES);
  const nationalitiesPlaced = PLACEMENT_TYPES.includes(type)
    ? csvOf(body.nationalitiesPlaced, NATIONALITY_VALUES)
    : '';

  const pricingUrl = normalizeUrl(body.pricingUrl);
  if (trim(body.pricingUrl) && !pricingUrl) errors.pricingUrl = 'bad_url';

  // Explicit, checkbox-level confirmation. Not a legal device — a speed bump
  // that makes "we spray every directory we can find" an active lie.
  if (body.operatesInThailand !== true && body.operatesInThailand !== 'true') {
    errors.operatesInThailand = 'required';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    clean: {
      companyName,
      contactName,
      email,
      phoneDial,
      phoneLocal,
      phone: `${phoneDial} ${phoneLocal}`,
      lineId,
      type,
      city,
      citiesServed,
      website,
      googleMapsUrl,
      description,
      licenseNumber,
      languagesSpoken,
      nationalitiesPlaced,
      pricingUrl,
    },
  };
}

/**
 * The validated application as a directory_listings row draft — the same
 * snake_case shape sanitizeListingInput() produces, so onboarding can prefill
 * the company's listing form from it without a translation step.
 */
export function toListingDraft(clean) {
  return {
    name: clean.companyName,
    type: clean.type,
    city: clean.city,
    cities_served: clean.citiesServed,
    phone: clean.phone,
    email: clean.email,
    website: clean.website,
    google_maps_url: clean.googleMapsUrl,
    description: clean.description,
    line_id: clean.lineId,
    license_number: clean.licenseNumber,
    languages_spoken: clean.languagesSpoken,
    nationalities_placed: clean.nationalitiesPlaced,
    pricing_url: clean.pricingUrl,
  };
}

/**
 * Which of the things we care about an application is still missing. Drives
 * the "we need more information" email so it asks for exactly what's absent
 * rather than sending a generic form letter.
 */
export function missingDetails(draft = {}, account = {}) {
  const missing = [];
  if (!draft.city) missing.push('city');
  if (!draft.website && !draft.google_maps_url) missing.push('link');
  if (!draft.description || draft.description.length < MIN_DESCRIPTION) missing.push('description');
  if (!draft.phone && !account.phone) missing.push('phone');
  if (!account.contact_name || DIGIT_RE.test(account.contact_name)) missing.push('contact');
  if (!draft.type && !account.type) missing.push('type');
  return missing;
}
