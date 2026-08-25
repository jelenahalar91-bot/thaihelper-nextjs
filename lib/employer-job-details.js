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
import { translateForeignText } from './translate';

const VALID_CATEGORIES = CATEGORIES.filter((c) => !c.legacy);
const MAX_TEXT_LENGTH = 2000;

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
