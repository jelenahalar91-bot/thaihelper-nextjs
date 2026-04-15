/**
 * City constants for ThaiHelper.
 *
 * CITIES — simple string array used by existing pages (helpers, register, etc.)
 * CITIES_DATA — rich objects for SEO/GEO landing pages (/hire/)
 */

// Simple string array — used by existing pages for dropdowns/filters
export const CITIES = [
  'Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Koh Samui', 'Hua Hin',
  'Krabi', 'Khon Kaen', 'Udon Thani', 'Nakhon Ratchasima',
];

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
