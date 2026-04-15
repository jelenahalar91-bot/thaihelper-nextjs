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
  { value: 'caregiver', en: 'Elder Care & Caregiver', th: 'ผู้ดูแลผู้สูงอายุ' },
  { value: 'tutor', en: 'Tutor & Teacher', th: 'ติวเตอร์ / ครูสอนพิเศษ' },
  { value: 'multiple', en: 'Multiple Services', th: 'หลายบริการ' },
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
