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

import { CATEGORIES, CAT_EMOJI } from './categories';

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

// Example texts shown as textarea placeholders for the per-category job
// descriptions, so families see what kind of detail helps helpers decide
// (who, how often, which tasks). Never stored — placeholder only.
export const JOB_DESCRIPTION_EXAMPLES = {
  nanny: {
    en: 'e.g. We need a nanny for our two children (3 and 6 years old), weekday afternoons: school pick-up, playtime and dinner. Basic English is a plus.',
    th: 'เช่น ต้องการพี่เลี้ยงดูแลลูก 2 คน (อายุ 3 และ 6 ขวบ) ช่วงบ่ายวันจันทร์–ศุกร์ รับจากโรงเรียน เล่นกับเด็ก และดูแลมื้อเย็น',
  },
  housekeeper: {
    en: 'e.g. Cleaning, laundry and ironing for a 3-bedroom house, 3 mornings per week. Days are flexible.',
    th: 'เช่น ทำความสะอาด ซักรีด และรีดผ้า สำหรับบ้าน 3 ห้องนอน สัปดาห์ละ 3 เช้า วันทำงานยืดหยุ่นได้',
  },
  chef: {
    en: 'e.g. Cook dinner for a family of 4, five evenings a week — Thai and Western dishes, healthy cooking. Grocery shopping included.',
    th: 'เช่น ทำอาหารเย็นสำหรับครอบครัว 4 คน สัปดาห์ละ 5 วัน อาหารไทยและตะวันตก เน้นสุขภาพ รวมช่วยซื้อของเข้าบ้าน',
  },
  driver: {
    en: 'e.g. School runs on weekdays (7:00 and 15:00) plus occasional errands and airport trips. We provide the car.',
    th: 'เช่น ขับรถรับส่งลูกไปโรงเรียนวันธรรมดา (7:00 และ 15:00) และไปธุระหรือสนามบินเป็นครั้งคราว มีรถให้',
  },
  gardener: {
    en: 'e.g. Weekly garden and pool care: lawn, plants and pool cleaning for a house with a small garden.',
    th: 'เช่น ดูแลสวนและสระว่ายน้ำสัปดาห์ละครั้ง ตัดหญ้า รดน้ำต้นไม้ และทำความสะอาดสระ',
  },
  elder_care: {
    en: 'e.g. Daytime care for my 78-year-old mother: meals, medication reminders, light housework and short walks.',
    th: 'เช่น ดูแลคุณแม่อายุ 78 ปีช่วงกลางวัน เตรียมอาหาร เตือนทานยา ทำงานบ้านเบา ๆ และพาเดินเล่น',
  },
  tutor: {
    en: 'e.g. English and maths tutoring for our 9-year-old, two afternoons per week at our home.',
    th: 'เช่น สอนภาษาอังกฤษและคณิตศาสตร์ให้ลูกอายุ 9 ขวบ สัปดาห์ละ 2 ช่วงบ่าย ที่บ้านเรา',
  },
  petsitter: {
    en: 'e.g. Walk our two dogs on weekday mornings; occasional overnight pet-sitting when we travel.',
    th: 'เช่น พาสุนัข 2 ตัวเดินเล่นช่วงเช้าวันธรรมดา และช่วยดูแลค้างคืนเป็นครั้งคราวเวลาเราไม่อยู่',
  },
};

// Normalise a job_details JSONB object ({ nanny: { text, text_en }, … })
// into an ordered display list. Follows CATEGORIES order so every surface
// (browse card, modal, dashboard) lists the jobs identically. English
// viewers get the stored translation (falls back to the original when it's
// already English); Thai viewers always see the original — same rule as
// the legacy job_description / job_description_en pair.
export function jobDetailEntries(jobDetails, lang = 'en') {
  if (!jobDetails || typeof jobDetails !== 'object') return [];
  const out = [];
  for (const cat of CATEGORIES) {
    const entry = jobDetails[cat.value];
    const original = typeof entry?.text === 'string' ? entry.text.trim() : '';
    if (!original) continue;
    const text = lang === 'th' ? original : (entry.text_en || original);
    out.push({
      category: cat.value,
      label: cat[lang] || cat.en,
      emoji: CAT_EMOJI[cat.en] || '💼',
      text,
    });
  }
  return out;
}

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
