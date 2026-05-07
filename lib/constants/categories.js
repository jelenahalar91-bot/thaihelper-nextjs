/**
 * Service category constants for ThaiHelper.
 *
 * CATEGORIES — array of { value, en, th } used by existing pages (helpers, register, etc.)
 * CATEGORIES_DATA — rich objects for SEO/GEO landing pages (/hire/)
 * CAT_EMOJI — emoji map for UI display
 */

// Used by existing pages — matches the format helpers.js etc. expect
export const CATEGORIES = [
  { value: 'nanny', en: 'Nanny & Babysitter', th: 'พี่เลี้ยงเด็ก' },
  { value: 'housekeeper', en: 'Housekeeper & Cleaner', th: 'แม่บ้านและพนักงานทำความสะอาด' },
  { value: 'chef', en: 'Private Chef & Cook', th: 'พ่อครัว / แม่ครัวส่วนตัว' },
  { value: 'driver', en: 'Driver & Chauffeur', th: 'คนขับรถ' },
  { value: 'gardener', en: 'Gardener & Pool Care', th: 'คนสวนและดูแลสระว่ายน้ำ' },
  { value: 'elder_care', en: 'Elder Care & Caregiver', th: 'ผู้ดูแลผู้สูงอายุ' },
  { value: 'tutor', en: 'Tutor & Teacher', th: 'ติวเตอร์ / ครูสอนพิเศษ' },
  // Legacy single-bucket category — no longer offered at registration. Kept
  // here so existing helper records that still have category="multiple"
  // render gracefully until they update their profile.
  { value: 'multiple', en: 'Multiple Services', th: 'หลายบริการ', legacy: true },
];

export const CAT_EMOJI = {
  'Nanny & Babysitter': '👶',
  'Housekeeper & Cleaner': '🏠',
  'Private Chef & Cook': '👨‍🍳',
  'Driver & Chauffeur': '🚗',
  'Gardener & Pool Care': '🌿',
  'Elder Care & Caregiver': '❤️',
  'Tutor & Teacher': '📚',
  'Multiple Services': '✨',
};

// Rich category data — used by /hire/ landing pages and SEO schemas
export const CATEGORIES_DATA = [
  {
    slug: 'nanny',
    name: 'Nanny & Babysitter',
    name_th: 'พี่เลี้ยงเด็ก',
    icon: '👶',
    salary_range: { min: 12000, max: 25000 },
    description: 'Find trusted nannies and babysitters in Thailand. Full-time, part-time, or live-in childcare for your family.',
    keywords: 'nanny Thailand, babysitter Thailand, childcare Thailand, find nanny Bangkok',
  },
  {
    slug: 'housekeeper',
    name: 'Housekeeper & Cleaner',
    name_th: 'แม่บ้านและพนักงานทำความสะอาด',
    icon: '🏠',
    salary_range: { min: 10000, max: 18000 },
    description: 'Hire verified housekeepers and cleaners in Thailand. Daily, weekly, or full-time house cleaning services.',
    keywords: 'maid Thailand, housekeeper Thailand, cleaner Thailand, house cleaning Bangkok',
  },
  {
    slug: 'chef',
    name: 'Private Chef & Cook',
    name_th: 'พ่อครัว / แม่ครัวส่วนตัว',
    icon: '👨‍🍳',
    salary_range: { min: 15000, max: 35000 },
    description: 'Hire a private chef or cook in Thailand. Thai, Western, and international cuisine for your household.',
    keywords: 'private chef Thailand, personal cook Thailand, hire chef Bangkok, household cook',
  },
  {
    slug: 'driver',
    name: 'Driver & Chauffeur',
    name_th: 'คนขับรถ',
    icon: '🚗',
    salary_range: { min: 15000, max: 25000 },
    description: 'Find reliable personal drivers and chauffeurs in Thailand. School runs, errands, airport transfers.',
    keywords: 'personal driver Thailand, chauffeur Thailand, hire driver Bangkok, private driver',
  },
  {
    slug: 'gardener',
    name: 'Gardener & Pool Care',
    name_th: 'คนสวนและดูแลสระว่ายน้ำ',
    icon: '🌿',
    salary_range: { min: 8000, max: 18000 },
    description: 'Hire gardeners and pool maintenance staff in Thailand. Garden upkeep, landscaping, and pool cleaning.',
    keywords: 'gardener Thailand, pool cleaner Thailand, garden maintenance Bangkok, pool care Phuket',
  },
  {
    slug: 'caregiver',
    name: 'Elder Care & Caregiver',
    name_th: 'ผู้ดูแลผู้สูงอายุ',
    icon: '❤️',
    salary_range: { min: 13000, max: 22000 },
    description: 'Find compassionate elder caregivers in Thailand. Companionship, daily assistance, and medical support.',
    keywords: 'elder care Thailand, caregiver Thailand, senior care Bangkok, home nurse Thailand',
  },
  {
    slug: 'tutor',
    name: 'Tutor & Teacher',
    name_th: 'ติวเตอร์ / ครูสอนพิเศษ',
    icon: '📚',
    salary_range: { min: 10000, max: 30000 },
    description: 'Find private tutors and teachers in Thailand. English, Thai, math, music, and academic subjects.',
    keywords: 'private tutor Thailand, English teacher Thailand, tutor Bangkok, home school teacher',
  },
];

