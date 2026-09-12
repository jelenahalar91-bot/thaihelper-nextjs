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

import { CATEGORIES, CAT_EMOJI } from './categories.js';

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

// ─── JOB DESCRIPTION — REQUIRED FIELD ───────────────────────────────────────
// Ticked chips alone ("nanny", "weekdays") never tell a helper what the job
// actually is: how many children and how old, which hours, how big the dogs
// are. Helpers were applying blind, so the free text is a REQUIRED field on
// registration and on profile edit — one filled box per selected category.
//
// The minimum length exists to stop filler ("asap", "-", "clean house") from
// passing as a description; it is deliberately low enough that one honest
// sentence clears it.
export const JOB_DESCRIPTION_MIN_LENGTH = 40;

// What each category's description has to cover, shown under its textarea as
// a checklist. These are the details helpers ask for in the first message
// anyway — putting them in the post saves a round trip for both sides.
export const JOB_DESCRIPTION_HINTS = {
  nanny: {
    en: ['How many children and how old', 'Which days and what hours', 'Tasks (school pick-up, cooking, homework, bath time)', 'Languages or experience you need'],
    th: ['มีลูกกี่คน อายุเท่าไร', 'วันไหนและเวลากี่โมง', 'งานที่ต้องทำ (รับส่งโรงเรียน ทำอาหาร ช่วยทำการบ้าน อาบน้ำ)', 'ภาษาหรือประสบการณ์ที่ต้องการ'],
  },
  housekeeper: {
    en: ['Size of the home (bedrooms / floors)', 'Which days and what hours', 'Tasks (cleaning, laundry, ironing, cooking)', 'Pets or small children in the house'],
    th: ['ขนาดบ้าน (กี่ห้องนอน / กี่ชั้น)', 'วันไหนและเวลากี่โมง', 'งานที่ต้องทำ (ทำความสะอาด ซักรีด รีดผ้า ทำอาหาร)', 'มีสัตว์เลี้ยงหรือเด็กเล็กในบ้านหรือไม่'],
  },
  chef: {
    en: ['How many people you cook for', 'Which cuisine (Thai, Western, vegetarian…)', 'How many meals per day and which days', 'Whether grocery shopping is included'],
    th: ['ทำอาหารให้กี่คน', 'อาหารประเภทไหน (ไทย ตะวันตก มังสวิรัติ…)', 'กี่มื้อต่อวัน และวันไหน', 'ต้องช่วยซื้อของเข้าบ้านหรือไม่'],
  },
  driver: {
    en: ['Which routes and at what times', 'Whether you provide the car', 'Licence or years of experience needed', 'Extra errands, airport runs, weekend trips'],
    th: ['เส้นทางไหนและเวลากี่โมง', 'มีรถให้หรือไม่', 'ต้องมีใบขับขี่หรือประสบการณ์กี่ปี', 'งานอื่น เช่น ไปธุระ สนามบิน เดินทางวันหยุด'],
  },
  gardener: {
    en: ['Size of the garden, and whether there is a pool', 'How often (weekly, twice a month…)', 'Tasks (lawn, plants, pool cleaning, tree trimming)', 'Whether tools and equipment are provided'],
    th: ['ขนาดสวน และมีสระว่ายน้ำหรือไม่', 'ความถี่ (สัปดาห์ละครั้ง เดือนละสองครั้ง…)', 'งานที่ต้องทำ (ตัดหญ้า ดูแลต้นไม้ ทำความสะอาดสระ ตัดแต่งกิ่ง)', 'มีอุปกรณ์ให้หรือไม่'],
  },
  elder_care: {
    en: ['Age of the person and their condition', 'Help needed (mobility, medication, meals, washing)', 'Hours, and whether nights are included', 'Nursing experience or lifting required'],
    th: ['อายุและสภาพร่างกายของผู้สูงอายุ', 'ต้องช่วยอะไร (เดิน ทานยา อาหาร อาบน้ำ)', 'เวลาทำงาน และต้องอยู่กลางคืนหรือไม่', 'ต้องมีประสบการณ์พยาบาลหรือช่วยยกตัวหรือไม่'],
  },
  tutor: {
    en: ['Child\u2019s age and school grade', 'Which subjects', 'Which days and what times', 'At your home or online, and in which language'],
    th: ['อายุและระดับชั้นของเด็ก', 'วิชาอะไร', 'วันไหนและเวลากี่โมง', 'ที่บ้านหรือออนไลน์ และสอนเป็นภาษาอะไร'],
  },
  petsitter: {
    en: ['How many pets, which type and how big', 'Their age and temperament', 'Tasks (walks, feeding, litter, overnight stays)', 'How often and at what times'],
    th: ['มีสัตว์เลี้ยงกี่ตัว ประเภทอะไร ตัวใหญ่แค่ไหน', 'อายุและนิสัยของสัตว์เลี้ยง', 'งานที่ต้องทำ (พาเดินเล่น ให้อาหาร เก็บกระบะทราย ดูแลค้างคืน)', 'ความถี่และเวลากี่โมง'],
  },
};

// Turn a raw per-category payload into { category: "trimmed text" }.
// Accepts both shapes we pass around: the form's plain strings and the
// stored job_details JSONB ({ nanny: { text, text_en } }).
export function normalizeJobTexts(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [cat, value] of Object.entries(raw)) {
    const text = typeof value === 'string'
      ? value
      : (typeof value?.text === 'string' ? value.text : '');
    if (text.trim()) out[cat] = text.trim();
  }
  return out;
}

/**
 * Which of the selected categories still have no usable description.
 *
 * Shared by the registration form, the profile editor, both API routes and
 * the reminder script so "filled in" means exactly one thing everywhere.
 *
 * @param lookingFor  array of category slugs, or the stored CSV string
 * @param jobTexts    per-category texts (form strings or job_details JSONB)
 * @param fallbackText legacy flat job_description, if any
 * @returns array of category slugs whose text is missing or too short
 */
export function missingJobDescriptions(lookingFor, jobTexts, fallbackText = '') {
  const cats = Array.isArray(lookingFor)
    ? lookingFor.filter(Boolean)
    : String(lookingFor || '').split(',').map((s) => s.trim()).filter(Boolean);
  const texts = normalizeJobTexts(jobTexts);

  // Accounts created before the per-category boxes existed only have the
  // single flat job_description. When they wrote a real one, it counts —
  // we ask them to split it into per-category boxes on their next edit,
  // not to retype it before they can change their phone number.
  const flat = String(fallbackText || '').trim();
  if (Object.keys(texts).length === 0 && flat.length >= JOB_DESCRIPTION_MIN_LENGTH) {
    return [];
  }

  return cats.filter((cat) => (texts[cat] || '').length < JOB_DESCRIPTION_MIN_LENGTH);
}

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
