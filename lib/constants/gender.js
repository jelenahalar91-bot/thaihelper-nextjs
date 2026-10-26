/**
 * Helper gender options.
 *
 * Used by /register, /profile, /helpers (browse filter) and the mobile
 * browse screen. Like the nationality list, this doubles as the whitelist
 * for the helper_profiles.gender CHECK constraint and the API validation
 * layer — see scripts/supabase-gender.sql.
 *
 * Deliberately two values. There is no "prefer not to say" here, unlike
 * nationality: this column exists to drive the browse filter, so an opt-out
 * value wouldn't be privacy, it would be exclusion — the helper would match
 * no gender filter at all and simply vanish from the searches families
 * actually run.
 */

export const GENDER_OPTIONS = [
  { value: 'female', emoji: '👩', en: 'Female', th: 'หญิง' },
  { value: 'male',   emoji: '👨', en: 'Male',   th: 'ชาย' },
];

// Whitelist of valid values — matches the DB CHECK constraint.
export const GENDER_VALUES = GENDER_OPTIONS.map(o => o.value);

/**
 * Browse-page filter options. '' is "All", and it is the only way a helper
 * whose gender is still NULL can appear — picking a specific gender means
 * "this value, exactly", so unanswered profiles drop out. That is the
 * intended behaviour, and it is why /profile nags for the field.
 */
export const GENDER_FILTER_OPTIONS = [
  { value: '', en: 'All', th: 'ทั้งหมด' },
  ...GENDER_OPTIONS,
];

export function formatGender(value, lang = 'en') {
  const opt = GENDER_OPTIONS.find(o => o.value === value);
  return opt ? (opt[lang] || opt.en) : '';
}
