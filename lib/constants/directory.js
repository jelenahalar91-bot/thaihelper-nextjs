/**
 * Expert directory option lists — listing types, specialties, tiers.
 * Used by /pages/directory and /pages/api/directory.
 */

export const DIRECTORY_TYPES = [
  { value: 'agency',          en: 'Staffing Agency',     th: 'บริษัทจัดหางาน' },
  { value: 'service_company', en: 'Service Company',     th: 'บริษัทบริการ' },
  { value: 'lawyer',          en: 'Immigration Lawyer',  th: 'ทนายความตรวจคนเข้าเมือง' },
  { value: 'visa_agent',      en: 'Visa Agent',          th: 'ตัวแทนวีซ่า' },
  { value: 'mou_agency',      en: 'MOU Agency',          th: 'หน่วยงาน MOU' },
  { value: 'training',        en: 'Training',            th: 'ฝึกอบรม' },
  { value: 'partner',         en: 'Partner',             th: 'พันธมิตร' },
  { value: 'association',     en: 'Association',         th: 'สมาคม' },
];

export const DIRECTORY_TYPE_VALUES = DIRECTORY_TYPES.map(o => o.value);

// Specialty groups. The directory started as a legal-expert list, so the only
// specialties were the six legal ones below — fine for 32 listings, useless
// once the household side arrives, because gardeners, pool companies and
// cleaners all share the single 'service_company' type and would be
// indistinguishable in the filter.
//
// Order matters: it is the order the filter and the chip groups render in,
// and 'household' goes first because that is what a family browsing the
// directory is looking for.
export const SPECIALTY_GROUPS = [
  { value: 'household', en: 'Household services', th: 'บริการในบ้าน' },
  { value: 'training',  en: 'Courses & training', th: 'คอร์สและการอบรม' },
  { value: 'legal',     en: 'Legal & paperwork',  th: 'กฎหมายและเอกสาร' },
  { value: 'support',   en: 'Advice & support',   th: 'คำแนะนำและการช่วยเหลือ' },
];

export const SPECIALTIES = [
  // Household — what a family hires a company for.
  { value: 'cleaning',             group: 'household', en: 'Cleaning & Housekeeping', th: 'ทำความสะอาดและงานแม่บ้าน' },
  { value: 'childcare',            group: 'household', en: 'Childcare & Nanny',       th: 'ดูแลเด็กและพี่เลี้ยงเด็ก' },
  { value: 'elder_care',           group: 'household', en: 'Elderly & Home Care',     th: 'ดูแลผู้สูงอายุและดูแลที่บ้าน' },
  { value: 'cooking',              group: 'household', en: 'Cooking & Chef',          th: 'ทำอาหารและเชฟ' },
  { value: 'driving',              group: 'household', en: 'Driver Services',         th: 'บริการคนขับรถ' },
  { value: 'gardening',            group: 'household', en: 'Gardening & Landscaping', th: 'ทำสวนและจัดสวน' },
  { value: 'pool',                 group: 'household', en: 'Pool Maintenance',        th: 'ดูแลสระว่ายน้ำ' },
  { value: 'tutoring',             group: 'household', en: 'Tutoring & Teaching',    th: 'สอนพิเศษและการสอน' },
  { value: 'pet_care',             group: 'household', en: 'Pet Sitting & Care',      th: 'ดูแลสัตว์เลี้ยง' },
  { value: 'property_management',  group: 'household', en: 'Villa & Property Management', th: 'ดูแลวิลล่าและอสังหาริมทรัพย์' },

  // Training — what a helper takes to get better work. The directory had
  // exactly one entry in this whole area before.
  { value: 'first_aid',            group: 'training', en: 'First Aid & CPR',        th: 'ปฐมพยาบาลและการกู้ชีพ CPR' },
  { value: 'childcare_training',   group: 'training', en: 'Childcare Training',     th: 'อบรมการดูแลเด็ก' },
  { value: 'caregiver_training',   group: 'training', en: 'Caregiver Training',     th: 'อบรมการดูแลผู้สูงอายุ' },
  { value: 'housekeeping_training',group: 'training', en: 'Housekeeping Training',  th: 'อบรมงานแม่บ้าน' },
  { value: 'language_training',    group: 'training', en: 'Language Courses',       th: 'คอร์สเรียนภาษา' },
  { value: 'cooking_school',       group: 'training', en: 'Cooking Courses',        th: 'คอร์สเรียนทำอาหาร' },

  // Legal — the original six. Slugs are unchanged: they are stored in
  // directory_listings.specialties on live rows.
  { value: 'work_permit',          group: 'legal', en: 'Work Permits',         th: 'ใบอนุญาตทำงาน' },
  { value: 'visa',                 group: 'legal', en: 'Visa Services',        th: 'บริการวีซ่า' },
  { value: 'mou',                  group: 'legal', en: 'MOU Process',          th: 'กระบวนการ MOU' },
  { value: 'company_registration', group: 'legal', en: 'Company Registration', th: 'จดทะเบียนบริษัท' },
  { value: 'labor_law',            group: 'legal', en: 'Thai Labor Law',       th: 'กฎหมายแรงงานไทย' },
  { value: 'social_security',      group: 'legal', en: 'Social Security',      th: 'ประกันสังคม' },

  // Support — associations and migrant-worker organisations, for the helper
  // who needs somewhere to turn that is not an employer.
  { value: 'worker_rights',        group: 'support', en: 'Worker Rights & Support', th: 'สิทธิแรงงานและการช่วยเหลือ' },
];

