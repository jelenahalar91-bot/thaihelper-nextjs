/**
 * City constants for ThaiHelper.
 *
 * CITIES — simple string array used by existing pages (helpers, register, etc.)
 * CITIES_DATA — rich objects for SEO/GEO landing pages (/hire/)
 */

// Full city list with slug (used by helper register) + display name (used by employer register).
// Ordered by expat/family demand: biggest cities first, then islands, then secondary cities.
export const CITY_OPTIONS = [
  { slug: 'bangkok',      name: 'Bangkok' },
  { slug: 'chiang_mai',   name: 'Chiang Mai' },
  { slug: 'phuket',       name: 'Phuket' },
  { slug: 'pattaya',      name: 'Pattaya' },
  { slug: 'hua_hin',      name: 'Hua Hin' },
  { slug: 'krabi',        name: 'Krabi' },
  { slug: 'ao_nang',      name: 'Ao Nang' },
  { slug: 'koh_samui',    name: 'Koh Samui' },
  { slug: 'koh_phangan',  name: 'Koh Phangan' },
  { slug: 'koh_tao',      name: 'Koh Tao' },
  { slug: 'koh_lanta',    name: 'Koh Lanta' },
  { slug: 'koh_chang',    name: 'Koh Chang' },
  { slug: 'chonburi',     name: 'Chonburi' },
  { slug: 'rayong',       name: 'Rayong' },
  { slug: 'nonthaburi',   name: 'Nonthaburi' },
  { slug: 'samut_prakan', name: 'Samut Prakan' },
  { slug: 'chiang_rai',   name: 'Chiang Rai' },
  { slug: 'pai',          name: 'Pai' },
  { slug: 'khon_kaen',    name: 'Khon Kaen' },
  { slug: 'udon_thani',   name: 'Udon Thani' },
];

// Simple string array — used by existing pages for dropdowns/filters (employer register, etc.)
export const CITIES = CITY_OPTIONS.map(c => c.name);

// Render either a slug ("chiang_mai") or a display name ("Chiang Mai") as
// the canonical display name. Falls back to a tidied-up version of the
// input (underscores → spaces, capitalised) for unknown values like
// legacy entries or "other".
export function formatCity(value) {
  if (!value) return '';
  const v = String(value).trim();
  const match = CITY_OPTIONS.find(c => c.slug === v.toLowerCase() || c.name.toLowerCase() === v.toLowerCase());
  if (match) return match.name;
  return v.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
}

// Maximum number of additional cities a helper can pick beyond their primary
// city. Five covers realistic cases (e.g. Andaman island helpers working
// across Krabi, Ao Nang, Koh Yao, Phi Phi, Phuket) without diluting SEO.
export const MAX_ADDITIONAL_CITIES = 5;

// Parse a comma-separated city slug list into a clean array of slugs.
// Empty/null input returns []. Whitespace and the helper's own primary
// city slug (if passed) are removed.
export function parseAdditionalCities(csv, primarySlug) {
  if (!csv) return [];
  const primary = primarySlug ? String(primarySlug).toLowerCase() : null;
  return String(csv)
    .split(/[,]+/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s && s !== primary);
}

// Render an additional-cities CSV as a human list, e.g.
// "ao_nang, koh_phi_phi" → "Ao Nang, Koh Phi Phi".
export function formatAdditionalCities(csv, primarySlug) {
  return parseAdditionalCities(csv, primarySlug).map(formatCity).join(', ');
}

