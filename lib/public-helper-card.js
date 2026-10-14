/**
 * The one definition of what a helper looks like to someone who is not
 * logged in.
 *
 * This shape is built in two places: GET /api/helpers, and the server-rendered
 * first page of /helpers. Until now each had its own copy of the column list
 * and its own forty-line mapping, kept in step by hand and by a comment asking
 * the next person to remember. Both copies happened to be correct — the SSR one
 * masks the work-permit status, drops a nationality somebody asked us to keep
 * private, hides a rating below the visibility threshold, and reduces contact
 * details to a yes/no, exactly as the API does.
 *
 * That is not the risk. The risk is the next column. Add one to the API card
 * and the page keeps working, so nothing tells you the other copy exists —
 * and if the new column is one that needs masking, the SSR page serves it raw
 * to every anonymous visitor and to Google. A duplicated privacy boundary only
 * has to be forgotten once.
 *
 * NEVER expose from here: whatsapp, has_whatsapp, phone, email, or the
 * verified phone number. `trust` carries presence-only signals derived from
 * related tables — booleans and counts, never the content behind them, which
 * stays gated behind the employer-only endpoints.
 */

import { getDisplayAge } from './age';
import { maskWpStatusForPublic } from './constants/work-permit';
import { publicRating } from './rating-visibility';

/**
 * Every column toPublicCard() reads. Some are never emitted — email and
 * whatsapp become booleans, date_of_birth becomes an age band, status is only
 * there for the filter — so this list is longer than the card and that is
 * correct.
 */
export const PUBLIC_CARD_COLUMNS =
  'helper_ref, first_name, last_name, email, whatsapp, has_whatsapp, ' +
  'age, date_of_birth, category, skills, city, area, area_en, additional_cities, ' +
  'experience, languages, rate, education, education_en, certificates, bio, bio_en, ' +
  'photo_url, created_at, last_login_at, rating_avg, rating_count, status, ' +
  'availability_status, work_permit_status, nationality, ' +
  'phone_verified_at, line_linked_at';

/**
 * Map a helper_profiles row to the public-safe card.
 *
 * @param {object} row    a row selected with PUBLIC_CARD_COLUMNS
 * @param {object} [trust] { hasCertificates: boolean, referenceCount: number }
 */
export function toPublicCard(row, trust = {}) {
  return {
    ref: row.helper_ref,
    firstName: row.first_name,
    lastName: row.last_name ? row.last_name.charAt(0) + '.' : '', // only initial
    age: getDisplayAge(row) || null,
    category: row.category || '',
    skills: row.skills || '',
    city: row.city || '',
    area: row.area || '',
    areaEn: row.area_en || '',
    availabilityStatus: row.availability_status || 'available',
    additionalCities: row.additional_cities || '',
    experience: row.experience || '',
    languages: row.languages || '',
    rate: row.rate || '',
    education: row.education || '',
    educationEn: row.education_en || '',
    certificates: row.certificates || '',
    bio: row.bio || '',
    bioEn: row.bio_en || '',
    photo: row.photo_url || '',
    createdAt: row.created_at || null,
    lastActiveAt: row.last_login_at || null,
    // Hidden below MIN_PUBLIC_REVIEWS — one review must not be a whole
    // reputation. See lib/rating-visibility.js.
    ...publicRating(row.rating_avg, row.rating_count),
    // Signal to the UI whether contact info exists, without revealing it.
    hasWhatsApp: !!row.whatsapp,
    hasEmail: !!row.email,
    // Only positive WP statuses are surfaced publicly. Anything else
    // (in_progress / no_wp / prefer_not_say) is masked to null so it can't
    // leak through a public response.
    wpStatus: maskWpStatusForPublic(row.work_permit_status),
    // Nationality is shown publicly except "prefer_not_say" — that value is
    // the helper's explicit opt-out and must stay private.
    nationality: row.nationality === 'prefer_not_say' ? null : (row.nationality || null),
    // Trust badges — booleans only. The actual phone number is never in the
    // public card; the family sees only "📞 Phone", meaning "we verified this
    // helper's number reaches them".
    phoneVerified: !!row.phone_verified_at,
    lineVerified: !!row.line_linked_at,
    // Quality signals — presence only. "Has uploaded certificates" and "has
    // references" let families see proof-of-qualification at a glance; the
    // documents and reference content stay behind the employer-only endpoints.
    hasCertificates: !!trust.hasCertificates,
    referenceCount: trust.referenceCount || 0,
  };
}

/**
 * Helpers who took their profile offline are dropped here rather than in the
 * query: a Postgres .neq() would also exclude pre-migration rows whose
 * availability_status is NULL.
 */
export function isPubliclyVisible(row) {
  return row.availability_status !== 'hidden';
}
