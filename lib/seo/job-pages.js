/**
 * The /jobs/ pages — the supply-side mirror of /hire/.
 *
 * WHY THESE EXIST. On 2026-11-25 the site had 134 /hire/ pages telling
 * families how to find a helper and not one page a helper could find by
 * searching for work. The channel that matters is the one we were not
 * serving: of the helpers who ever registered, those who arrived from Google
 * were active a fortnight later 40% of the time, against 11% for the Thai
 * Facebook ads — the best-retaining source and the smallest, 35 people all
 * told. Meanwhile "หางานแม่บ้าน ภูเก็ต" is contested by JobsDB, Indeed TH,
 * Jooble and JobPub, and thaihelper.app appears nowhere in it.
 *
 * WHAT MAKES THEM NOT DOORWAY PAGES. Each one is backed by families who are
 * searching right now — JobsDB ranks that query listing 34 nanny posts for
 * the whole country, and we have 291 households looking. A combination
 * without at least MIN_FAMILIES behind it redirects to its city page rather
 * than standing as an empty shell; see getStaticProps in pages/jobs/[slug].js.
 * That check runs against the database on every revalidation, so the set of
 * live pages follows the demand instead of a list someone has to remember to
 * update.
 *
 * NO JobPosting STRUCTURED DATA, deliberately. Google's job-posting schema
 * wants a named hiringOrganization, a validThrough date and a direct apply
 * path, and it polices them: the "employer" here is a private family we do
 * not name, so marking these up as job postings would be a misrepresentation
 * that risks a manual action across the domain. Breadcrumbs only.
 */

import { CITIES_DATA } from '@/lib/constants/cities';
import { CATEGORIES_DATA } from '@/lib/constants/categories';

// A page needs this many searching families to stand on its own.
export const MIN_FAMILIES = 2;

// Cities that carry enough demand to be worth a page of their own. Measured
// 2026-11-25: bangkok 101 searching families, phuket 47, hua_hin 23,
// pattaya 23, chiang_mai 21, koh_samui 12, krabi 5. Everything below krabi
// was in low single digits and would make a page that reads as empty.
const JOB_CITY_SLUGS = ['bangkok', 'phuket', 'hua-hin', 'pattaya', 'chiang-mai', 'koh-samui', 'krabi'];

// SEO slugs use hyphens, the database uses underscores ('chiang-mai' vs
// 'chiang_mai'). Everything that touches employer_accounts.city goes through
// this.
export function toDbCity(seoSlug) {
  return String(seoSlug || '').replace(/-/g, '_');
}

// Thai job-search phrasing. Thai writes "งาน<role>" for "<role> job", and
// these are the words people actually type — checked against the Google
// result pages for หางานแม่บ้าน and หางานพี่เลี้ยงเด็ก, where the job boards
// that rank use exactly these.
const CATEGORY_JOB_TH = {
  nanny:       'พี่เลี้ยงเด็ก',
  housekeeper: 'แม่บ้าน',
  chef:        'แม่ครัว',
  driver:      'คนขับรถ',
  gardener:    'คนสวน',
  elder_care:  'ผู้ดูแลผู้สูงอายุ',
  caregiver:   'ผู้ดูแลผู้สูงอายุ',
  tutor:       'ครูสอนพิเศษ',
  petsitter:   'ผู้ดูแลสัตว์เลี้ยง',
};

// Short English role names for titles — "Housekeeper jobs" reads and ranks
// better than "Housekeeper & Cleaner jobs".
const CATEGORY_JOB_EN = {
  nanny:       'Nanny',
  housekeeper: 'Housekeeper',
  chef:        'Private chef',
  driver:      'Driver',
  gardener:    'Gardener',
  elder_care:  'Caregiver',
  caregiver:   'Caregiver',
  tutor:       'Tutor',
  petsitter:   'Pet sitter',
};

const cityBySlug = new Map(CITIES_DATA.map((c) => [c.slug, c]));
const catBySlug = new Map(CATEGORIES_DATA.map((c) => [c.slug, c]));

function jobCities() {
  return JOB_CITY_SLUGS.map((s) => cityBySlug.get(s)).filter(Boolean);
}

function jobCategories() {
  return CATEGORIES_DATA.filter((c) => CATEGORY_JOB_EN[c.slug]);
}

function buildPages() {
  const pages = [];

  for (const city of jobCities()) {
    pages.push({
      slug: city.slug,
      kind: 'city',
      city: city.slug,
      dbCity: toDbCity(city.slug),
      cityEn: city.name,
      cityTh: city.name_th,
      category: null,
      titleEn: `Household jobs in ${city.name}`,
      titleTh: `งานผู้ช่วยในบ้าน ใน${city.name_th}`,
    });

    for (const cat of jobCategories()) {
      pages.push({
        slug: `${cat.slug}-${city.slug}`,
        kind: 'combo',
        city: city.slug,
        dbCity: toDbCity(city.slug),
        cityEn: city.name,
        cityTh: city.name_th,
        category: cat.slug,
        categoryEn: CATEGORY_JOB_EN[cat.slug],
        categoryTh: CATEGORY_JOB_TH[cat.slug] || cat.name_th,
        salary: cat.salary_range || null,
        salaryModifier: city.salary_modifier || 1,
        titleEn: `${CATEGORY_JOB_EN[cat.slug]} jobs in ${city.name}`,
        titleTh: `งาน${CATEGORY_JOB_TH[cat.slug] || cat.name_th} ใน${city.name_th}`,
      });
    }
  }

  return pages;
}

let cached = null;

export function getAllJobPages() {
  if (!cached) cached = buildPages();
  return cached;
}

export function getJobPageBySlug(slug) {
  return getAllJobPages().find((p) => p.slug === slug) || null;
}

// Monthly salary band for a combination, the category range scaled by the
// city's cost-of-living modifier and rounded to the nearest 500 baht so the
// page does not print a figure like 9,600 that looks more exact than it is.
export function salaryBand(page) {
  if (!page?.salary) return null;
  const round = (n) => Math.round((n * (page.salaryModifier || 1)) / 500) * 500;
  return { min: round(page.salary.min), max: round(page.salary.max) };
}
