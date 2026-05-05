/**
 * Helper nationality options.
 *
 * Used by /register, /profile, /helpers (browse filter), and the
 * wizard CTAs. The list is intentionally finite — it doubles as the
 * whitelist for the helper_profiles.nationality CHECK constraint and
 * the API validation layer.
 *
 * Order is roughly by frequency on the platform: Thai first, then the
 * MOU-source countries (Myanmar/Lao/Cambodia/Vietnam) and the
 * Philippines, then a generic "other" tail. Flags are kept in the
 * data so display code doesn't have to maintain a parallel mapping.
 */

export const NATIONALITY_OPTIONS = [
  { value: 'thai',           flag: '🇹🇭', en: 'Thai',                th: 'ไทย' },
  { value: 'myanmar',        flag: '🇲🇲', en: 'Myanmar (Burmese)',   th: 'พม่า' },
  { value: 'philippines',    flag: '🇵🇭', en: 'Filipino',            th: 'ฟิลิปปินส์' },
  { value: 'lao',            flag: '🇱🇦', en: 'Lao',                 th: 'ลาว' },
  { value: 'cambodia',       flag: '🇰🇭', en: 'Cambodian',           th: 'กัมพูชา' },
  { value: 'vietnamese',     flag: '🇻🇳', en: 'Vietnamese',          th: 'เวียดนาม' },
  { value: 'indian',         flag: '🇮🇳', en: 'Indian',              th: 'อินเดีย' },
  { value: 'nepali',         flag: '🇳🇵', en: 'Nepali',              th: 'เนปาล' },
  { value: 'other_asian',    flag: '🌏', en: 'Other Asian',          th: 'เอเชียอื่นๆ' },
  { value: 'other',          flag: '🌐', en: 'Other',                th: 'อื่นๆ' },
  { value: 'prefer_not_say', flag: '—',  en: 'Prefer not to say',    th: 'ไม่ต้องการระบุ' },
];

// Whitelist of valid values — matches the DB CHECK constraint.
export const NATIONALITY_VALUES = NATIONALITY_OPTIONS.map(o => o.value);

// Filter options on the browse page — only positive values, no
// "prefer_not_say" filter. Same rationale as the WP filter: positive
// labelling only.
export const NATIONALITY_FILTER_OPTIONS = [
  { value: '',           en: 'All nationalities',  th: 'ทุกสัญชาติ' },
  ...NATIONALITY_OPTIONS
    .filter(o => o.value !== 'prefer_not_say')
    .map(o => ({ value: o.value, flag: o.flag, en: o.en, th: o.th })),
];

export function formatNationality(value, lang = 'en') {
  const opt = NATIONALITY_OPTIONS.find(o => o.value === value);
  return opt ? (opt[lang] || opt.en) : '';
}

// Thai nationals legally don't need a work permit — derive the WP
// status from nationality so the user only has to answer one question.
// Returns the work_permit_status value to set, or null to leave it
// for the user to fill in manually.
export function deriveWpStatusFromNationality(nationality) {
  if (nationality === 'thai') return 'thai_national';
  return null;
}
