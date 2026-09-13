/**
 * /legal — who may legally work in a Thai household, and who may not.
 *
 * Exists because both of the loudest claims about this are wrong, and we
 * get accused of running a scam on the back of the first one:
 *
 *   (a) "Only Thai nationals may work as nannies or housekeepers."
 *       False — the MOU route for Myanmar, Laos and Cambodia is real and
 *       carries several hundred thousand workers.
 *   (b) "Any foreigner can get a household work permit through an agent."
 *       Also false — for every other nationality no such permit exists.
 *
 * The page is deliberately link-friendly: it is the URL to drop under a
 * Facebook comment. Same legal position as lib/wizard-logic.js and
 * lib/work-permit-guidance.js — update all three together.
 */

import Link from 'next/link';
import BrandWordmark from '@/components/BrandWordmark';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import { Scale, CheckCircle2, XCircle, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import SEOHead, { getBreadcrumbSchema, getFAQSchema, getSpeakableSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu, ResourcesDropdown } from '@/components/MobileMenu';
import { useLang } from './_app';

// English FAQ drives the FAQPage schema — keep the answers self-contained
// so an AI Overview can quote one without the surrounding page.
const FAQS = [
  {
    question: 'Can foreigners legally work as nannies or housekeepers in Thailand?',
    answer: 'Some can. Household work is open to foreigners only through a government-to-government labour MOU, and Thailand has household-work MOUs with Myanmar, Laos and Cambodia. Nationals of those three countries can be employed by a private family on an MOU work permit, and several hundred thousand migrant workers are employed in Thailand this way. It is a common misconception that domestic work is reserved for Thai nationals only — it is not.',
  },
  {
    question: 'Can a Filipino nanny legally work in Thailand?',
    answer: 'Not for a private family doing household work. Thailand has no domestic-worker MOU with the Philippines, so no household work permit can be issued. The Non-Immigrant B alternative requires the employer to be a registered Thai company with 2 million THB of paid-up capital and four Thai employees per foreign hire, which a household is not. Teaching and tutoring is the category where a lawful route exists for Filipino nationals, but the permit must be held by a school, language centre or tutoring company rather than by the family.',
  },
  {
    question: 'Which occupations are completely closed to foreigners in Thailand?',
    answer: 'List 1 of the Ministry of Labour notification of 1 April 2020 reserves a set of occupations for Thai nationals absolutely, with no permit available to any foreigner. The one that matters most for household hiring is driving a motor vehicle — the only carve-outs are international aircraft piloting and forklift operation. A Burmese helper holding a valid MOU household work permit still cannot lawfully drive for the family.',
  },
  {
    question: 'Can a private family in Thailand sponsor a work permit?',
    answer: 'Only through the MOU route for household workers from Myanmar, Laos or Cambodia. For every other permit type the employer must be a registered Thai company meeting the capital and Thai-staffing requirements, so a household cannot sponsor a Non-Immigrant B visa. Narrow exceptions exist for diplomatic households, BOI-promoted employers, and genuinely skilled tutor, governess or household-manager roles under a registered Thai employer.',
  },
  {
    question: 'What are the penalties for employing a helper without a work permit in Thailand?',
    answer: 'Under the Royal Decree on Foreign Workers Management B.E. 2560, the employer faces 10,000 to 100,000 THB per worker, multiplied by the number of workers found, with heavier penalties and a three-year ban on hiring foreigners for repeat offences. The worker faces 5,000 to 50,000 THB, deportation and a two-year bar on reapplying for a work permit. The Labour Ministry ordered nationwide inspections in May 2026.',
  },
  {
    question: 'Does ThaiHelper check whether a helper has a valid work permit?',
    answer: 'No. ThaiHelper verifies email addresses, not documents. Helpers can state their own work-permit status on their profile and that is what you see — it is self-reported. Always ask to see the actual permit before hiring, and use the free Work Permit Wizard at thaihelper.app/work-permit-wizard to check which route applies to your candidate.',
  },
];

const T = {
  en: {
    page_title: 'Who Can Legally Work in a Thai Household? — Work Permit Rules 2026 | ThaiHelper',
    meta_desc: 'The honest answer on Thai work-permit rules for household staff: domestic work is NOT Thai-only — Myanmar, Laos and Cambodia have MOU routes. But for Filipino, Vietnamese and Western nationals no household permit exists, and driving is closed to every foreigner.',
    nav_employers: 'For Families',
    nav_browse_helpers: 'Browse Helpers',
    nav_about: 'About',
    nav_faq_link: 'FAQ',
    nav_blog: 'Blog',
    nav_login: 'Login',
    nav_resources: 'Resources',
    nav_cta: 'Register – Free',

    hero_eyebrow: 'Work Permit Rules',
    hero_h1: 'Who can legally work in a Thai household?',
    hero_sub: 'Two claims get made constantly, and both are wrong. Here is the actual rule, the law it comes from, and what it means for your hire.',

    myths_title: 'The two things everybody gets wrong',
    myth1_label: 'Claim',
    myth1_q: '"Only Thai nationals may work as nannies, maids or carers. Anything else is illegal."',
    myth1_a: 'Wrong. Thailand runs bilateral labour MOUs with Myanmar, Laos and Cambodia, and household work is exactly what they cover. Several hundred thousand migrant workers are employed in Thai households on valid MOU permits. A Burmese nanny with her permit in order is as lawful as a Thai one.',
    myth2_q: '"Any foreigner can get a nanny work permit — just use a visa agent."',
    myth2_a: 'Also wrong, and this is the more expensive mistake. Outside those three nationalities no household work permit can be issued to a private family. The Non-Immigrant B route people are sold requires a registered Thai company with 2 million THB of paid-up capital and four Thai employees per foreign hire. A household is not that, and no agent can make it one.',

    table_title: 'What applies to whom',
    table_intro: 'Three columns, because the answer differs by task as well as by nationality. "Household work" means nanny, housekeeper, cook, carer, gardener or pet care inside a private home.',
    th_nat: 'Nationality',
    th_household: 'Household work',
    th_driving: 'Driving',
    th_tutoring: 'Tutoring / teaching',
    rows: [
      {
        nat: 'Thai',
        household: { ok: 'yes', text: 'Yes — no work permit needed at all' },
        driving:   { ok: 'yes', text: 'Yes — a valid Thai driving licence is all you check' },
        tutoring:  { ok: 'yes', text: 'Yes' },
      },
      {
        nat: 'Myanmar, Laos, Cambodia',
        household: { ok: 'yes', text: 'Yes — through the MOU work permit. Roughly 15,000–50,000 THB all-in, 3–6 months for a first-time import' },
        driving:   { ok: 'no',  text: 'No — closed to every foreigner, even with a valid household permit' },
        tutoring:  { ok: 'partial', text: 'Only through an employing school, language centre or company' },
      },
      {
        nat: 'Philippines, Vietnam, India, Nepal',
        household: { ok: 'no', text: 'No permit can be issued to a private family — no MOU covers these nationalities' },
        driving:   { ok: 'no', text: 'No' },
        tutoring:  { ok: 'partial', text: 'Yes, but the permit is held by the school or company, never by the family' },
      },
      {
        nat: 'Western and all other nationalities',
        household: { ok: 'no', text: 'No permit can be issued to a private family' },
        driving:   { ok: 'no', text: 'No' },
        tutoring:  { ok: 'partial', text: 'Yes, but the permit is held by the school or company, never by the family' },
      },
    ],
    table_note: 'Narrow exceptions sit outside this table: diplomatic households are statutorily exempt, BOI-promoted employers have their own framework, and a genuinely skilled tutor, governess or household-manager role can be sponsored by a registered Thai employer where the role matches the permit category in substance rather than only in wording. Those are conversations with an immigration lawyer, not shortcuts.',

    law_title: 'Where these rules come from',
    law1_h: 'The 2020 notification',
    law1_p: 'The Ministry of Labour notification of 1 April 2020, made under the Royal Decree on Foreign Workers Management B.E. 2560 (2017), replaced the old 39-item list from 1979 with 40 occupations across four lists. List 1 is reserved for Thai nationals absolutely. The list that covers household and manual work is open to foreigners only under a government-to-government MOU.',
    law2_h: 'The MOUs',
    law2_p: 'Thailand signed bilateral labour MOUs with Laos (2002), Cambodia (2003) and Myanmar (2003), renewed in 2015–2016 and with Cambodia again in 2025. These are what make a foreign household worker possible at all. Vietnam sits inside the wider CLMV labour framework but for fishery and construction, not household work.',
    law3_h: 'Driving, specifically',
    law3_p: 'Driving a motor vehicle sits on List 1 — absolutely reserved, with the only carve-outs being international aircraft piloting and forklift operation. There is no permit, visa or MOU that opens it. Re-describing the job as "personal assistant" does not help: a work permit authorises the work actually performed, not the job title on the form.',
    law4_h: 'Enforcement in 2026',
    law4_p: 'After a raid on an unlicensed school in Koh Phangan on 1 May 2026, the Labour Minister ordered nationwide inspections of foreign-worker permits. Penalties under Section 102 of the Royal Decree: 10,000–100,000 THB per worker for the employer, multiplied by the number of workers found; 5,000–50,000 THB, deportation and a two-year bar for the worker.',

    fair_title: 'Who actually carries the risk',
    fair_p: 'Worth saying plainly, because it shapes the decision: the penalties are not symmetrical. A family that hires without permission pays a fine. The helper loses her livelihood, is deported, and cannot reapply for a work permit for two years. If you are weighing whether to hire into the gap, that asymmetry belongs in the calculation.',

    us_title: 'What ThaiHelper does and does not do',
    us1_h: 'We list, we do not place',
    us1_p: 'ThaiHelper is a listings and messaging platform. We are not an agency and not a recruiter. We do not place workers, arrange permits, or sign anything on either side.',
    us2_h: 'Work-permit status is self-reported',
    us2_p: 'Helpers state their own status on their profile. We verify email addresses, not documents — we have never claimed otherwise. Always ask to see the actual permit before you hire.',
    us3_h: 'Some listed helpers have no lawful route',
    us3_p: 'Our directory reflects the market, and the market includes people for whom no household permit exists. We would rather show you that and explain it than quietly pretend the problem is not there.',
    us4_h: 'Compliance is the employer\'s duty',
    us4_p: 'Under Thai law the obligation to check permission to work sits with the employer — the family. Nothing on this platform transfers that, and no platform could.',

    cta_h2: 'Check your specific candidate',
    cta_p: 'Five questions, no signup. The wizard tells you which route applies, what it costs, and how long it takes.',
    cta_btn_wizard: 'Open the Work Permit Wizard',
    cta_btn_browse: 'Browse Thai helpers',
    cta_guide: 'Or read the full work-permit guide for families',

    faq_title: 'Frequently asked questions',

    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_product: 'Product', footer_employers: 'For Families', footer_hire: 'Categories',
    footer_company: 'Company', footer_contact: 'Contact', footer_about: 'About', footer_faq: 'FAQ',
    footer_legal: 'Legal', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
    footer_disclaimer: 'ThaiHelper.app is free to use. We are not a recruitment agency and do not provide placement services. Compliance with Thai labour and immigration law is the sole responsibility of the user.',
  },

  th: {
    page_title: 'ใครทำงานบ้านในประเทศไทยได้บ้างตามกฎหมาย? — กฎใบอนุญาตทำงาน 2569 | ThaiHelper',
    meta_desc: 'คำตอบที่ตรงไปตรงมาเรื่องใบอนุญาตทำงานสำหรับงานบ้าน: งานบ้านไม่ได้สงวนไว้สำหรับคนไทยเท่านั้น — เมียนมา ลาว และกัมพูชามีช่องทาง MOU แต่สำหรับสัญชาติฟิลิปปินส์ เวียดนาม และชาติตะวันตกไม่มีใบอนุญาตงานบ้าน และงานขับรถปิดสำหรับคนต่างด้าวทุกคน',
    nav_employers: 'สำหรับครอบครัว',
    nav_browse_helpers: 'ดูผู้ช่วย',
    nav_about: 'เกี่ยวกับเรา',
    nav_faq_link: 'คำถามที่พบบ่อย',
    nav_blog: 'บล็อก',
    nav_login: 'เข้าสู่ระบบ',
    nav_resources: 'แหล่งข้อมูล',
    nav_cta: 'สมัคร – ฟรี',

    hero_eyebrow: 'กฎใบอนุญาตทำงาน',
    hero_h1: 'ใครทำงานบ้านในประเทศไทยได้บ้างตามกฎหมาย?',
    hero_sub: 'มีคำกล่าวอ้างสองข้อที่ได้ยินบ่อยมาก และทั้งสองข้อผิด นี่คือกฎที่แท้จริง ที่มาทางกฎหมาย และความหมายต่อการจ้างงานของคุณ',

    myths_title: 'สองเรื่องที่เข้าใจผิดกันมากที่สุด',
    myth1_label: 'คำกล่าวอ้าง',
    myth1_q: '"เฉพาะคนไทยเท่านั้นที่ทำงานพี่เลี้ยงเด็ก แม่บ้าน หรือผู้ดูแลได้ นอกนั้นผิดกฎหมายทั้งหมด"',
    myth1_a: 'ไม่ถูกต้อง ประเทศไทยมีบันทึกความเข้าใจ (MOU) ด้านแรงงานกับเมียนมา ลาว และกัมพูชา ซึ่งครอบคลุมงานบ้านโดยตรง มีแรงงานข้ามชาติหลายแสนคนทำงานในครัวเรือนไทยด้วยใบอนุญาตตาม MOU ที่ถูกต้อง พี่เลี้ยงชาวเมียนมาที่มีใบอนุญาตครบถ้วนถูกกฎหมายเช่นเดียวกับคนไทย',
    myth2_q: '"คนต่างชาติคนไหนก็ขอใบอนุญาตทำงานพี่เลี้ยงได้ แค่ใช้บริการเอเจนซี่วีซ่า"',
    myth2_a: 'ก็ไม่ถูกต้องเช่นกัน และเป็นความเข้าใจผิดที่แพงกว่า นอกเหนือจากสามสัญชาตินั้น ไม่มีใบอนุญาตทำงานบ้านใดที่ออกให้ครอบครัวผู้ว่าจ้างได้ ช่องทาง Non-Immigrant B ที่มักถูกเสนอขายต้องมีบริษัทไทยจดทะเบียนที่มีทุนชำระแล้ว 2 ล้านบาท และลูกจ้างคนไทย 4 คนต่อคนต่างด้าว 1 คน ครอบครัวไม่เข้าเงื่อนไขนี้ และไม่มีเอเจนซี่ใดทำให้เข้าได้',

    table_title: 'ใครทำอะไรได้บ้าง',
    table_intro: 'แบ่งเป็นสามคอลัมน์ เพราะคำตอบขึ้นอยู่กับทั้งประเภทงานและสัญชาติ "งานบ้าน" หมายถึงพี่เลี้ยงเด็ก แม่บ้าน แม่ครัว ผู้ดูแล คนสวน หรือดูแลสัตว์เลี้ยงภายในบ้านส่วนตัว',
    th_nat: 'สัญชาติ',
    th_household: 'งานบ้าน',
    th_driving: 'งานขับรถ',
    th_tutoring: 'สอนพิเศษ / การสอน',
    rows: [
      {
        nat: 'ไทย',
        household: { ok: 'yes', text: 'ได้ — ไม่ต้องมีใบอนุญาตทำงาน' },
        driving:   { ok: 'yes', text: 'ได้ — ตรวจแค่ใบขับขี่ไทยที่ยังไม่หมดอายุ' },
        tutoring:  { ok: 'yes', text: 'ได้' },
      },
      {
        nat: 'เมียนมา ลาว กัมพูชา',
        household: { ok: 'yes', text: 'ได้ — ผ่านใบอนุญาตทำงานระบบ MOU ประมาณ 15,000–50,000 บาทรวมทุกอย่าง ใช้เวลา 3–6 เดือนสำหรับการนำเข้าครั้งแรก' },
        driving:   { ok: 'no',  text: 'ไม่ได้ — ปิดสำหรับคนต่างด้าวทุกคน แม้มีใบอนุญาตทำงานบ้านที่ถูกต้อง' },
        tutoring:  { ok: 'partial', text: 'ได้เฉพาะผ่านโรงเรียน สถาบันสอนภาษา หรือบริษัทที่เป็นนายจ้าง' },
      },
      {
        nat: 'ฟิลิปปินส์ เวียดนาม อินเดีย เนปาล',
        household: { ok: 'no', text: 'ไม่ได้ — ไม่มี MOU ครอบคลุมสัญชาติเหล่านี้ ครอบครัวจึงขอใบอนุญาตให้ไม่ได้' },
        driving:   { ok: 'no', text: 'ไม่ได้' },
        tutoring:  { ok: 'partial', text: 'ได้ แต่ใบอนุญาตต้องออกให้โรงเรียนหรือบริษัท ไม่ใช่ครอบครัว' },
      },
      {
        nat: 'ชาติตะวันตกและสัญชาติอื่นทั้งหมด',
        household: { ok: 'no', text: 'ไม่ได้ — ครอบครัวขอใบอนุญาตให้ไม่ได้' },
        driving:   { ok: 'no', text: 'ไม่ได้' },
        tutoring:  { ok: 'partial', text: 'ได้ แต่ใบอนุญาตต้องออกให้โรงเรียนหรือบริษัท ไม่ใช่ครอบครัว' },
      },
    ],
    table_note: 'มีข้อยกเว้นแคบๆ ที่อยู่นอกตารางนี้ ได้แก่ ครัวเรือนของคณะทูตซึ่งได้รับการยกเว้นตามกฎหมาย นายจ้างที่ได้รับการส่งเสริมจาก BOI ซึ่งมีกรอบของตนเอง และตำแหน่งที่ใช้ทักษะจริง เช่น ครูสอนพิเศษ พี่เลี้ยงผู้มีวุฒิ หรือผู้จัดการครัวเรือน ที่มีนายจ้างเป็นนิติบุคคลไทยจดทะเบียน โดยลักษณะงานต้องตรงกับประเภทใบอนุญาตจริง ไม่ใช่เพียงถ้อยคำ กรณีเหล่านี้ควรปรึกษาทนายความด้านตรวจคนเข้าเมือง',

    law_title: 'ที่มาของกฎเหล่านี้',
    law1_h: 'ประกาศปี 2563',
    law1_p: 'ประกาศกระทรวงแรงงาน ลงวันที่ 1 เมษายน 2563 ออกตามพระราชกำหนดการบริหารจัดการการทำงานของคนต่างด้าว พ.ศ. 2560 แทนที่บัญชี 39 รายการเดิมจากปี 2522 ด้วย 40 อาชีพแบ่งเป็น 4 บัญชี บัญชี 1 สงวนไว้สำหรับคนไทยโดยเด็ดขาด ส่วนบัญชีที่ครอบคลุมงานบ้านและงานกรรมกรเปิดให้คนต่างด้าวเฉพาะภายใต้ MOU ระหว่างรัฐบาลเท่านั้น',
    law2_h: 'ข้อตกลง MOU',
    law2_p: 'ประเทศไทยลงนาม MOU ด้านแรงงานกับลาว (2545) กัมพูชา (2546) และเมียนมา (2546) ต่ออายุในปี 2558–2559 และกับกัมพูชาอีกครั้งในปี 2568 ข้อตกลงเหล่านี้คือสิ่งที่ทำให้การจ้างคนต่างด้าวทำงานบ้านเป็นไปได้ ส่วนเวียดนามอยู่ในกรอบแรงงาน CLMV แต่สำหรับงานประมงและก่อสร้าง ไม่ใช่งานบ้าน',
    law3_h: 'เรื่องงานขับรถโดยเฉพาะ',
    law3_p: 'งานขับขี่ยานยนต์อยู่ในบัญชี 1 สงวนไว้โดยเด็ดขาด ยกเว้นเพียงการขับอากาศยานระหว่างประเทศและการขับรถยก ไม่มีใบอนุญาต วีซ่า หรือ MOU ใดเปิดช่องให้ การเปลี่ยนชื่อตำแหน่งเป็น "ผู้ช่วยส่วนตัว" ไม่ช่วย เพราะใบอนุญาตทำงานอนุญาตตามงานที่ทำจริง ไม่ใช่ตามชื่อตำแหน่งในเอกสาร',
    law4_h: 'การบังคับใช้ในปี 2569',
    law4_p: 'หลังการเข้าตรวจค้นโรงเรียนที่ไม่ได้รับอนุญาตบนเกาะพะงันเมื่อวันที่ 1 พฤษภาคม 2569 รัฐมนตรีว่าการกระทรวงแรงงานสั่งการให้ตรวจสอบใบอนุญาตทำงานของคนต่างด้าวทั่วประเทศ บทลงโทษตามมาตรา 102: นายจ้างปรับ 10,000–100,000 บาทต่อคนต่างด้าวหนึ่งคน คูณจำนวนคนที่พบ ส่วนลูกจ้างปรับ 5,000–50,000 บาท ถูกส่งกลับประเทศ และห้ามยื่นขอใบอนุญาตใหม่เป็นเวลา 2 ปี',

    fair_title: 'ใครเป็นผู้แบกรับความเสี่ยงจริง',
    fair_p: 'ควรพูดตรงๆ เพราะมีผลต่อการตัดสินใจ: บทลงโทษไม่เท่ากัน ครอบครัวที่จ้างโดยไม่มีใบอนุญาตเสียค่าปรับ แต่ผู้ช่วยสูญเสียอาชีพ ถูกส่งกลับประเทศ และยื่นขอใบอนุญาตทำงานใหม่ไม่ได้เป็นเวลา 2 ปี หากคุณกำลังชั่งใจว่าจะจ้างหรือไม่ ความไม่เท่ากันนี้ควรอยู่ในการคำนวณด้วย',

    us_title: 'ThaiHelper ทำอะไรและไม่ทำอะไร',
    us1_h: 'เราเป็นพื้นที่ลงประกาศ ไม่ใช่ผู้จัดหางาน',
    us1_p: 'ThaiHelper เป็นแพลตฟอร์มลงประกาศและส่งข้อความ เราไม่ใช่เอเจนซี่หรือผู้จัดหางาน เราไม่จัดหาคนงาน ไม่ดำเนินการขอใบอนุญาต และไม่ลงนามเอกสารแทนฝ่ายใด',
    us2_h: 'สถานะใบอนุญาตทำงานเป็นข้อมูลที่ผู้ช่วยแจ้งเอง',
    us2_p: 'ผู้ช่วยระบุสถานะของตนเองในโปรไฟล์ เรายืนยันเฉพาะอีเมล ไม่ได้ตรวจสอบเอกสาร และเราไม่เคยอ้างเป็นอย่างอื่น กรุณาขอดูใบอนุญาตตัวจริงก่อนจ้างเสมอ',
    us3_h: 'ผู้ช่วยบางคนในระบบไม่มีช่องทางที่ถูกกฎหมาย',
    us3_p: 'รายชื่อของเราสะท้อนตลาดจริง ซึ่งรวมถึงผู้ที่ไม่มีช่องทางขอใบอนุญาตงานบ้าน เราเลือกที่จะบอกและอธิบายให้ชัด ดีกว่าแกล้งทำเป็นว่าไม่มีปัญหานี้',
    us4_h: 'การปฏิบัติตามกฎหมายเป็นหน้าที่ของนายจ้าง',
    us4_p: 'ตามกฎหมายไทย หน้าที่ตรวจสอบสิทธิในการทำงานอยู่ที่นายจ้าง คือครอบครัว ไม่มีสิ่งใดในแพลตฟอร์มนี้ที่โอนหน้าที่ดังกล่าวได้ และไม่มีแพลตฟอร์มใดทำได้',

    cta_h2: 'ตรวจสอบผู้สมัครของคุณโดยเฉพาะ',
    cta_p: 'ห้าคำถาม ไม่ต้องสมัครสมาชิก ตัวช่วยจะบอกว่าช่องทางใดใช้ได้ ค่าใช้จ่ายเท่าไร และใช้เวลานานแค่ไหน',
    cta_btn_wizard: 'เปิดตัวช่วยใบอนุญาตทำงาน',
    cta_btn_browse: 'ดูผู้ช่วยคนไทย',
    cta_guide: 'หรืออ่านคู่มือใบอนุญาตทำงานฉบับเต็มสำหรับครอบครัว',

    faq_title: 'คำถามที่พบบ่อย',

    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_product: 'ผลิตภัณฑ์', footer_employers: 'สำหรับครอบครัว', footer_hire: 'หมวดหมู่',
    footer_company: 'บริษัท', footer_contact: 'ติดต่อ', footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย',
    footer_legal: 'กฎหมาย', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'ข้อกำหนดการให้บริการ',
    footer_disclaimer: 'ThaiHelper.app ใช้งานฟรี เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางาน การปฏิบัติตามกฎหมายแรงงานและกฎหมายตรวจคนเข้าเมืองของไทยเป็นความรับผิดชอบของผู้ใช้แต่เพียงผู้เดียว',
  },
};

// Cell rendering for the eligibility table — the icon carries the answer,
// the text carries the caveat.
const CELL = {
  yes:     { Icon: CheckCircle2,  cls: 'text-primary' },
  no:      { Icon: XCircle,       cls: 'text-red-600' },
  partial: { Icon: AlertTriangle, cls: 'text-amber-600' },
};

function Cell({ value }) {
  const { Icon, cls } = CELL[value.ok] || CELL.partial;
  return (
    <td className="px-4 py-3 align-top text-on-surface-variant">
      <div className="flex gap-2">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cls}`} />
        <span>{value.text}</span>
      </div>
    </td>
  );
}

export default function Legal() {
  const { lang } = useLang();
  const t = T[lang] || T.en;

  return (
    <>
      <SEOHead
        title={t.page_title}
        description={t.meta_desc}
        path="/legal"
        lang={lang}
        jsonLd={[
          getBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Work Permit Rules', path: '/legal' },
          ]),
          getFAQSchema(FAQS),
          getSpeakableSchema('/legal'),
        ]}
      />

      <div className="min-h-screen bg-background text-on-background font-sans">
        {/* UTILITY TOP BAR */}
        <div className="fixed top-0 left-0 w-full bg-[#001b3d] text-white z-[60]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-2.5 flex justify-center md:justify-end items-center gap-5 md:gap-7 text-xs md:text-sm">
            <Link href="/employers" className="font-semibold hover:text-gold transition-colors whitespace-nowrap">
              {t.nav_employers} →
            </Link>
            <Link href="/helpers" className="font-semibold hover:text-gold transition-colors whitespace-nowrap">
              {t.nav_browse_helpers} →
            </Link>
          </div>
        </div>

        {/* NAV */}
        <nav className="fixed top-9 md:top-11 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="text-xl md:text-2xl font-bold font-headline">
              <span>Thai</span><span style={{ color: '#006a62' }}>Helper</span>
            </Link>
          </div>
          {(() => {
            const navItems = [
              { href: '/employers',          label: t.nav_employers },
              { href: '/helpers',            label: t.nav_browse_helpers },
              { href: '/work-permit-wizard', label: lang === 'th' ? 'ตัวช่วยใบอนุญาตทำงาน' : 'Work Permit Wizard' },
              { href: '/about',              label: t.nav_about },
              { href: '/faq',                label: t.nav_faq_link },
              { href: '/blog',               label: t.nav_blog },
            ];
            return (
              <>
                <div className="hidden lg:flex items-center gap-4">
                  <ResourcesDropdown label={t.nav_resources} items={navItems} />
                  <Link className="text-sm font-semibold text-[#001b3d] hover:text-primary transition-colors" href="/login">
                    {t.nav_login}
                  </Link>
                  <LangSwitcher />
                  <Link
                    className="px-6 py-2.5 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary text-sm font-semibold hover:shadow-lg transition-all active:scale-95 duration-150 whitespace-nowrap"
                    href="/signup"
                  >
                    {t.nav_cta}
                  </Link>
                </div>
                <div className="lg:hidden">
                  <MobileMenu
                    items={navItems}
                    secondaryCta={{ href: '/login', label: t.nav_login }}
                    primaryCta={{ href: '/signup', label: t.nav_cta }}
                  />
                </div>
              </>
            );
          })()}
        </nav>

        <main className="pt-24 md:pt-28">
          {/* HERO */}
          <section className="px-6 pt-10 pb-8 md:pt-16 md:pb-12">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                <Scale className="w-4 h-4" />
                {t.hero_eyebrow}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-on-background mb-4 leading-tight">
                {t.hero_h1}
              </h1>
              <p className="hero-description text-base md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                {t.hero_sub}
              </p>
            </div>
          </section>

          {/* THE TWO MYTHS */}
          <section className="px-6 py-12 bg-surface-container-low">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline text-center mb-10">
                {t.myths_title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[{ q: t.myth1_q, a: t.myth1_a }, { q: t.myth2_q, a: t.myth2_a }].map((m, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-600 mb-3">
                      <XCircle className="w-4 h-4" />
                      {t.myth1_label}
                    </div>
                    <p className="text-base md:text-lg font-semibold text-on-background mb-4 leading-snug">{m.q}</p>
                    <p className="faq-answer text-sm md:text-base text-on-surface-variant leading-relaxed">{m.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ELIGIBILITY TABLE */}
          <section className="px-6 py-16 bg-white">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline mb-3">{t.table_title}</h2>
              <p className="text-on-surface-variant mb-8 max-w-3xl">{t.table_intro}</p>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold text-on-background w-1/5">{t.th_nat}</th>
                      <th className="text-left px-4 py-3 font-bold text-on-background">{t.th_household}</th>
                      <th className="text-left px-4 py-3 font-bold text-on-background">{t.th_driving}</th>
                      <th className="text-left px-4 py-3 font-bold text-on-background">{t.th_tutoring}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((row, i) => (
                      <tr key={i} className={i % 2 ? 'bg-slate-50/50' : 'bg-white'}>
                        <td className="px-4 py-3 font-semibold text-on-background align-top">{row.nat}</td>
                        <Cell value={row.household} />
                        <Cell value={row.driving} />
                        <Cell value={row.tutoring} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-on-surface-variant mt-5 max-w-3xl leading-relaxed">{t.table_note}</p>
            </div>
          </section>

          {/* THE LAW */}
          <section className="px-6 py-16 bg-surface-container-low">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-2xl md:text-3xl font-extrabold font-headline">{t.law_title}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { h: t.law1_h, p: t.law1_p },
                  { h: t.law2_h, p: t.law2_p },
                  { h: t.law3_h, p: t.law3_p },
                  { h: t.law4_h, p: t.law4_p },
                ].map((c, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-lg font-bold font-headline text-on-background mb-2">{c.h}</h3>
                    <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">{c.p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ASYMMETRY OF RISK */}
          <section className="px-6 py-14 bg-white">
            <div className="max-w-3xl mx-auto">
              <div className="rounded-2xl border-l-4 border-gold bg-amber-50/60 p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-extrabold font-headline mb-3">{t.fair_title}</h2>
                <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">{t.fair_p}</p>
              </div>
            </div>
          </section>

          {/* WHAT WE DO / DON'T */}
          <section className="px-6 py-16 bg-surface-container-low">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline text-center mb-10">{t.us_title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { h: t.us1_h, p: t.us1_p },
                  { h: t.us2_h, p: t.us2_p },
                  { h: t.us3_h, p: t.us3_p },
                  { h: t.us4_h, p: t.us4_p },
                ].map((c, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-lg font-bold font-headline text-on-background mb-2">{c.h}</h3>
                    <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">{c.p}</p>
                  </div>
                ))}
              </div>
              <div className="max-w-3xl mx-auto">
                <LegalDisclaimer lang={lang} />
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="px-6 py-16 bg-white">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline text-center mb-10">{t.faq_title}</h2>
              <div className="space-y-3">
                {FAQS.map((faq, i) => (
                  <details key={i} className="group bg-white rounded-xl border border-slate-200 p-5 open:shadow-md transition-all">
                    <summary className="font-bold text-on-background cursor-pointer list-none flex justify-between items-center gap-3">
                      <span>{faq.question}</span>
                      <span className="text-primary text-xl shrink-0 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="faq-answer mt-3 text-sm md:text-base text-on-surface-variant leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-6 py-20 bg-gradient-to-br from-primary/5 to-primary-container/10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold font-headline mb-4">{t.cta_h2}</h2>
              <p className="text-on-surface-variant mb-8">{t.cta_p}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/work-permit-wizard"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white font-bold text-base shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                  {t.cta_btn_wizard} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/helpers?nationality=thai"
                  className="inline-block px-8 py-3.5 rounded-2xl bg-white border-2 border-primary text-primary font-bold text-base hover:bg-primary/5 transition-colors"
                >
                  {t.cta_btn_browse}
                </Link>
              </div>
              <p className="mt-6 text-sm">
                <Link href="/blog/work-permits-foreign-helpers-thailand" className="text-primary font-semibold underline">
                  {t.cta_guide} →
                </Link>
              </p>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="w-full bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto py-12 px-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="max-w-xs shrink-0">
                <BrandWordmark href={null} size="sm" className="mb-4" />
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{t.footer_desc}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_product}</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-primary text-sm" href="/#categories">{t.footer_hire}</Link></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm" href="/employers">{t.footer_employers}</Link></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm" href="/work-permit-wizard">Work Permit Wizard</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_company}</h4>
                  <ul className="space-y-3">
                    <li><a className="text-slate-500 hover:text-primary text-sm" href="mailto:support@thaihelper.app">{t.footer_contact}</a></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm" href="/about">{t.footer_about}</Link></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm" href="/faq">{t.footer_faq}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_legal}</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-primary text-sm" href="/privacy">{t.footer_privacy}</Link></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm" href="/terms">{t.footer_terms}</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-slate-200 text-center">
              <p className="text-slate-400 text-xs leading-relaxed max-w-3xl mx-auto mb-3">{t.footer_disclaimer}</p>
              <p className="text-slate-500 text-xs">© 2026 ThaiHelper. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
