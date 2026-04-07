/**
 * Service categories, skills, rates, and languages.
 * Shared between web pages and future mobile app.
 * Will move to packages/shared in monorepo.
 */

export const CATEGORIES = [
  { value: 'nanny',       en: '👶 Nanny & Babysitter',       th: '👶 พี่เลี้ยงเด็ก' },
  { value: 'housekeeper', en: '🏠 Housekeeper & Cleaner',     th: '🏠 แม่บ้าน / ทำความสะอาด' },
  { value: 'chef',        en: '👨‍🍳 Private Chef & Cook',       th: '👨‍🍳 พ่อครัว / แม่ครัวส่วนตัว' },
  { value: 'driver',      en: '🚗 Driver & Chauffeur',        th: '🚗 คนขับรถ' },
  { value: 'gardener',    en: '🌿 Gardener & Pool Care',      th: '🌿 ดูแลสวน / สระน้ำ' },
  { value: 'elder_care',  en: '🏥 Elder Care & Caregiver',    th: '🏥 ดูแลผู้สูงอายุ' },
  { value: 'tutor',       en: '📚 Tutor & Teacher',           th: '📚 ติวเตอร์ / ครูสอนพิเศษ' },
  { value: 'multiple',    en: '✨ Multiple Services',          th: '✨ หลายบริการ' },
];

/** Plain category names for filter dropdowns (without emoji) */
export const CATEGORY_NAMES = [
  'Nanny & Babysitter',
  'Housekeeper & Cleaner',
  'Private Chef & Cook',
  'Driver & Chauffeur',
  'Gardener & Pool Care',
  'Elder Care & Caregiver',
  'Tutor & Teacher',
];

export const CAT_EMOJI = {
  'Nanny & Babysitter': '👶',
  'Housekeeper & Cleaner': '🏠',
  'Private Chef & Cook': '👨‍🍳',
  'Driver & Chauffeur': '🚗',
  'Gardener & Pool Care': '🌿',
  'Elder Care & Caregiver': '🏥',
  'Tutor & Teacher': '📚',
};

