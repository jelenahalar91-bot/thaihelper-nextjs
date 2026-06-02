/**
 * Generates all /hire/ landing pages for SEO & GEO.
 *
 * Pages generated:
 * - /hire/bangkok           (city-only)
 * - /hire/nanny             (category-only)
 * - /hire/nanny-bangkok     (city + category combo)
 * - etc.
 *
 * This creates a dense internal link network that AI crawlers love.
 */

import { CITIES_DATA } from '@/lib/constants/cities';
import { CATEGORIES_DATA } from '@/lib/constants/categories';

// Synonyms per category — used to widen long-tail match in descriptions and body.
// Targets actual GSC queries with 0 clicks but real impressions
// (babysitter, live-in maid, english-speaking nanny, etc.).
const CATEGORY_SYNONYMS = {
  nanny:        'babysitter, live-in nanny, English-speaking nanny, childminder, au pair',
  housekeeper:  'maid, cleaner, live-in maid, domestic helper, house cleaner',
  chef:         'private cook, household cook, family chef, personal chef',
  driver:       'private driver, family chauffeur, school-run driver',
  gardener:     'garden helper, landscaper, pool maintenance, gardener',
  caregiver:    'home nurse, elder care, senior care companion, live-in caregiver',
  tutor:        'private tutor, English teacher, math tutor, home-school teacher',
};

// Short title-friendly names. Google SERP shows ~55 chars before pipe on
// mobile; full names like "Housekeeper & Cleaner" eat budget that's
// better spent on a benefit phrase ("No Agency Fees"). Short names also
// match the single-word queries users actually type
// ("housekeeper" gets 29 impr/month, "housekeeper & cleaner" gets ~0).
const CATEGORY_SHORT_NAME = {
  nanny:       'Nanny',
  housekeeper: 'Housekeeper',
  chef:        'Private Chef',
  driver:      'Driver',
  gardener:    'Gardener',
  caregiver:   'Caregiver',
  tutor:       'Tutor',
  petsitter:   'Pet Sitter',
};

// Lowercase versions for inline use in descriptions ("hire a housekeeper").
const CATEGORY_SHORT_LC = Object.fromEntries(
  Object.entries(CATEGORY_SHORT_NAME).map(([k, v]) => [k, v.toLowerCase()]),
);

