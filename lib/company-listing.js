// Shared sanitiser for company-editable directory listing fields.
// Used by both onboarding (/api/company-onboard) and the dashboard
// (/api/company-listing) so the whitelist + validation live in one place.

import { resolveAreaInput, MAX_AREA_OTHER } from './constants/areas';
import {
  DIRECTORY_TYPE_VALUES,
  SPECIALTY_VALUES,
  DIRECTORY_LANGUAGES,
  NATIONALITIES_PLACED,
} from '@/lib/constants/directory';

const CITY_SLUG_RE = /^[a-z0-9_-]{2,40}$/;
const LANGUAGE_VALUES = DIRECTORY_LANGUAGES.map(o => o.value);
const NATIONALITY_VALUES = NATIONALITIES_PLACED.map(o => o.value);

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Keep only allowed slugs from a CSV (or array), dedup, re-join as CSV.
function csv(value, allowed) {
  const items = Array.isArray(value)
    ? value
    : String(value || '').split(',');
  const seen = new Set();
  const out = [];
  for (const raw of items) {
    const s = String(raw).trim().toLowerCase();
    if (s && allowed.includes(s) && !seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out.join(',');
}

// Free-text "Other" for languages / nationalities: a short comma list of
// plain words. The fixed chips stay the filterable part of a listing; this
// only shows what a company offers beyond them, so it is kept to a handful
// of short labels rather than a second description field.
export function otherList(value) {
  if (typeof value !== 'string') return '';
  const seen = new Set();
  const out = [];
  for (const raw of value.split(/[,;\n]/)) {
    const s = raw.replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
    const key = s.toLowerCase();
    if (s && !seen.has(key) && out.length < 6) { seen.add(key); out.push(s); }
  }
  return out.join(', ');
}

// City CSV is looser (directory uses provincial slugs not in the helper
// city list) — accept anything that looks like a slug.
function citiesCsv(value) {
  const items = Array.isArray(value) ? value : String(value || '').split(',');
  const seen = new Set();
  const out = [];
  for (const raw of items) {
    const s = String(raw).trim().toLowerCase();
    if (CITY_SLUG_RE.test(s) && !seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out.join(',');
}

// ─── Prices ────────────────────────────────────────────────────────────────
// The same package shape we use when we copy an agency's price page by hand
// (scripts/supabase-directory-pricing.sql). Every field we write by hand is
// accepted here too, including the ones the company's form does not show
// (Thai names, minimum months) — otherwise a company that corrects one price
// on an entry we wrote would silently delete the rest of it.
export const PRICE_PERIODS = ['one_time', 'monthly', 'hourly', 'daily', 'per_visit'];
export const PAYMENT_FLOWS = ['helper_direct', 'via_agency', 'both'];
export const MAX_PRICE_PACKAGES = 10;

function wholeNumber(v, min, max) {
  if (v === '' || v == null) return null;
  const n = Math.round(Number(String(v).replace(/[,\s฿]/g, '')));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/** Array of clean packages, or null when the body carried no price list. */
export function sanitizePricing(raw) {
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const p of raw) {
    if (!p || typeof p !== 'object') continue;
    const name = str(p.name, 100);
    if (!name) continue;
    const pkg = { name, period: PRICE_PERIODS.includes(p.period) ? p.period : 'one_time' };
    const label = str(p.price_label, 60);
    if (label) {
      // "1 month's salary" — a real published price, just not one in baht.
      pkg.price_label = label;
      if (str(p.price_label_th, 60)) pkg.price_label_th = str(p.price_label_th, 60);
    } else {
      const price = wholeNumber(p.price_thb, 0, 10_000_000);
      if (price != null) {
        pkg.price_thb = price;
        const max = wholeNumber(p.price_max_thb, 0, 10_000_000);
        if (max != null && max > price) pkg.price_max_thb = max;
      }
      // Neither a label nor a number: shown as "On request".
    }
    if (str(p.name_th, 100)) pkg.name_th = str(p.name_th, 100);
    if (str(p.includes, 300)) pkg.includes = str(p.includes, 300);
    if (str(p.includes_th, 300)) pkg.includes_th = str(p.includes_th, 300);
    const days = wholeNumber(p.replacement_days, 1, 730);
    if (days != null) pkg.replacement_days = days;
    const months = wholeNumber(p.min_months, 1, 60);
    if (months != null) pkg.min_months = months;
    out.push(pkg);
    if (out.length >= MAX_PRICE_PACKAGES) break;
  }
  return out;
}

// A link a family can click: http(s) only, with a real host.
function webUrl(v, max = 300) {
  let s = str(v, max);
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u.toString() : '';
  } catch { return ''; }
}

/**
 * Turn raw request body into a snake_case object of validated columns.
 * Only whitelisted keys survive. `name` is required by the caller.
 */
export function sanitizeListingInput(body = {}) {
  const out = {
    name:        str(body.name, 120),
    name_th:     str(body.nameTh ?? body.name_th, 120),
    type:        DIRECTORY_TYPE_VALUES.includes(body.type) ? body.type : 'service_company',
    city:        CITY_SLUG_RE.test(String(body.city || '').toLowerCase()) ? String(body.city).toLowerCase() : '',
    cities_served: citiesCsv(body.citiesServed ?? body.cities_served),
    address:     str(body.address, 200),
    phone:       str(body.phone, 60),
    email:       str(body.email, 160),
    website:     str(body.website, 200),
    google_maps_url: str(body.googleMapsUrl ?? body.google_maps_url, 300),
    description:    str(body.description, 2000),
    description_th: str(body.descriptionTh ?? body.description_th, 2000),
    specialties:    csv(body.specialties, SPECIALTY_VALUES),
    languages_spoken: csv(body.languagesSpoken ?? body.languages_spoken, LANGUAGE_VALUES),
    languages_other: otherList(body.languagesOther ?? body.languages_other),
    whatsapp:    str(body.whatsapp, 60),
    line_id:     str(body.lineId ?? body.line_id, 60),
    license_number: str(body.licenseNumber ?? body.license_number, 80),
    opening_hours:  str(body.openingHours ?? body.opening_hours, 200),
    nationalities_placed: csv(body.nationalitiesPlaced ?? body.nationalities_placed, NATIONALITY_VALUES),
    nationalities_other: otherList(body.nationalitiesOther ?? body.nationalities_other),
  };
  // Areas the company covers inside its main city: clicked chips + an "Other"
  // line, cleaned against that city's list (lib/constants/areas.js). Empty
  // means the whole city.
  const areas = resolveAreaInput(out.city, {
    areaSlugs: body.areaSlugs ?? body.area_slugs ?? '',
    areaOther: str(body.areaOther ?? body.area_other, MAX_AREA_OTHER),
  });
  out.area_slugs = areas.area_slugs || '';
  out.area_other = areas.area || '';
  // Prices. `null` / '' mean "this form said nothing about it", which lets
  // onboarding fall back to the application and to an entry being taken over
  // (fillBlanks); an empty array is a company that removed its packages.
  out.pricing = sanitizePricing(body.pricing);
  out.payment_flow = PAYMENT_FLOWS.includes(body.paymentFlow ?? body.payment_flow)
    ? (body.paymentFlow ?? body.payment_flow) : null;
  out.pricing_url = webUrl(body.pricingUrl ?? body.pricing_url);
  // Logo is set via the upload endpoint, but accept a passed URL too.
  if (typeof body.logoUrl === 'string' || typeof body.logo_url === 'string') {
    out.logo_url = str(body.logoUrl ?? body.logo_url, 400);
  }
  return out;
}

// Map a listing row to the camelCase shape the dashboard form expects.
export function toEditableListing(row = {}) {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    name: row.name || '',
    nameTh: row.name_th || '',
    type: row.type || '',
    city: row.city || '',
    citiesServed: row.cities_served || '',
    areaSlugs: row.area_slugs || '',
    areaOther: row.area_other || '',
    address: row.address || '',
    phone: row.phone || '',
    email: row.email || '',
    website: row.website || '',
    googleMapsUrl: row.google_maps_url || '',
    description: row.description || '',
    descriptionTh: row.description_th || '',
    specialties: row.specialties || '',
    languagesSpoken: row.languages_spoken || '',
    languagesOther: row.languages_other || '',
    whatsapp: row.whatsapp || '',
    lineId: row.line_id || '',
    licenseNumber: row.license_number || '',
    openingHours: row.opening_hours || '',
    nationalitiesPlaced: row.nationalities_placed || '',
    nationalitiesOther: row.nationalities_other || '',
    pricing: Array.isArray(row.pricing) ? row.pricing : [],
    paymentFlow: row.payment_flow || '',
    pricingUrl: row.pricing_url || '',
    logoUrl: row.logo_url || '',
  };
}

/** Slugify a company name into a URL-safe directory slug. */
export function slugifyName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'company';
}

/**
 * What to write alongside a company's own save of its price list.
 *
 * The public page says where a price table came from — "taken from the
 * company's price page on …" for the ones we copied, "entered by the company
 * on …" for the ones they typed. That line may only change when the packages
 * actually did: a company that fixes its phone number has not vouched for
 * prices we read off its website a month ago.
 */
export function pricingStamp(newPricing, storedPricing) {
  if (!Array.isArray(newPricing)) return {};
  const before = JSON.stringify(sanitizePricing(Array.isArray(storedPricing) ? storedPricing : []) || []);
  if (JSON.stringify(newPricing) === before) return {};
  // Bangkok's date — the day a Thai company would say it changed its prices.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  return { pricing_checked_at: today, pricing_by_owner: true };
}
