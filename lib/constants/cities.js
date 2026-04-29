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
];

export function getCityBySlug(slug) {
  return CITIES_DATA.find((c) => c.slug === slug) || null;
}

export function getAllCitySlugs() {
  return CITIES_DATA.map((c) => c.slug);
}