export function getCategoryBySlug(slug) {
  return CATEGORIES_DATA.find((c) => c.slug === slug) || null;
}

export function getAllCategorySlugs() {
  return CATEGORIES_DATA.map((c) => c.slug);
}

// ─── SKILLS PER CATEGORY ────────────────────────────────────────────────────
// Canonical source — must stay in sync with the inline copy in
// pages/register.js (duplicated there for the registration form only;
// all other consumers should import from here).
//
// Imported by components/messaging/HelperProfileModal.jsx to render
// readable skill labels in the employer's helper-profile modal.
export const SKILLS_BY_CATEGORY = {
  nanny: [
    { value: 'infant_care',   en: 'Infant care (0–2 years)',         th: 'ดูแลทารก (0–2 ปี)' },
    { value: 'child_care',    en: 'Child care (3–12 years)',         th: 'ดูแลเด็ก (3–12 ปี)' },
    { value: 'school_run',    en: 'School pickup & dropoff',         th: 'รับ-ส่งโรงเรียน' },
    { value: 'homework',      en: 'Homework help',                   th: 'ช่วยการบ้าน' },
    { value: 'cooking_kids',  en: 'Cooking for children',            th: 'ทำอาหารเด็ก' },
    { value: 'overnight',     en: 'Overnight care',                  th: 'ดูแลกลางคืน' },
    { value: 'live_in',       en: 'Live-in (accommodation needed)',  th: 'อยู่ประจำ (ต้องการที่พัก)' },
    { value: 'live_out',      en: 'Live-out (commuting daily)',      th: 'ไป-กลับ (เดินทางเอง)' },
    { value: 'pool_superv',   en: 'Pool supervision',                th: 'ดูแลบริเวณสระน้ำ' },
    { value: 'weekend',       en: 'Weekend & holiday care',          th: 'ดูแลวันหยุด' },
  ],
  housekeeper: [
    { value: 'general_clean', en: 'General cleaning',                th: 'ทำความสะอาดทั่วไป' },
    { value: 'laundry',       en: 'Laundry & ironing',               th: 'ซักรีด' },
    { value: 'cooking',       en: 'Cooking & meal prep',             th: 'ทำอาหาร' },
    { value: 'windows',       en: 'Window cleaning',                 th: 'เช็ดกระจก' },
    { value: 'shopping',      en: 'Grocery shopping',                th: 'ซื้อของตลาด' },
    { value: 'organising',    en: 'Organising & tidying',            th: 'จัดระเบียบบ้าน' },
  ],
  chef: [
    { value: 'thai_cuisine',  en: 'Thai cuisine',                    th: 'อาหารไทย' },
    { value: 'western',       en: 'Western cuisine',                 th: 'อาหารตะวันตก' },
    { value: 'asian',         en: 'Other Asian cuisine',             th: 'อาหารเอเชียอื่นๆ' },
    { value: 'vegetarian',    en: 'Vegetarian / vegan',              th: 'มังสวิรัติ / วีแกน' },
    { value: 'baking',        en: 'Baking & desserts',               th: 'ขนมอบ' },
    { value: 'meal_prep',     en: 'Meal planning',                   th: 'วางแผนเมนู' },
  ],
  driver: [
    { value: 'airport',       en: 'Airport transfers',               th: 'รับ-ส่งสนามบิน' },
    { value: 'school_run',    en: 'School runs',                     th: 'รับ-ส่งโรงเรียน' },
    { value: 'shopping_trip', en: 'Shopping & errands',              th: 'พาช้อปปิ้ง / ทำธุระ' },
    { value: 'full_time',     en: 'Full-time / live-in driver',      th: 'คนขับประจำ' },
    { value: 'night',         en: 'Night driving',                   th: 'ขับรถกลางคืน' },
  ],
  gardener: [
    { value: 'garden_maint',  en: 'Garden maintenance',              th: 'ดูแลสวน' },
    { value: 'pool_clean',    en: 'Pool cleaning',                   th: 'ทำความสะอาดสระ' },
    { value: 'pool_chem',     en: 'Pool chemical management',        th: 'จัดการสารเคมีสระน้ำ' },
    { value: 'lawn',          en: 'Lawn mowing',                     th: 'ตัดหญ้า' },
    { value: 'plants',        en: 'Plant care & watering',           th: 'รดน้ำต้นไม้' },
  ],
  elder_care: [
    { value: 'hygiene',       en: 'Personal hygiene assistance',     th: 'ช่วยดูแลสุขอนามัย' },
    { value: 'medication',    en: 'Medication reminders',            th: 'เตือนทานยา' },
    { value: 'mobility',      en: 'Mobility assistance',             th: 'ช่วยเรื่องการเคลื่อนที่' },
    { value: 'companion',     en: 'Companionship',                   th: 'คอยเป็นเพื่อน' },
    { value: 'appointments',  en: 'Medical appointments',            th: 'พาไปพบแพทย์' },
  ],
  tutor: [
    { value: 'math',          en: 'Maths',                           th: 'คณิตศาสตร์' },
    { value: 'english_subj',  en: 'English (subject)',               th: 'ภาษาอังกฤษ (วิชา)' },
    { value: 'science',       en: 'Science',                         th: 'วิทยาศาสตร์' },
    { value: 'thai_lang',     en: 'Thai language',                   th: 'ภาษาไทย' },
    { value: 'russian_lang',  en: 'Russian language',                th: 'ภาษารัสเซีย' },
    { value: 'german_lang',   en: 'German language',                 th: 'ภาษาเยอรมัน' },
    { value: 'chinese_lang',  en: 'Chinese / Mandarin',              th: 'ภาษาจีน / แมนดาริน' },
    { value: 'piano',         en: 'Piano',                           th: 'เปียโน' },
    { value: 'guitar',        en: 'Guitar',                           th: 'กีตาร์' },
    { value: 'singing',       en: 'Singing / Voice',                 th: 'ร้องเพลง / เสียงร้อง' },
    { value: 'ballet',        en: 'Ballet & Dance',                  th: 'บัลเล่ต์ / เต้นรำ' },
    { value: 'art',           en: 'Art & Drawing',                   th: 'ศิลปะ / วาดรูป' },
    { value: 'swim_coach',    en: 'Swimming lessons',                th: 'สอนว่ายน้ำ' },
    { value: 'coding',        en: 'Coding for kids',                 th: 'โค้ดดิ้งสำหรับเด็ก' },
  ],
  multiple: [
    { value: 'nanny',         en: 'Nanny / childcare',               th: 'พี่เลี้ยงเด็ก' },
    { value: 'cleaning',      en: 'Cleaning',                        th: 'ทำความสะอาด' },
    { value: 'cooking',       en: 'Cooking',                         th: 'ทำอาหาร' },
    { value: 'driving',       en: 'Driving',                         th: 'ขับรถ' },
    { value: 'garden',        en: 'Gardening',                       th: 'ดูแลสวน' },
    { value: 'elder',         en: 'Elder care',                      th: 'ดูแลผู้สูงอายุ' },
    { value: 'tutoring',      en: 'Tutoring / teaching',             th: 'สอนพิเศษ' },
  ],
};