// Rich city data — used by /hire/ landing pages and SEO schemas
export const CITIES_DATA = [
  {
    slug: 'bangkok',
    name: 'Bangkok',
    name_th: 'กรุงเทพฯ',
    region: 'Central Thailand',
    areas: ['Sukhumvit', 'Sathorn', 'Silom', 'Thonglor', 'Ekkamai', 'Asoke', 'Phrom Phong', 'On Nut', 'Bang Na', 'Ratchadaphisek'],
    description: "Thailand's capital and largest city. Home to the biggest expat community and highest demand for household staff.",
    salary_modifier: 1.0,
  },
  {
    slug: 'chiang-mai',
    name: 'Chiang Mai',
    name_th: 'เชียงใหม่',
    region: 'Northern Thailand',
    areas: ['Nimman', 'Old City', 'Hang Dong', 'San Sai', 'Mae Rim', 'San Kamphaeng'],
    description: 'Popular with digital nomads and retirees. More affordable than Bangkok with a growing expat community.',
    salary_modifier: 0.8,
  },
  {
    slug: 'phuket',
    name: 'Phuket',
    name_th: 'ภูเก็ต',
    region: 'Southern Thailand',
    areas: ['Patong', 'Kata', 'Karon', 'Rawai', 'Chalong', 'Kamala', 'Bang Tao', 'Laguna'],
    description: "Thailand's premier island destination. High demand for villa staff, pool care, private chefs, and drivers.",
    salary_modifier: 1.0,
  },
  {
    slug: 'pattaya',
    name: 'Pattaya',
    name_th: 'พัทยา',
    region: 'Eastern Thailand',
    areas: ['Jomtien', 'Pratumnak', 'Naklua', 'Wong Amat', 'Na Jomtien', 'Huay Yai'],
    description: 'Large retiree and long-stay tourist community. Strong demand for elder care, drivers, and housekeepers.',
    salary_modifier: 0.85,
  },
  {
    slug: 'koh-samui',
    name: 'Koh Samui',
    name_th: 'เกาะสมุย',
    region: 'Southern Thailand',
    areas: ['Chaweng', 'Lamai', 'Bophut', 'Maenam', 'Bangrak', 'Nathon'],
    description: 'Island living with high demand for villa management, private chefs, housekeepers, and pool care.',
    salary_modifier: 0.95,
  },
  {
    slug: 'hua-hin',
    name: 'Hua Hin',
    name_th: 'หัวหิน',
    region: 'Western Thailand',
    areas: ['Hua Hin Center', 'Khao Takiab', 'Pranburi', 'Cha-Am', 'Sam Roi Yot'],
    description: 'Popular retirement destination for Thai and international families. Steady demand for housekeepers and caregivers.',
    salary_modifier: 0.85,
  },
  {
    slug: 'krabi',
    name: 'Krabi',
    name_th: 'กระบี่',
    region: 'Southern Thailand',
    areas: ['Krabi Town', 'Klong Muang', 'Tub Kaek', 'Nong Thale', 'Ao Nam Mao'],
    description: 'Andaman-coast province with a steady expat retiree community and a growing pool of villa rentals. Demand is strongest for housekeepers, pool care and seasonal nannies during the November–April high season.',
    salary_modifier: 0.85,
  },
  {
    slug: 'ao-nang',
    name: 'Ao Nang',
    name_th: 'อ่าวนาง',
    region: 'Southern Thailand',
    areas: ['Ao Nang Beach', 'Nopparat Thara', 'Klong Muang', 'Tub Kaek', 'Ao Nam Mao'],
    description: 'Tourist beach town in Krabi province with year-round expat residents and luxury villa estates. High demand for villa staff, private chefs and family drivers — especially among long-stay European and Russian families.',
    salary_modifier: 0.9,
  },
  {
    slug: 'koh-phangan',
    name: 'Koh Phangan',
    name_th: 'เกาะพะงัน',
    region: 'Southern Thailand',
    areas: ['Thong Sala', 'Sri Thanu', 'Haad Yuan', 'Haad Rin', 'Chaloklum'],
    description: 'Wellness and digital-nomad island with a growing long-term resident community around Sri Thanu and Srithanu. Most jobs are part-time housekeeping, childcare for nomad families, and cooks for retreat villas.',
    salary_modifier: 0.9,
  },
  {
    slug: 'chonburi',
    name: 'Chonburi',
    name_th: 'ชลบุรี',
    region: 'Eastern Thailand',
    areas: ['Bang Saen', 'Sriracha', 'Bang Lamung', 'Laem Chabang', 'Pluak Daeng'],
    description: 'Industrial hub on the Eastern Seaboard with large Japanese, Korean, Chinese and Indian expat communities working in nearby factories. Steady demand for bilingual nannies, drivers and full-time housekeepers — long-term contracts are the norm.',
    salary_modifier: 0.9,
  },
  {
    slug: 'chiang-rai',
    name: 'Chiang Rai',
    name_th: 'เชียงราย',
    region: 'Northern Thailand',
    areas: ['Chiang Rai Town', 'Mae Chan', 'Mae Sai', 'Doi Tung', 'Ban Du'],
    description: 'Quiet northern province with a slow-living retiree and creative expat community. Lower cost of living means smaller helper budgets, but loyal long-term staff are easy to find — especially for housekeeping and elder care.',
    salary_modifier: 0.75,
  },
  {
    slug: 'pai',
    name: 'Pai',
    name_th: 'ปาย',
    region: 'Northern Thailand',
    areas: ['Pai Town', 'Wiang Tai', 'Mae Yen', 'Pong Du'],
    description: 'Bohemian mountain town in Mae Hong Son popular with long-term digital nomads, yoga teachers and retreat owners. Demand is small but specific — housekeepers and gardeners for guesthouses, rural retreat homes and farm-stays.',
    salary_modifier: 0.7,
  },
  {
    slug: 'udon-thani',
    name: 'Udon Thani',
    name_th: 'อุดรธานี',
    region: 'Northeastern Thailand',
    areas: ['Mueang Udon Thani', 'Nong Wua So', 'Nong Han', 'Ban Phue', 'Kumphawapi'],
    description: 'Largest city in upper Isaan and the centre of a well-established Western-retiree-with-Thai-partner community. Most postings are part-time housekeeping, gardening and elder companion roles for couples in their fifties and sixties.',
    salary_modifier: 0.7,
  },
  {
    slug: 'khon-kaen',
    name: 'Khon Kaen',
    name_th: 'ขอนแก่น',
    region: 'Northeastern Thailand',
    areas: ['Mueang Khon Kaen', 'Tha Phra', 'Ban Phai', 'Si Chan', 'Nam Phong'],
    description: 'University and regional medical hub in Isaan with a smaller but stable expat community among academic and medical professional families. Demand skews toward English tutors, full-time housekeepers and after-school nannies.',
    salary_modifier: 0.75,
  },
];

export function getCityBySlug(slug) {
  return CITIES_DATA.find((c) => c.slug === slug) || null;
}

export function getAllCitySlugs() {
  return CITIES_DATA.map((c) => c.slug);
}
