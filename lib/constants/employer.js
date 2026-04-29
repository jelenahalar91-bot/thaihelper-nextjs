/**
 * Employer-specific option lists used by the employer registration and
 * profile forms (and surfaced on /employers-browse cards).
 *
 * Category-specific tasks (nanny duties, housekeeper duties, chef
 * cuisines, driver shifts) are NOT defined here — they reuse the helper
 * `SKILLS_BY_CATEGORY` map from lib/constants/categories.js so a job
 * posting and a helper profile speak the same language and matching is
 * straightforward later.
 */

// When during the week
export const SCHEDULE_DAYS = [
  { value: 'weekdays', en: 'Weekdays',         th: 'วันธรรมดา' },
  { value: 'weekends', en: 'Weekends',         th: 'วันหยุดสุดสัปดาห์' },
  { value: 'flexible', en: 'Flexible',         th: 'ยืดหยุ่น' },
];

// Time of day
export const SCHEDULE_TIMES = [
  { value: 'morning',   en: 'Morning',          th: 'ช่วงเช้า' },
  { value: 'afternoon', en: 'Afternoon',        th: 'ช่วงบ่าย' },
  { value: 'evening',   en: 'Evening',          th: 'ช่วงเย็น' },
  { value: 'night',     en: 'Overnight',        th: 'กลางคืน' },
  { value: 'fulltime',  en: 'Full day',         th: 'เต็มวัน' },
];

// How long the job runs
export const DURATIONS = [
  { value: 'one_time',   en: 'One-time / event',     th: 'ครั้งเดียว / งานเดี่ยว' },
  { value: 'short_term', en: 'Short-term (< 1 mo.)', th: 'ระยะสั้น (น้อยกว่า 1 เดือน)' },
  { value: 'long_term',  en: 'Long-term (1–6 mo.)',  th: 'ระยะกลาง (1–6 เดือน)' },
  { value: 'ongoing',    en: 'Ongoing / permanent',  th: 'ระยะยาว / ประจำ' },
];

// Children's age groups — shown only when the job involves childcare
// (nanny / babysitter / tutor)
export const CHILD_AGE_GROUPS = [
  { value: 'baby',       en: 'Baby (0–1)',           th: 'ทารก (0–1 ปี)' },
  { value: 'toddler',    en: 'Toddler (2–4)',        th: 'เด็กเล็ก (2–4 ปี)' },
  { value: 'school_age', en: 'School age (5–12)',    th: 'เด็กวัยเรียน (5–12 ปี)' },
  { value: 'teen',       en: 'Teen (13+)',           th: 'วัยรุ่น (13+)' },
];

// Render a CSV slug list as a human-readable, comma-joined label string.
export function formatSlugList(csv, options, lang = 'en') {
  if (!csv) return '';
  const slugs = String(csv).split(/[,]+/).map(s => s.trim()).filter(Boolean);
  return slugs
    .map(slug => {
      const opt = options.find(o => o.value === slug);
      return opt ? (opt[lang] || opt.en || opt.label) : slug;
    })
    .join(', ');
}
