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
      // Title leads with "Find a" — matches GSC's top zero-click query
      // "find a housekeeper" (21 impressions / 0 clicks).
      title: `Find Household Staff in ${city.name} — Nannies, Maids, Chefs & Drivers | ThaiHelper`,
      titleTh: `หาผู้ช่วยงานบ้านใน${city.name_th} — พี่เลี้ยง แม่บ้าน พ่อครัว | ThaiHelper`,
      title_th: `จ้างผู้ช่วยงานบ้านใน${city.name_th} — พี่เลี้ยง แม่บ้าน พ่อครัว และอื่นๆ`, // back-compat
      h1: `Find Trusted Household Staff in ${city.name}`,
      h1Th: `หาผู้ช่วยงานบ้านที่เชื่อถือได้ใน${city.name_th}`,
      description: `Find verified nannies, housekeepers, maids, private chefs and drivers in ${city.name}. Full-time, part-time, or live-in — direct hire, no middleman fees, free for helpers.`,
      descriptionTh: `หาผู้ช่วยงานบ้านที่ผ่านการยืนยันใน${city.name_th} พี่เลี้ยง แม่บ้าน พ่อครัว คนขับรถ — จ้างตรง ไม่มีค่านายหน้า ฟรีสำหรับผู้ช่วย`,
      description_th: `หาผู้ช่วยงานบ้านที่ผ่านการยืนยันใน${city.name_th} พี่เลี้ยง แม่บ้าน พ่อครัว คนขับรถ และอื่นๆ บน ThaiHelper — ฟรี ไม่มีค่านายหน้า`, // back-compat
      keywords: `find household staff ${city.name}, hire helper ${city.name}, maid ${city.name}, nanny ${city.name}, live-in maid ${city.name}, babysitter ${city.name}, domestic helper ${city.name}`,
      areas: city.areas,
      cityDescription: city.description,
    });
  }

  // 2. Category-only pages: /hire/nanny, /hire/housekeeper, etc.
  for (const cat of CATEGORIES_DATA) {
    const syn = CATEGORY_SYNONYMS[cat.slug] || '';
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
      title: `Find a ${cat.name} in Thailand — Verified Profiles | ThaiHelper`,
      titleTh: `หา${cat.name_th}ในประเทศไทย — โปรไฟล์ที่ยืนยันแล้ว | ThaiHelper`,
      title_th: `จ้าง${cat.name_th}ในประเทศไทย — โปรไฟล์ที่ผ่านการยืนยันบน ThaiHelper`, // back-compat
      h1: `Find a Trusted ${cat.name} in Thailand`,
      h1Th: `หา${cat.name_th}ที่เชื่อถือได้ในประเทศไทย`,
      // Use cat.description as primary, but append synonym hint for long-tail match
      description: cat.description,
      descriptionTh: `หา${cat.name_th}ที่ผ่านการยืนยันในประเทศไทย ติดต่อโดยตรง ไม่มีค่านายหน้า ฟรีสำหรับผู้ช่วย`,
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
        title: `Find a ${cat.name} in ${city.name} — Verified Profiles | ThaiHelper`,
        titleTh: `หา${cat.name_th}ใน${city.name_th} — โปรไฟล์ที่ยืนยันแล้ว | ThaiHelper`,
        title_th: `จ้าง${cat.name_th}ใน${city.name_th} — ThaiHelper`, // back-compat
        h1: `Find a Trusted ${cat.name} in ${city.name}`,
        h1Th: `หา${cat.name_th}ที่เชื่อถือได้ใน${city.name_th}`,
        description: `Find verified ${cat.name.toLowerCase()} profiles in ${city.name} — full-time, part-time and live-in options. Average salary ${adjustedMin.toLocaleString()}–${adjustedMax.toLocaleString()} THB/month. Direct hire, no middleman.`,
        descriptionTh: `หา${cat.name_th}ที่ผ่านการยืนยันใน${city.name_th} เงินเดือน ${adjustedMin.toLocaleString()}–${adjustedMax.toLocaleString()} บาท/เดือน จ้างตรง ไม่มีค่านายหน้า`,
        description_th: `หา${cat.name_th}ที่ผ่านการยืนยันใน${city.name_th} เงินเดือน ${adjustedMin.toLocaleString()}–${adjustedMax.toLocaleString()} บาท/เดือน จ้างตรง ไม่มีค่านายหน้า`, // back-compat
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
