// Shared sanitiser for company-editable directory listing fields.
// Used by both onboarding (/api/company-onboard) and the dashboard
// (/api/company-listing) so the whitelist + validation live in one place.

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
    whatsapp:    str(body.whatsapp, 60),
    line_id:     str(body.lineId ?? body.line_id, 60),
    license_number: str(body.licenseNumber ?? body.license_number, 80),
    opening_hours:  str(body.openingHours ?? body.opening_hours, 200),
    nationalities_placed: csv(body.nationalitiesPlaced ?? body.nationalities_placed, NATIONALITY_VALUES),
  };
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
    address: row.address || '',
    phone: row.phone || '',
    email: row.email || '',
    website: row.website || '',
    googleMapsUrl: row.google_maps_url || '',
    description: row.description || '',
    descriptionTh: row.description_th || '',
    specialties: row.specialties || '',
    languagesSpoken: row.languages_spoken || '',
    whatsapp: row.whatsapp || '',
    lineId: row.line_id || '',
    licenseNumber: row.license_number || '',
    openingHours: row.opening_hours || '',
    nationalitiesPlaced: row.nationalities_placed || '',
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