function buildPages() {
  const pages = [];

  // 1. City-only pages: /hire/bangkok, /hire/phuket, etc.
  for (const city of CITIES_DATA) {
    pages.push({
      slug: city.slug,
      city: city.slug,
      cityEn: city.name,
      cityTh: city.name_th,
      city_th: city.name_th, // back-compat
      category: null,
      categoryEn: null,
      categoryTh: null,
      // Title v2 (2026-06-02 CTR push): "Hire a..." commercial intent
      // verb. Short benefit ("Free, No Agency") beats vague "Verified
      // Profiles". Mobile-truncation-safe (~58 chars before pipe).
      title: `Hire a Nanny, Maid or Chef in ${city.name} — Free, No Agency | ThaiHelper`,
      titleTh: `จ้างพี่เลี้ยง แม่บ้าน พ่อครัวใน${city.name_th} — ฟรี ไม่ผ่านนายหน้า | ThaiHelper`,
      title_th: `จ้างผู้ช่วยงานบ้านใน${city.name_th} — พี่เลี้ยง แม่บ้าน พ่อครัว และอื่นๆ`, // back-compat
      h1: `Hire Household Staff in ${city.name}`,
      h1Th: `จ้างผู้ช่วยงานบ้านใน${city.name_th}`,
      description: `Hire household staff in ${city.name} directly — nannies, maids, chefs, drivers, caregivers. No agency fees, no contracts. Browse verified profiles, message in 1 click. Free to start.`,
      descriptionTh: `จ้างผู้ช่วยงานบ้านใน${city.name_th} โดยตรง — พี่เลี้ยง แม่บ้าน พ่อครัว คนขับ ผู้ดูแล ไม่มีค่านายหน้า ไม่มีสัญญา ติดต่อโดยตรงในคลิกเดียว เริ่มฟรี`,
      description_th: `หาผู้ช่วยงานบ้านที่ผ่านการยืนยันใน${city.name_th} พี่เลี้ยง แม่บ้าน พ่อครัว คนขับรถ และอื่นๆ บน ThaiHelper — ฟรี ไม่มีค่านายหน้า`, // back-compat
      keywords: `find household staff ${city.name}, hire helper ${city.name}, maid ${city.name}, nanny ${city.name}, live-in maid ${city.name}, babysitter ${city.name}, domestic helper ${city.name}`,
      areas: city.areas,
      cityDescription: city.description,
    });
  }

  // 2. Category-only pages: /hire/nanny, /hire/housekeeper, etc.
  for (const cat of CATEGORIES_DATA) {
    const syn = CATEGORY_SYNONYMS[cat.slug] || '';
    const shortName = CATEGORY_SHORT_NAME[cat.slug] || cat.name;
    const shortLc = CATEGORY_SHORT_LC[cat.slug] || cat.name.toLowerCase();
    const salaryMin = cat.salary_range.min.toLocaleString();
    const salaryMax = cat.salary_range.max.toLocaleString();
    pages.push({
      slug: cat.slug,
      city: null,
      cityEn: null,
      cityTh: null,
      city_th: null,
      category: cat.slug,
      categoryEn: cat.name,
      categoryTh: cat.name_th,
      category_th: cat.name_th, // back-compat
      // Title v2 (2026-06-02 CTR push): "Hire a..." action verb,
      // short-form category name to match how people actually search
      // ("housekeeper" 29 impr, "housekeeper & cleaner" 0 impr),
      // explicit benefit "No Agency Fees" as differentiator vs Kiidu/
      // Ayasan in SERP.
      title: `Hire a ${shortName} in Thailand — No Agency Fees | ThaiHelper`,
      titleTh: `จ้าง${cat.name_th}ในไทย — ฟรี ไม่ผ่านนายหน้า | ThaiHelper`,
      title_th: `จ้าง${cat.name_th}ในประเทศไทย — โปรไฟล์ที่ผ่านการยืนยันบน ThaiHelper`, // back-compat
      h1: `Hire a ${shortName} in Thailand`,
      h1Th: `จ้าง${cat.name_th}ในประเทศไทย`,
      // Description v2: action verb, concrete salary range, direct-hire
      // USP, 1-click CTA. Under 160 chars so SERP doesn't truncate.
      description: `Hire a ${shortLc} in Thailand directly — no agency fees, no contracts. Browse verified profiles, message in 1 click. Average salary ${salaryMin}–${salaryMax} THB/month. Free to start.`,
      descriptionTh: `จ้าง${cat.name_th}ในไทยโดยตรง — ไม่มีค่านายหน้า ไม่มีสัญญา ดูโปรไฟล์ที่ยืนยันแล้ว ติดต่อในคลิกเดียว เงินเดือนเฉลี่ย ${salaryMin}–${salaryMax} บาท/เดือน เริ่มฟรี`,
      description_th: `หา${cat.name_th}ที่ผ่านการยืนยันในประเทศไทย ติดต่อโดยตรง ไม่มีค่านายหน้า ฟรีสำหรับผู้ช่วย`, // back-compat
      keywords: `${cat.keywords}, ${syn}`,
      synonyms: syn,
      salaryRange: cat.salary_range,
      icon: cat.icon,
    });
  }

  // 3. City + Category combo pages: /hire/nanny-bangkok, /hire/chef-phuket, etc.
  for (const city of CITIES_DATA) {
    for (const cat of CATEGORIES_DATA) {
      const adjustedMin = Math.round(cat.salary_range.min * city.salary_modifier);
      const adjustedMax = Math.round(cat.salary_range.max * city.salary_modifier);
      const syn = CATEGORY_SYNONYMS[cat.slug] || '';
      const shortName = CATEGORY_SHORT_NAME[cat.slug] || cat.name;
      const shortLc = CATEGORY_SHORT_LC[cat.slug] || cat.name.toLowerCase();
      // Compact salary display for title: 12,000–18,000 → 12k–18k
      const salaryK = (n) => n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
      const salaryTitle = `${salaryK(adjustedMin)}–${salaryK(adjustedMax)} THB/mo`;
      const salaryMinFull = adjustedMin.toLocaleString();
      const salaryMaxFull = adjustedMax.toLocaleString();

      pages.push({
        slug: `${cat.slug}-${city.slug}`,
        city: city.slug,
        cityEn: city.name,
        cityTh: city.name_th,
        city_th: city.name_th, // back-compat
        category: cat.slug,
        categoryEn: cat.name,
        categoryTh: cat.name_th,
        category_th: cat.name_th, // back-compat
        // Title v2 (2026-06-02 CTR push): action verb + city + concrete
        // salary range in the title itself. Numbers in SERP titles are
        // one of the strongest CTR drivers — Google snippet renders the
        // number and signals the page has the answer the user wants.
        title: `Hire a ${shortName} in ${city.name} — ${salaryTitle} | ThaiHelper`,
        titleTh: `จ้าง${cat.name_th}ใน${city.name_th} — ${salaryK(adjustedMin)}–${salaryK(adjustedMax)} บาท/เดือน | ThaiHelper`,
        title_th: `จ้าง${cat.name_th}ใน${city.name_th} — ThaiHelper`, // back-compat
        h1: `Hire a ${shortName} in ${city.name}`,
        h1Th: `จ้าง${cat.name_th}ใน${city.name_th}`,
        description: `Hire a ${shortLc} in ${city.name} directly — no agency fees, no contracts. Full-time, part-time, or live-in. Salary ${salaryMinFull}–${salaryMaxFull} THB/month. Browse verified profiles, message in 1 click.`,
        descriptionTh: `จ้าง${cat.name_th}ใน${city.name_th}โดยตรง — ไม่มีค่านายหน้า ไม่มีสัญญา เต็มเวลา ชั่วคราว หรืออยู่ประจำ เงินเดือน ${salaryMinFull}–${salaryMaxFull} บาท/เดือน ติดต่อในคลิกเดียว`,
        description_th: `หา${cat.name_th}ที่ผ่านการยืนยันใน${city.name_th} เงินเดือน ${salaryMinFull}–${salaryMaxFull} บาท/เดือน จ้างตรง ไม่มีค่านายหน้า`, // back-compat
        keywords: `${cat.keywords}, ${cat.name.toLowerCase()} ${city.name}, ${syn}, full time ${cat.slug} ${city.name}, live-in ${cat.slug} ${city.name}`,
        synonyms: syn,
        salaryRange: { min: adjustedMin, max: adjustedMax },
        icon: cat.icon,
        areas: city.areas,
        cityDescription: city.description,
      });
    }
  }

  return pages;
}

// Cache the generated pages
let _pages = null;

export function getAllHirePages() {
  if (!_pages) _pages = buildPages();
  return _pages;
}

export function getHirePageBySlug(slug) {
  return getAllHirePages().find((p) => p.slug === slug) || null;
}

export function getAllHireSlugs() {
  return getAllHirePages().map((p) => p.slug);
}
