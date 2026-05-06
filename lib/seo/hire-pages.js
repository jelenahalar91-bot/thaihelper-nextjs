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
      title: `Hire Household Staff in ${city.name} — Nannies, Maids, Chefs & More | ThaiHelper`,
      titleTh: `จ้างผู้ช่วยงานบ้านใน${city.name_th} — พี่เลี้ยง แม่บ้าน พ่อครัว | ThaiHelper`,
      title_th: `จ้างผู้ช่วยงานบ้านใน${city.name_th} — พี่เลี้ยง แม่บ้าน พ่อครัว และอื่นๆ`, // back-compat
      h1: `Hire Trusted Household Staff in ${city.name}`,
      h1Th: `หาผู้ช่วยงานบ้านที่เชื่อถือได้ใน${city.name_th}`,
      description: `Find verified household helpers in ${city.name}, Thailand. Browse nannies, housekeepers, private chefs, drivers and more — direct hire, no middleman fees, free for helpers.`,
      descriptionTh: `หาผู้ช่วยงานบ้านที่ผ่านการยืนยันใน${city.name_th} พี่เลี้ยง แม่บ้าน พ่อครัว คนขับรถ — จ้างตรง ไม่มีค่านายหน้า ฟรีสำหรับผู้ช่วย`,
      description_th: `หาผู้ช่วยงานบ้านที่ผ่านการยืนยันใน${city.name_th} พี่เลี้ยง แม่บ้าน พ่อครัว คนขับรถ และอื่นๆ บน ThaiHelper — ฟรี ไม่มีค่านายหน้า`, // back-compat
      keywords: `household staff ${city.name}, hire helper ${city.name}, maid ${city.name}, nanny ${city.name}, domestic help ${city.name} Thailand`,
      areas: city.areas,
      cityDescription: city.description,
    });
  }

  // 2. Category-only pages: /hire/nanny, /hire/housekeeper, etc.
  for (const cat of CATEGORIES_DATA) {
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
      title: `Hire a ${cat.name} in Thailand — Verified Profiles | ThaiHelper`,
      titleTh: `จ้าง${cat.name_th}ในประเทศไทย — โปรไฟล์ที่ยืนยันแล้ว | ThaiHelper`,
      title_th: `จ้าง${cat.name_th}ในประเทศไทย — โปรไฟล์ที่ผ่านการยืนยันบน ThaiHelper`, // back-compat
      h1: `Hire a Trusted ${cat.name} in Thailand`,
      h1Th: `หา${cat.name_th}ที่เชื่อถือได้ในประเทศไทย`,
      description: cat.description,
      descriptionTh: `หา${cat.name_th}ที่ผ่านการยืนยันในประเทศไทย ติดต่อโดยตรง ไม่มีค่านายหน้า ฟรีสำหรับผู้ช่วย`,
      description_th: `หา${cat.name_th}ที่ผ่านการยืนยันในประเทศไทย ติดต่อโดยตรง ไม่มีค่านายหน้า ฟรีสำหรับผู้ช่วย`, // back-compat
      keywords: cat.keywords,
      salaryRange: cat.salary_range,
      icon: cat.icon,
    });
  }

  // 3. City + Category combo pages: /hire/nanny-bangkok, /hire/chef-phuket, etc.
  for (const city of CITIES_DATA) {
    for (const cat of CATEGORIES_DATA) {
      const adjustedMin = Math.round(cat.salary_range.min * city.salary_modifier);
      const adjustedMax = Math.round(cat.salary_range.max * city.salary_modifier);

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
        title: `Hire a ${cat.name} in ${city.name} — Verified Profiles | ThaiHelper`,
        titleTh: `จ้าง${cat.name_th}ใน${city.name_th} — โปรไฟล์ที่ยืนยันแล้ว | ThaiHelper`,
        title_th: `จ้าง${cat.name_th}ใน${city.name_th} — ThaiHelper`, // back-compat
        h1: `Hire a Trusted ${cat.name} in ${city.name}`,
        h1Th: `หา${cat.name_th}ที่เชื่อถือได้ใน${city.name_th}`,
        description: `Find verified ${cat.name.toLowerCase()} profiles in ${city.name}, Thailand. Salary range ${adjustedMin.toLocaleString()}–${adjustedMax.toLocaleString()} THB/month. Direct hire, no middleman, free for helpers.`,
        descriptionTh: `หา${cat.name_th}ที่ผ่านการยืนยันใน${city.name_th} เงินเดือน ${adjustedMin.toLocaleString()}–${adjustedMax.toLocaleString()} บาท/เดือน จ้างตรง ไม่มีค่านายหน้า`,
        description_th: `หา${cat.name_th}ที่ผ่านการยืนยันใน${city.name_th} เงินเดือน ${adjustedMin.toLocaleString()}–${adjustedMax.toLocaleString()} บาท/เดือน จ้างตรง ไม่มีค่านายหน้า`, // back-compat
        keywords: `${cat.keywords}, ${cat.name.toLowerCase()} ${city.name}`,
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
