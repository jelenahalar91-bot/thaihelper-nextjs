/**
 * Work-permit guidance for helpers, derived from nationality × categories.
 *
 * Shown at registration and on the helper's own profile. Purely
 * informational — nothing here blocks a signup or hides a profile. The
 * point is that a helper should not find out from an immigration officer
 * what we could have told them in a form.
 *
 * The legal picture (Ministry of Labour notification of 1 April 2020,
 * under the Royal Decree on Foreign Workers Management B.E. 2560):
 *
 *  - Household work is open to foreigners ONLY through a
 *    government-to-government labour MOU. Thailand has household-work
 *    MOUs with Myanmar, Laos and Cambodia. Nationals of those three can
 *    be employed by a private family; nobody else can.
 *  - CAMBODIA is the exception to that exception (checked 14 Oct 2026):
 *    the MOU is intact but Thailand has admitted no new Cambodian
 *    workers since Nov 2025, and renewals for Cambodians were put on
 *    hold while Lao/Myanmar/Vietnamese renewals continued. Someone
 *    already holding a valid permit may still be employable until it
 *    runs out; nobody new can come in. See lib/wizard-logic.js for the
 *    dates and sources.
 *  - Driving a motor vehicle is on List 1 — absolutely reserved for Thai
 *    nationals, no permit available to any foreigner, MOU or otherwise.
 *  - Teaching/tutoring is the one category with a route for other
 *    nationalities, but the permit is held by a school, language centre
 *    or tutoring company — never by the family being taught.
 *
 * Same rules as lib/wizard-logic.js, which serves the employer side.
 * Note the value sets differ: wizard-logic uses its own nationality
 * options ('laos', 'vietnam'), this module uses the profile values from
 * lib/constants/nationalities.js ('lao', 'vietnamese'). Keep both in
 * sync when the law changes.
 */

// Profile nationality values covered by a household-work MOU on paper.
export const MOU_HOUSEHOLD_NATIONALITIES = ['myanmar', 'lao', 'cambodia'];

// Of those, the ones where Thailand is actually issuing and renewing
// permits. This is the list that drives what we tell a helper.
export const MOU_HOUSEHOLD_OPEN = ['myanmar', 'lao'];

// Treaty intact, admissions shut.
export const MOU_HOUSEHOLD_SUSPENDED = ['cambodia'];

// Category slugs that count as household work for permit purposes.
// 'tutor' is deliberately absent — it has its own (narrow) route.
// 'driver' is absent too — it is prohibited outright, handled separately.
export const HOUSEHOLD_CATEGORIES = [
  'nanny', 'housekeeper', 'chef', 'elder_care', 'gardener', 'petsitter', 'multiple',
];

// Nationalities we say nothing about: unset, or explicitly withheld.
const SILENT = ['', 'prefer_not_say'];

const LINK = '/blog/work-permits-foreign-helpers-thailand';