// ─── HOURLY RATES ───────────────────────────────────────────────────────────
export const RATES = [
  { value: 'negotiable',   en: 'Negotiable',                   th: 'แล้วแต่ตกลง' },
  { value: 'under_150',    en: 'Under 150 THB / hour',         th: 'ต่ำกว่า 150 บาท / ชั่วโมง' },
  { value: '150_200',      en: '150–200 THB / hour',           th: '150–200 บาท / ชั่วโมง' },
  { value: '200_300',      en: '200–300 THB / hour',           th: '200–300 บาท / ชั่วโมง' },
  { value: '300_500',      en: '300–500 THB / hour',           th: '300–500 บาท / ชั่วโมง' },
  { value: '500_700',      en: '500–700 THB / hour',           th: '500–700 บาท / ชั่วโมง' },
  { value: '700_1000',     en: '700–1,000 THB / hour',         th: '700–1,000 บาท / ชั่วโมง' },
  { value: 'over_1000',    en: '1,000+ THB / hour',            th: '1,000+ บาท / ชั่วโมง' },
];

// ─── LANGUAGES ──────────────────────────────────────────────────────────────
export const LANGUAGES = [
  { value: 'english',    label: 'English' },
  { value: 'thai',       label: 'Thai' },
  { value: 'burmese',    label: 'Burmese' },
  { value: 'khmer',      label: 'Khmer' },
  { value: 'lao',        label: 'Lao' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'tagalog',    label: 'Tagalog' },
  { value: 'chinese',    label: 'Chinese' },
  { value: 'russian',    label: 'Russian' },
  { value: 'german',     label: 'German' },
  { value: 'other',      label: 'Other' },
];
