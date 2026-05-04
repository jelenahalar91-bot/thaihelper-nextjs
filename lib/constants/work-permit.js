/**
 * Work permit status options for helper profiles.
 * Used by register.js, profile.js, helpers.js (browse filter) and the
 * helper card badge.
 *
 * Rules from the implementation spec:
 *  - The field is ALWAYS optional. Default is empty/null.
 *  - Only positive statuses ('thai_national', 'valid_wp') are surfaced
 *    publicly as badges or filter values — never a "no work permit"
 *    filter (would be negative labelling).
 */

export const WP_STATUS_OPTIONS = [
  { value: 'thai_national',   en: 'Thai national (no work permit needed)',    th: 'คนไทย (ไม่ต้องมีใบอนุญาตทำงาน)' },
  { value: 'valid_wp',        en: 'I have a valid work permit',               th: 'มีใบอนุญาตทำงานที่ถูกต้อง' },
  { value: 'wp_in_progress',  en: 'Work permit application in progress',      th: 'กำลังดำเนินการขอใบอนุญาตทำงาน' },
  { value: 'no_wp',           en: "I don't have a work permit yet",           th: 'ยังไม่มีใบอนุญาตทำงาน' },
  { value: 'prefer_not_say',  en: 'Prefer not to say',                        th: 'ไม่ต้องการระบุ' },
];

// Whitelist of values valid for the helper_profiles.work_permit_status
// CHECK constraint. API routes use this to validate inputs.
export const WP_STATUS_VALUES = WP_STATUS_OPTIONS.map(o => o.value);

// Only these statuses are shown as public badges on helper cards.
export const WP_PUBLIC_BADGES = ['thai_national', 'valid_wp'];

// Filter options for employers — positive filtering only.
export const WP_FILTER_OPTIONS = [
  { value: '',               en: 'All',              th: 'ทั้งหมด' },
  { value: 'thai_national',  en: 'Thai national',    th: 'คนไทย' },
  { value: 'valid_wp',       en: 'Has work permit',  th: 'มีใบอนุญาตทำงาน' },
];

export function formatWpStatus(value, lang = 'en') {
  const opt = WP_STATUS_OPTIONS.find(o => o.value === value);
  return opt ? (opt[lang] || opt.en) : '';
}

// Mask any non-public status to null before returning to the public API.
export function maskWpStatusForPublic(value) {
  return WP_PUBLIC_BADGES.includes(value) ? value : null;
}