const NOTICES = {
  driver_reserved: {
    tone: 'warn',
    en: {
      title: 'Driving is reserved for Thai nationals',
      body: 'Under the Ministry of Labour notification of 2020, driving a motor vehicle is on the list of occupations closed to foreigners outright. No work permit covers it — not even a valid household permit issued under the MOU system. Families can still hire you for the other categories you have selected; the driving part has to go to a Thai national.',
    },
    th: {
      title: 'งานขับรถสงวนไว้สำหรับคนไทย',
      body: 'ตามประกาศกระทรวงแรงงาน พ.ศ. 2563 งานขับขี่ยานยนต์เป็นงานที่ห้ามคนต่างด้าวทำโดยเด็ดขาด ไม่มีใบอนุญาตทำงานประเภทใดที่ครอบคลุมงานนี้ แม้คุณจะมีใบอนุญาตทำงานบ้านที่ถูกต้องตามระบบ MOU ก็ตาม ครอบครัวยังจ้างคุณในหมวดหมู่อื่นที่คุณเลือกไว้ได้ แต่งานขับรถต้องเป็นคนไทยเท่านั้น',
    },
  },

  mou_household: {
    tone: 'info',
    en: {
      title: 'Household work: the MOU route applies to you',
      body: 'Thailand has bilateral labour MOUs with Myanmar, Laos and Cambodia, and that is the one pathway through which a private family can legally employ a foreign household worker. Most families will ask about your work-permit status, so it is worth filling in the field below and keeping your documents to hand.',
    },
    th: {
      title: 'งานบ้าน: คุณใช้ช่องทาง MOU ได้',
      body: 'ประเทศไทยมีบันทึกความเข้าใจ (MOU) ด้านแรงงานกับเมียนมา ลาว และกัมพูชา ซึ่งเป็นช่องทางเดียวที่ครอบครัวสามารถจ้างคนต่างด้าวทำงานบ้านได้อย่างถูกกฎหมาย นายจ้างส่วนใหญ่จะถามถึงสถานะใบอนุญาตทำงานของคุณ จึงควรกรอกข้อมูลด้านล่างและเตรียมเอกสารไว้ให้พร้อม',
    },
  },

  cambodia_suspended: {
    tone: 'warn',
    en: {
      title: 'Cambodia: no new household permits are being issued',
      body: 'Cambodia is one of the three countries whose labour MOU with Thailand covers household work, but Thailand has admitted no new Cambodian workers since November 2025, and in March 2026 the Ministry of Labour confirmed that only those already holding valid permits would be managed. Renewals for Cambodian nationals were put on hold while Lao, Myanmar and Vietnamese renewals continued. If you already hold a valid permit, check its expiry date carefully — most four-year MOU terms ran out between November 2025 and December 2026, and workers who renewed after 13 February 2025 are covered to 13 February 2027. If anyone offers to arrange a new Cambodian household permit for you, treat it as a warning sign: that route is closed, and this is exactly the gap recruitment scams fill.',
    },
    th: {
      title: 'กัมพูชา: ขณะนี้ไม่มีการออกใบอนุญาตทำงานบ้านใหม่',
      body: 'กัมพูชาเป็นหนึ่งในสามประเทศที่ MOU ด้านแรงงานกับไทยครอบคลุมงานบ้าน แต่ไทยไม่รับแรงงานกัมพูชาเข้ามาใหม่ตั้งแต่เดือนพฤศจิกายน 2568 และในเดือนมีนาคม 2569 กระทรวงแรงงานยืนยันว่าจะบริหารจัดการเฉพาะผู้ที่ถือใบอนุญาตที่ยังไม่หมดอายุเท่านั้น การต่ออายุสำหรับคนสัญชาติกัมพูชาถูกพักไว้ ขณะที่ลาว พม่า และเวียดนามยังต่ออายุได้ หากคุณมีใบอนุญาตที่ยังไม่หมดอายุ ให้ตรวจสอบวันหมดอายุอย่างละเอียด เพราะวาระสี่ปีของ MOU ส่วนใหญ่สิ้นสุดระหว่างเดือนพฤศจิกายน 2568 ถึงธันวาคม 2569 ส่วนผู้ที่ต่ออายุหลังวันที่ 13 กุมภาพันธ์ 2568 ได้รับความคุ้มครองถึงวันที่ 13 กุมภาพันธ์ 2570 หากมีผู้เสนอจะจัดทำใบอนุญาตทำงานบ้านใหม่ให้คนกัมพูชา ให้ถือเป็นสัญญาณอันตราย เพราะช่องทางนั้นปิดอยู่ และเป็นจุดที่มิจฉาชีพด้านการจัดหางานเข้ามา',
    },
  },

  no_household_route: {
    tone: 'warn',
    en: {
      title: 'Household work: please check your status',
      body: 'Thailand issues household work permits only to nationals of Myanmar, Laos and Cambodia, through the MOU system. If yours is not one of those, a private family cannot obtain a work permit for you for household work — the Non-Immigrant B alternative requires a registered Thai company as the employer, which a household is not. Working without valid permission carries a fine, deportation and a two-year bar on reapplying, and those consequences fall on you rather than on the family. Tutoring is the category where a lawful route does exist, but the permit must be held by a school, language centre or tutoring company.',
    },
    th: {
      title: 'งานบ้าน: โปรดตรวจสอบสถานะของคุณ',
      body: 'ประเทศไทยออกใบอนุญาตทำงานบ้านให้เฉพาะคนสัญชาติเมียนมา ลาว และกัมพูชา ผ่านระบบ MOU เท่านั้น หากคุณไม่ได้ถือสัญชาติเหล่านี้ ครอบครัวผู้ว่าจ้างไม่สามารถขอใบอนุญาตทำงานบ้านให้คุณได้ เพราะช่องทาง Non-Immigrant B ต้องมีบริษัทไทยที่จดทะเบียนเป็นนายจ้าง ไม่ใช่ครอบครัว การทำงานโดยไม่ได้รับอนุญาตมีโทษปรับ ถูกส่งกลับประเทศ และห้ามยื่นขอใบอนุญาตทำงานเป็นเวลา 2 ปี ซึ่งผลกระทบตกอยู่กับคุณมากกว่าครอบครัว งานสอนพิเศษเป็นหมวดหมู่ที่ยังมีช่องทางถูกกฎหมาย แต่ใบอนุญาตต้องออกให้กับโรงเรียน สถาบันสอนภาษา หรือบริษัท ไม่ใช่ครอบครัว',
    },
  },
};

function splitCategories(categories) {
  if (Array.isArray(categories)) return categories.filter(Boolean);
  return String(categories || '')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);
}

/**
 * Returns an array of notices (possibly empty) for this helper.
 * Order is deliberate: the absolute prohibition comes before the
 * nationality-dependent household guidance.
 *
 * @param {string} nationality  value from NATIONALITY_OPTIONS
 * @param {string|string[]} categories  comma-joined slugs or an array
 */
export function getWorkPermitGuidance(nationality, categories) {
  const nat = String(nationality || '');
  if (SILENT.includes(nat) || nat === 'thai') return [];

  const cats = splitCategories(categories);
  if (cats.length === 0) return [];

  const out = [];

  if (cats.includes('driver')) {
    out.push({ id: 'driver_reserved', link: LINK, ...NOTICES.driver_reserved });
  }

  const hasHousehold = cats.some(c => HOUSEHOLD_CATEGORIES.includes(c));
  if (hasHousehold) {
    let id;
    if (MOU_HOUSEHOLD_OPEN.includes(nat)) id = 'mou_household';
    else if (MOU_HOUSEHOLD_SUSPENDED.includes(nat)) id = 'cambodia_suspended';
    else id = 'no_household_route';
    out.push({ id, link: LINK, ...NOTICES[id] });
  }

  return out;
}
