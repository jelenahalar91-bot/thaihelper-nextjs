/**
 * Server-side builder for employer per-category job descriptions.
 *
 * Families with more than one `looking_for` category can describe each job
 * separately (see scripts/supabase-employer-job-details.sql). This module
 * turns the raw client payload into:
 *   - job_details        JSONB: { nanny: { text, text_en }, … }
 *   - job_description    flattened "Label: text" version of all entries
 *   - job_description_en flattened English version
 *
 * The flattened pair keeps every consumer that only knows the legacy single
 * column (old cards, emails, exports) working unchanged.
 *
 * Used by /api/employer-signup and /api/employer-profile.
 */

import { CATEGORIES } from './constants/categories';
import { JOB_TEXT_MIN_LENGTH } from './constants/employer';
import { translateForeignText } from './translate';

const VALID_CATEGORIES = CATEGORIES.filter((c) => !c.legacy);
const MAX_TEXT_LENGTH = 2000;

// Shortest job text that counts as describing the job.
//
// Required at signup since 2026-10-02. Before that it was optional, and 25 of
// the 46 families who registered in the preceding two weeks left it empty —
// their listing showed a name, a city and nothing else. Of families with no
// text, 30% never received a single reply from a helper, against 15% of
// families who wrote one.
//
// Deliberately NOT a quality bar: suspended accounts write LONGER texts than
// honest ones (median 185 against 171), so length says nothing about intent.
// The number itself and how it was calibrated live in lib/constants/employer.js,
// which the registration form can import without dragging Translate into the
// browser bundle. Re-exported here so existing callers keep working.
export const MIN_TEXT_LENGTH = JOB_TEXT_MIN_LENGTH;

// Placeholders the PII scrub leaves behind. They must not count toward the
// minimum, or pasting a phone number would satisfy it on its own.
const PII_PLACEHOLDERS = /\[(?:phone|email) hidden\]/g;

/** The text as the length check sees it: scrubbed, placeholders removed. */
function countableText(text) {
  return sanitizeJobText(text).replace(PII_PLACEHOLDERS, ' ').trim();
}

/**
 * Which of the requested categories have no usable job text?
 *
 * Returns category slugs, so the caller can name them instead of saying
 * "something is missing" — a family hiring a nanny and a housekeeper needs to
 * know which of the two boxes is empty.
 *
 * @param raw          the same payload buildJobDetailsPatch takes
 * @param wantedRoles  category slugs from looking_for
 */
export function missingJobTexts(raw, wantedRoles) {
  const roles = (Array.isArray(wantedRoles) ? wantedRoles : [])
    .map((r) => String(r || '').trim())
    .filter((r) => VALID_CATEGORIES.some((c) => c.value === r));
  const payload = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};

  return roles.filter((role) => {
    const value = payload[role];
    const text = typeof value === 'string' ? value : value?.text;
    return countableText(text).length < MIN_TEXT_LENGTH;
  });
}

// Same PII scrub applied to the legacy job_description: strip phone
// numbers and emails so contact details never end up on public cards.
export function sanitizeJobText(text) {
  return String(text || '')
    .replace(/(\+?\d[\d\s\-().]{7,}\d)/g, '[phone hidden]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email hidden]');
}

/**
 * Build the storable job-details patch from a client payload.
 *
 * @param raw object keyed by category slug; values are either the text
 *            string directly or { text } objects. Unknown keys and empty
 *            texts are dropped.
 * @returns { job_details, job_description, job_description_en } with all
 *          three null when no entry survives validation, or null when
 *          `raw` isn't an object at all (caller should then leave the
 *          legacy fields untouched).
 */
export async function buildJobDetailsPatch(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const details = {};
  const flatParts = [];
  const flatPartsEn = [];

  for (const cat of VALID_CATEGORIES) {
    const value = raw[cat.value];
    const text = typeof value === 'string' ? value : value?.text;
    const clean = sanitizeJobText(text).trim().slice(0, MAX_TEXT_LENGTH);
    if (!clean) continue;

    // Store an English translation alongside the original so English-reading
    // helpers can read Thai job posts. Null when the text is already English
    // or the Translate API is unavailable — the UI falls back to the original.
    let textEn = null;
    try {
      textEn = (await translateForeignText(clean)) || null;
    } catch {
      textEn = null;
    }

    details[cat.value] = textEn ? { text: clean, text_en: textEn } : { text: clean };
    flatParts.push(`${cat.en}: ${clean}`);
    flatPartsEn.push(`${cat.en}: ${textEn || clean}`);
  }

  if (Object.keys(details).length === 0) {
    return { job_details: null, job_description: null, job_description_en: null };
  }

  return {
    job_details: details,
    job_description: flatParts.join('\n\n'),
    // Only store the flattened English version when at least one entry was
    // actually translated — otherwise it would just duplicate the original.
    job_description_en: flatPartsEn.join('\n\n') !== flatParts.join('\n\n')
      ? flatPartsEn.join('\n\n')
      : null,
  };
}