export const SKILLS_BY_CATEGORY = {
  nanny: [
    { value: 'infant_care',   en: '👶 Infant care (0–2 years)',      th: '👶 ดูแลทารก (0–2 ปี)' },
    { value: 'child_care',    en: '🧒 Child care (3–12 years)',       th: '🧒 ดูแลเด็ก (3–12 ปี)' },
    { value: 'school_run',    en: '🚌 School pickup & dropoff',       th: '🚌 รับ-ส่งโรงเรียน' },
    { value: 'homework',      en: '📚 Homework help',                 th: '📚 ช่วยการบ้าน' },
    { value: 'cooking_kids',  en: '🍳 Cooking for children',          th: '🍳 ทำอาหารเด็ก' },
    { value: 'overnight',     en: '🌙 Overnight care',                th: '🌙 ดูแลกลางคืน' },
    { value: 'live_in',       en: '🏠 Live-in (accommodation needed)', th: '🏠 อยู่ประจำ (ต้องการที่พัก)' },
    { value: 'live_out',      en: '🚶 Live-out (commuting daily)',     th: '🚶 ไป-กลับ (เดินทางเอง)' },
    { value: 'pool_superv',   en: '🏊 Pool supervision',              th: '🏊 ดูแลบริเวณสระน้ำ' },
    { value: 'weekend',       en: '📅 Weekend & holiday care',        th: '📅 ดูแลวันหยุด' },
  ],
  housekeeper: [
    { value: 'general_clean', en: '🧹 General cleaning',             th: '🧹 ทำความสะอาดทั่วไป' },
    { value: 'laundry',       en: '👕 Laundry & ironing',            th: '👕 ซักรีด' },
    { value: 'cooking',       en: '🍳 Cooking & meal prep',          th: '🍳 ทำอาหาร' },
    { value: 'windows',       en: '🪟 Window cleaning',              th: '🪟 เช็ดกระจก' },
    { value: 'shopping',      en: '🛒 Grocery shopping',             th: '🛒 ซื้อของตลาด' },
    { value: 'organising',    en: '📦 Organising & tidying',         th: '📦 จัดระเบียบบ้าน' },
  ],
  chef: [
    { value: 'thai_cuisine',  en: '🇹🇭 Thai cuisine',               th: '🇹🇭 อาหารไทย' },
    { value: 'western',       en: '🍝 Western cuisine',              th: '🍝 อาหารตะวันตก' },
    { value: 'asian',         en: '🍜 Other Asian cuisine',          th: '🍜 อาหารเอเชียอื่นๆ' },
    { value: 'vegetarian',    en: '🥗 Vegetarian / vegan',           th: '🥗 มังสวิรัติ / วีแกน' },
    { value: 'baking',        en: '🎂 Baking & desserts',            th: '🎂 ขนมอบ' },
    { value: 'meal_prep',     en: '🥡 Meal planning',                th: '🥡 วางแผนเมนู' },
  ],
  driver: [
    { value: 'airport',       en: '✈️ Airport transfers',           th: '✈️ รับ-ส่งสนามบิน' },
    { value: 'school_run',    en: '🚌 School runs',                  th: '🚌 รับ-ส่งโรงเรียน' },
    { value: 'shopping_trip', en: '🛒 Shopping & errands',           th: '🛒 พาช้อปปิ้ง / ทำธุระ' },
    { value: 'full_time',     en: '🕐 Full-time / live-in driver',   th: '🕐 คนขับประจำ' },
    { value: 'night',         en: '🌙 Night driving',                th: '🌙 ขับรถกลางคืน' },
  ],
  gardener: [
    { value: 'garden_maint',  en: '🌿 Garden maintenance',          th: '🌿 ดูแลสวน' },
    { value: 'pool_clean',    en: '🏊 Pool cleaning',                th: '🏊 ทำความสะอาดสระ' },
    { value: 'pool_chem',     en: '🧪 Pool chemical management',     th: '🧪 จัดการสารเคมีสระน้ำ' },
    { value: 'lawn',          en: '🌱 Lawn mowing',                  th: '🌱 ตัดหญ้า' },
    { value: 'plants',        en: '🪴 Plant care & watering',        th: '🪴 รดน้ำต้นไม้' },
  ],
  elder_care: [
    { value: 'hygiene',       en: '🛁 Personal hygiene assistance',  th: '🛁 ช่วยดูแลสุขอนามัย' },
    { value: 'medication',    en: '💊 Medication reminders',         th: '💊 เตือนทานยา' },
    { value: 'mobility',      en: '🦽 Mobility assistance',          th: '🦽 ช่วยเรื่องการเคลื่อนที่' },
    { value: 'companion',     en: '🤝 Companionship',                th: '🤝 คอยเป็นเพื่อน' },
    { value: 'appointments',  en: '🏥 Medical appointments',         th: '🏥 พาไปพบแพทย์' },
  ],
  tutor: [
    { value: 'math',          en: '🔢 Maths',                        th: '🔢 คณิตศาสตร์' },
    { value: 'english_subj',  en: '📖 English (subject)',            th: '📖 ภาษาอังกฤษ (วิชา)' },
    { value: 'science',       en: '🔬 Science',                      th: '🔬 วิทยาศาสตร์' },
    { value: 'thai_lang',     en: '🇹🇭 Thai language',              th: '🇹🇭 ภาษาไทย' },
    { value: 'russian_lang',  en: '🇷🇺 Russian language',           th: '🇷🇺 ภาษารัสเซีย' },
    { value: 'german_lang',   en: '🇩🇪 German language',            th: '🇩🇪 ภาษาเยอรมัน' },
    { value: 'chinese_lang',  en: '🇨🇳 Chinese / Mandarin',         th: '🇨🇳 ภาษาจีน / แมนดาริน' },
    { value: 'piano',         en: '🎹 Piano',                        th: '🎹 เปียโน' },
    { value: 'guitar',        en: '🎸 Guitar',                       th: '🎸 กีตาร์' },
    { value: 'singing',       en: '🎤 Singing / Voice',              th: '🎤 ร้องเพลง / เสียงร้อง' },
    { value: 'ballet',        en: '🩰 Ballet & Dance',               th: '🩰 บัลเล่ต์ / เต้นรำ' },
    { value: 'art',           en: '🎨 Art & Drawing',                th: '🎨 ศิลปะ / วาดรูป' },
    { value: 'swim_coach',    en: '🏊 Swimming lessons',             th: '🏊 สอนว่ายน้ำ' },
    { value: 'coding',        en: '💻 Coding for kids',              th: '💻 โค้ดดิ้งสำหรับเด็ก' },
  ],
  multiple: [
    { value: 'nanny',         en: '👶 Nanny / childcare',            th: '👶 พี่เลี้ยงเด็ก' },
    { value: 'cleaning',      en: '🧹 Cleaning',                     th: '🧹 ทำความสะอาด' },
    { value: 'cooking',       en: '🍳 Cooking',                      th: '🍳 ทำอาหาร' },
    { value: 'driving',       en: '🚗 Driving',                      th: '🚗 ขับรถ' },
    { value: 'garden',        en: '🌿 Gardening',                    th: '🌿 ดูแลสวน' },
    { value: 'elder',         en: '🏥 Elder care',                   th: '🏥 ดูแลผู้สูงอายุ' },
    { value: 'tutoring',      en: '📚 Tutoring / teaching',          th: '📚 สอนพิเศษ' },
  ],
};

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

export const LANGUAGES = [
  { value: 'english', label: '🇬🇧 English' },
  { value: 'thai',    label: '🇹🇭 Thai' },
  { value: 'tagalog', label: '🇵🇭 Tagalog' },
  { value: 'russian', label: '🇷🇺 Russian' },
  { value: 'german',  label: '🇩🇪 German' },
  { value: 'chinese', label: '🇨🇳 Chinese' },
  { value: 'other',   label: '🌍 Other' },
];
