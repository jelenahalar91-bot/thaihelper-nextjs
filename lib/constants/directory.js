/**
 * Expert directory option lists — listing types, specialties, tiers.
 * Used by /pages/directory and /pages/api/directory.
 */

export const DIRECTORY_TYPES = [
  { value: 'lawyer',      en: 'Immigration Lawyer',     th: 'ทนายความตรวจคนเข้าเมือง' },
  { value: 'visa_agent',  en: 'Visa Agent',             th: 'ตัวแทนวีซ่า' },
  { value: 'mou_agency',  en: 'MOU Agency',             th: 'หน่วยงาน MOU' },
  { value: 'agency',      en: 'Staffing Agency',        th: 'บริษัทจัดหางาน' },
];

export const DIRECTORY_TYPE_VALUES = DIRECTORY_TYPES.map(o => o.value);

export const SPECIALTIES = [
  { value: 'work_permit',           en: 'Work Permits',              th: 'ใบอนุญาตทำงาน' },
  { value: 'visa',                  en: 'Visa Services',             th: 'บริการวีซ่า' },
  { value: 'mou',                   en: 'MOU Process',               th: 'กระบวนการ MOU' },
  { value: 'company_registration',  en: 'Company Registration',      th: 'จดทะเบียนบริษัท' },
  { value: 'labor_law',             en: 'Thai Labor Law',            th: 'กฎหมายแรงงานไทย' },
  { value: 'social_security',       en: 'Social Security',           th: 'ประกันสังคม' },
];

export const SPECIALTY_VALUES = SPECIALTIES.map(o => o.value);

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