export const SPECIALTY_VALUES = SPECIALTIES.map(o => o.value);

/**
 * SPECIALTIES split into its groups, in SPECIALTY_GROUPS order, with empty
 * groups dropped. Drives the <optgroup> filter and the grouped chip picker —
 * a flat list of 22 was readable as 6 and is not.
 */
export function groupedSpecialties() {
  return SPECIALTY_GROUPS
    .map(g => ({ ...g, options: SPECIALTIES.filter(o => o.group === g.value) }))
    .filter(g => g.options.length > 0);
}

// Languages directory experts may speak. Kept short on purpose — extend
// when seed data requires it.
export const DIRECTORY_LANGUAGES = [
  { value: 'english',  en: 'English',  th: 'อังกฤษ' },
  { value: 'thai',     en: 'Thai',     th: 'ไทย' },
  { value: 'german',   en: 'German',   th: 'เยอรมัน' },
  { value: 'chinese',  en: 'Chinese',  th: 'จีน' },
  { value: 'japanese', en: 'Japanese', th: 'ญี่ปุ่น' },
  { value: 'russian',  en: 'Russian',  th: 'รัสเซีย' },
];

export const NATIONALITIES_PLACED = [
  { value: 'thai',       en: 'Thai',       th: 'ไทย',         flag: '🇹🇭' },
  { value: 'filipino',   en: 'Filipino',   th: 'ฟิลิปปินส์',  flag: '🇵🇭' },
  { value: 'indonesian', en: 'Indonesian', th: 'อินโดนีเซีย',  flag: '🇮🇩' },
  { value: 'myanmar',    en: 'Myanmar',    th: 'เมียนมาร์',   flag: '🇲🇲' },
  { value: 'cambodian',  en: 'Cambodian',  th: 'กัมพูชา',    flag: '🇰🇭' },
  { value: 'vietnamese', en: 'Vietnamese', th: 'เวียดนาม',   flag: '🇻🇳' },
  { value: 'indian',     en: 'Indian',     th: 'อินเดีย',    flag: '🇮🇳' },
  { value: 'sri_lankan', en: 'Sri Lankan', th: 'ศรีลังกา',   flag: '🇱🇰' },
];

export const LISTING_TIERS = ['free', 'premium', 'featured'];

export const LISTING_STATUSES = ['active', 'inactive', 'pending'];

export function formatDirectoryType(value, lang = 'en') {
  const opt = DIRECTORY_TYPES.find(o => o.value === value);
  return opt ? (opt[lang] || opt.en) : '';
}

export function formatSpecialty(value, lang = 'en') {
  const opt = SPECIALTIES.find(o => o.value === value);
  return opt ? (opt[lang] || opt.en) : value;
}

export function formatLanguage(value, lang = 'en') {
  const opt = DIRECTORY_LANGUAGES.find(o => o.value === value);
  return opt ? (opt[lang] || opt.en) : value;
}

// Render a CSV slug list ("work_permit,visa,mou") as a comma-joined
// human-readable label string in the requested language.
export function formatCsvList(csv, options, lang = 'en') {
  if (!csv) return '';
  return String(csv)
    .split(/[,]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(slug => {
      const opt = options.find(o => o.value === slug);
      return opt ? (opt[lang] || opt.en) : slug;
    })
    .join(', ');
}
