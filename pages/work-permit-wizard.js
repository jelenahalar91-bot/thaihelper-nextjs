/**
 * /work-permit-wizard
 *
 * 5-question interactive wizard that helps families understand whether
 * they need a work permit for their helper, and what the realistic
 * cost/time tradeoffs are. Routes the user to one of four flows:
 *
 *   no_wp_needed       — Thai national, no WP required
 *   not_worth_it       — too short to amortise WP cost/time
 *   worth_it_but_slow  — bridge with a Thai helper while WP processes
 *   worth_it           — full WP track (MOU or Non-B)
 *
 * Logic lives in lib/wizard-logic.js so it can be tested independently
 * and reused by the cost calculator (Phase 2).
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu, ResourcesDropdown } from '@/components/MobileMenu';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import { useLang } from './_app';
import { CITY_OPTIONS } from '@/lib/constants/cities';
import {
  NATIONALITY_OPTIONS,
  HELPER_STATUS_OPTIONS,
  VISA_TYPE_OPTIONS,
  DURATION_OPTIONS,
  MOU_DW_NATIONALITIES,
  getWizardResult,
} from '@/lib/wizard-logic';

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
  en: {
    page_title: 'Hire a non-Thai helper legally — Work Permit Wizard | ThaiHelper',
    meta_desc: 'Every non-Thai worker in Thailand needs a work permit. This free 5-step wizard tells you whether starting the WP process for your candidate is worth it, what it costs, how long it takes, and what to do next.',
    nav_employers: 'For Families',
    nav_helpers: 'For Helpers',
    nav_employers: 'For Families',
    nav_blog: 'Blog',
    nav_login: 'Login',
    nav_cta: 'Register – Free',
    nav_resources: 'Resources',
    nav_browse_helpers: 'Browse Helpers',
    nav_directory: 'Expert Directory',
    nav_about: 'About',
    nav_faq: 'FAQ',

    hero_eyebrow: 'Work Permit Wizard',
    hero_h1: 'Hiring a non-Thai helper? Let\'s make it legal.',
    hero_sub: 'Five quick questions, no signup. The wizard tells you whether starting the work permit process for your specific candidate is worth it — and exactly what to do next.',
    rule_label: 'The basic rule',
    rule_text: 'In Thailand, every non-Thai worker needs a work permit — no exceptions, not even on a tourist, retirement, dependent or education visa. The only people who can work without a WP are Thai nationals. This wizard helps you decide whether the WP process is worth it for THIS candidate, given the cost, timeline, and how long you plan to employ them.',

    enforcement_label: '🚨 Active enforcement — May 2026',
    enforcement_text: 'After a 1 May 2026 raid on an unlicensed school in Koh Phangan (9 arrests), Labour Minister Julapun Amornvivat ordered nationwide inspections under the Trai Thep Phithak task force. Statutory penalties (Royal Decree on Foreign Workers Management B.E. 2560, as amended 2018) for employing a worker without a valid work permit: 10,000–100,000 THB per worker for the employer; repeat offences add 50,000–200,000 THB per worker, up to 1 year prison and a 3-year ban on hiring foreigners. The worker faces 5,000–50,000 THB, deportation and a 2-year bar on reapplying for a work permit. Recent high-profile cases like the 800,000 THB Phuket villa fine multiply the 100k per-worker cap by the number of illegal workers found on site.',

    step_label: 'Step {n} of 5',
    btn_back: '← Back',
    btn_next: 'Next →',
    btn_restart: 'Start over',

    q1_title: 'Where do you live in Thailand?',
    q1_sub: 'Your city affects which immigration office handles the paperwork and how long it usually takes.',
    q1_placeholder: '— Select your city —',

    q2_title: 'What is your helper\'s nationality?',
    q2_sub: 'Thailand\'s bilateral labour MOUs (Cambodia 2003, Laos 2002, Myanmar 2003 — renewed 2015–2016) cover the household-worker permit category for those three nationalities only. Filipino, Vietnamese, Western and other workers cannot be hired by a private family under a domestic-worker WP.',

    q3_title: 'What is your helper\'s current status?',
    q3_sub: 'Already-employed helpers can often follow a faster transfer path; brand-new hires take longer.',

    q4_title: 'What visa does your helper currently hold?',
    q4_sub: 'Only relevant if they\'re already in Thailand. Pick the closest match.',

    q5_title: 'How long do you plan to employ this helper?',
    q5_sub: 'Work permits cost time and money up front, so the longer the relationship, the more they make sense.',

    // Results — common
    result_disclaimer_title: 'Before you continue',
    result_disclaimer: 'I understand this is general information, not legal advice.',
    result_label_track_mou: 'MOU process (Myanmar / Laos / Cambodia)',
    result_estimated_cost: 'Estimated cost',
    result_estimated_time: 'Estimated time',
    result_thb: 'THB',

    // Myanmar-specific 2026 compliance notice — shown on every MOU result
    // where the helper is Myanmar.
    myanmar_notice_title: '📌 2026 status notes for Myanmar workers',
    myanmar_notice_b1: 'Myanmar-side: the Myanmar embassy and consulate processes have tightened since 2024. Workers typically need a valid Myanmar passport, CI (Certificate of Identity) or PJ (Passport for Job), plus their original Myanmar NRC and Myanmar household register for embassy/CI steps. Since Jan 2026, junta pre-departure approvals are causing delays. This is a Myanmar-side requirement — not a Thai DoE checklist.',
    myanmar_notice_b2: 'CI center extension: Myanmar\'s CI service centers in Thailand stay open until 17 Aug 2026, but only for workers already in the Cabinet-Sep-2024 renewal pipeline whose permits expired 31 Mar 2026 and who still need to complete the CI step. This is not a blanket Thai work-permit deadline extension.',
    myanmar_notice_b3: 'The Thai-side renewal deadline of 31 March 2026 has passed without further extension. Approximately 375,000 of 890,000 CLMV workers had not completed renewal at Feb 2026. Verify your candidate\'s WP status carefully before hiring — workers who missed the deadline are currently undocumented in Thailand.',

    // Result: not legally allowed for domestic work
    nla_h2: 'Domestic-worker permits aren\'t available for this nationality.',
    nla_p: 'Thailand operates bilateral labour MOUs with Cambodia (2003), Laos (2002) and Myanmar (2003) — renewed 2015–2016. In practice the "domestic worker" work-permit category is issued only for nationals of these three countries. Vietnamese workers are in the broader CLMV labour MOU (fishery/construction) but not the household-work track. Filipino, Indonesian, Western and other workers can\'t be hired by a private family under a household work permit. Salary level doesn\'t change this. Hiring outside this pathway is a standard work-permit violation under Section 102 of the Royal Decree on Foreign Workers Management — currently 10,000–100,000 THB per worker for the employer (multiplied by the number of workers found), plus possible visa/work-permit cancellation.',
    nla_alt_title: 'Legal alternatives:',
    nla_alt1_h: 'Hire a Thai national',
    nla_alt1_p: 'No work permit required. Largest pool, fastest to start.',
    nla_alt1_cta: 'Browse Thai helpers',
    nla_alt2_h: 'Hire from Myanmar / Laos / Cambodia',
    nla_alt2_p: 'The only foreign nationalities for which a household-worker WP can actually be issued. Process takes 3–6 months.',
    nla_alt2_cta: 'Browse MOU helpers',
    nla_alt3_h: 'Talk to an immigration lawyer',
    nla_alt3_p: 'Narrow legal pathways exist for non-MOU3 nationalities: diplomatic households (statutorily exempt), BOI-promoted employers, and Non-B permits for genuinely skilled roles such as private tutor, governess or household manager when sponsored by a registered Thai employer. The role must match the WP category in substance, not just on paper. Get qualified advice before relying on this.',
    nla_alt3_cta: 'Find experts in your city',

    // Result: no WP needed
    no_wp_h2: 'Good news — no work permit needed.',
    no_wp_p: 'Thai nationals can work for any household in Thailand without a separate work permit. You can hire directly and pay social-security contributions if the engagement is regular.',
    no_wp_cta_browse: 'Browse Thai helpers',

    // Result: not worth it
    nw_h2: 'A work permit is probably not worth it for this engagement.',
    nw_p: 'Work-permit fees and processing time usually only pay off if you employ someone for at least 6 months. Here\'s what we\'d suggest instead:',
    nw_rec1_h: 'Hire a Thai helper',
    nw_rec1_p: 'Thai nationals don\'t need a work permit. Browse profiles in your city.',
    nw_rec1_cta: 'See Thai helpers',
    nw_rec2_h: 'Message a helper and ask',
    nw_rec2_p: 'Some helpers already have a valid work permit from a previous employer. Ask before assuming.',
    nw_rec2_cta: 'Browse all helpers',
    nw_rec3_h: 'Talk to a licensed agency',
    nw_rec3_p: 'For very short jobs (one-off events, short-term care) a licensed agency can supply a helper who is already work-permit-covered through them.',

    // Result: worth it but slow
    ws_h2: 'A work permit is worth it — but the process takes time.',
    ws_p: 'For 3–6 month engagements, the maths usually works, but the paperwork can take longer than the job itself. The pragmatic approach is to bridge.',
    ws_rec1_h: 'Hire a Thai helper as a bridge',
    ws_rec1_p: 'Get someone who can start immediately while you sort out the WP for your preferred candidate.',
    ws_rec1_cta: 'Browse Thai helpers',
    ws_rec2_h: 'Find a helper with a valid work permit',
    ws_rec2_p: 'Some helpers already have a valid WP — fastest route, no waiting.',
    ws_rec2_cta: 'See helpers with WP',
    ws_rec3_h: 'Get expert help',
    ws_rec3_p: 'An immigration lawyer or licensed agency can run the WP application in parallel.',
    ws_rec3_cta: 'Find experts in your city',

    // Result: worth it
    wi_h2: 'A work permit makes sense for this engagement.',
    wi_p_long: 'For a long-term arrangement, the upfront cost amortises well. Here\'s a practical plan:',
    wi_step1_h: 'Confirm the candidate',
    wi_step1_p: 'Pick your helper before you start any paperwork — the application is tied to one specific employer/employee pair.',
    wi_step2_h: 'Engage an expert',
    wi_step2_p: 'A lawyer or licensed visa agent will run the application end-to-end. Doing this yourself is technically possible but slow and error-prone.',
    wi_step3_h: 'Plan a bridge',
    wi_step3_p: 'Hire a Thai helper short-term while paperwork is being processed.',
    wi_transfer: 'Because the helper is already employed (or already on a Non-B), a transfer is usually faster than starting fresh.',
    wi_cta_experts: 'Find experts in your city',
    wi_cta_bridge: 'Browse Thai helpers (bridge)',

    // Footer
    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_product: 'Product', footer_pricing: 'Pricing', footer_employers: 'For Families',
    footer_company: 'Company', footer_contact: 'Contact', footer_about: 'About', footer_faq: 'FAQ',
    footer_legal: 'Legal', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
  },
  th: {
    page_title: 'จ้างผู้ช่วยที่ไม่ใช่คนไทยอย่างถูกกฎหมาย — ตัวช่วยใบอนุญาตทำงาน | ThaiHelper',
    meta_desc: 'คนต่างชาติทุกคนที่ทำงานในประเทศไทยต้องมีใบอนุญาตทำงาน แบบสอบถามฟรี 5 ขั้นตอนนี้จะบอกคุณว่าควรเริ่มกระบวนการ WP สำหรับผู้สมัครของคุณหรือไม่ ค่าใช้จ่าย ระยะเวลา และขั้นตอนถัดไป',
    nav_employers: 'สำหรับครอบครัว',
    nav_helpers: 'สำหรับผู้ช่วย',
    nav_employers: 'สำหรับครอบครัว',
    nav_blog: 'บล็อก',
    nav_login: 'เข้าสู่ระบบ',
    nav_cta: 'สมัคร – ฟรี',
    nav_resources: 'แหล่งข้อมูล',
    nav_browse_helpers: 'ดูผู้ช่วย',
    nav_directory: 'รายชื่อผู้เชี่ยวชาญ',
    nav_about: 'เกี่ยวกับเรา',
    nav_faq: 'คำถามที่พบบ่อย',

    hero_eyebrow: 'ตัวช่วยใบอนุญาตทำงาน',
    hero_h1: 'จ้างผู้ช่วยที่ไม่ใช่คนไทย? มาทำให้ถูกกฎหมายกัน',
    hero_sub: 'ห้าคำถามสั้นๆ ไม่ต้องสมัครสมาชิก แบบสอบถามจะบอกคุณว่าการเริ่มกระบวนการขอใบอนุญาตทำงานสำหรับผู้สมัครของคุณคุ้มค่าหรือไม่ และต้องทำอะไรต่อไป',
    rule_label: 'กฎพื้นฐาน',
    rule_text: 'ในประเทศไทย คนต่างชาติทุกคนที่ทำงานต้องมีใบอนุญาตทำงาน ไม่มีข้อยกเว้น แม้จะอยู่ด้วยวีซ่าท่องเที่ยว เกษียณอายุ ผู้ติดตาม หรือนักเรียน เฉพาะคนไทยเท่านั้นที่สามารถทำงานได้โดยไม่ต้องมี WP แบบสอบถามนี้ช่วยคุณตัดสินใจว่ากระบวนการ WP คุ้มค่าสำหรับผู้สมัครคนนี้หรือไม่ โดยพิจารณาจากค่าใช้จ่าย ระยะเวลา และระยะเวลาที่คุณวางแผนจะจ้าง',

    enforcement_label: '🚨 การบังคับใช้กฎหมายเข้มข้น — พฤษภาคม 2569',
    enforcement_text: 'หลังเหตุการณ์บุกค้นโรงเรียนผิดกฎหมายที่เกาะพะงัน 1 พ.ค. 2569 (จับกุม 9 คน) รมว.แรงงาน จุลพันธ์ อมรวิวัฒน์ สั่งตรวจสอบทั่วประเทศผ่านชุดเฉพาะกิจไตรเทพพิทักษ์ ค่าปรับตามกฎหมาย (พ.ร.ก.การบริหารจัดการการทำงานของคนต่างด้าว พ.ศ. 2560 แก้ไขเพิ่มเติม 2561) สำหรับนายจ้างที่จ้างแรงงานต่างชาติไม่มี WP: 10,000–100,000 บาท ต่อคน ผู้กระทำผิดซ้ำเพิ่มอีก 50,000–200,000 บาท ต่อคน จำคุกสูงสุด 1 ปี และห้ามจ้างแรงงานต่างชาติ 3 ปี ลูกจ้างถูกปรับ 5,000–50,000 บาท ถูกส่งกลับ และห้ามขอ WP ใหม่ 2 ปี กรณีฟูเก็ตที่ปรับ 800,000 บาทเป็นการคำนวณ 100,000 บาท × 8 คน ไม่ใช่ 800,000 บาทต่อคน',

    step_label: 'ขั้นตอนที่ {n} จาก 5',
    btn_back: '← ย้อนกลับ',
    btn_next: 'ถัดไป →',
    btn_restart: 'เริ่มใหม่',

    q1_title: 'คุณอาศัยอยู่ที่ไหนในประเทศไทย?',
    q1_sub: 'เมืองของคุณส่งผลต่อสำนักงานตรวจคนเข้าเมืองและระยะเวลาดำเนินการ',
    q1_placeholder: '— เลือกเมืองของคุณ —',

    q2_title: 'ผู้ช่วยของคุณสัญชาติอะไร?',
    q2_sub: 'MOU แรงงานทวิภาคีของไทย (กัมพูชา 2546, ลาว 2545, พม่า 2546 — ต่ออายุ 2558–2559) ครอบคลุมใบอนุญาตทำงานประเภทงานบ้านเฉพาะสามสัญชาตินี้เท่านั้น คนฟิลิปปินส์ เวียดนาม ตะวันตก และสัญชาติอื่นๆ ไม่สามารถถูกจ้างโดยครอบครัวเอกชนภายใต้ WP งานบ้านได้',

    q3_title: 'สถานะปัจจุบันของผู้ช่วยคุณคืออะไร?',
    q3_sub: 'ผู้ช่วยที่ทำงานอยู่แล้วมักจะใช้เส้นทางการโอนย้ายที่เร็วกว่า การจ้างใหม่ใช้เวลานานกว่า',

    q4_title: 'ผู้ช่วยของคุณถือวีซ่าประเภทใดในปัจจุบัน?',
    q4_sub: 'เกี่ยวข้องเฉพาะเมื่อพวกเขาอยู่ในประเทศไทยแล้ว',

    q5_title: 'คุณวางแผนจ้างผู้ช่วยคนนี้นานเท่าไหร่?',
    q5_sub: 'ใบอนุญาตทำงานมีต้นทุนเวลาและเงินล่วงหน้า ยิ่งความสัมพันธ์ยาวนานเท่าไหร่ก็ยิ่งคุ้มค่า',

    result_disclaimer_title: 'ก่อนคุณดำเนินการต่อ',
    result_disclaimer: 'ฉันเข้าใจว่านี่เป็นข้อมูลทั่วไปไม่ใช่คำแนะนำทางกฎหมาย',
    result_label_track_mou: 'กระบวนการ MOU (พม่า / ลาว / กัมพูชา)',
    result_estimated_cost: 'ค่าใช้จ่ายโดยประมาณ',
    result_estimated_time: 'เวลาโดยประมาณ',
    result_thb: 'บาท',

    // ข้อกำหนดปี 2026 เฉพาะแรงงานพม่า — แสดงเมื่อสัญชาติ = พม่า + MOU
    myanmar_notice_title: '📌 สถานะปี 2026 สำหรับแรงงานพม่า',
    myanmar_notice_b1: 'ฝั่งพม่า: ขั้นตอนที่สถานทูตและสถานกงสุลพม่าเข้มงวดขึ้นตั้งแต่ปี 2024 แรงงานต้องมีหนังสือเดินทางพม่า CI หรือ PJ ที่ใช้ได้ พร้อม NRC ตัวจริงและสำเนาทะเบียนบ้านพม่า (Form 10) สำหรับขั้นตอนสถานทูต/CI ตั้งแต่ ม.ค. 2569 มีความล่าช้าจากการอนุมัติก่อนเดินทางของรัฐบาลทหารพม่า เป็นข้อกำหนดฝั่งพม่า ไม่ใช่ของกรมการจัดหางานไทย',
    myanmar_notice_b2: 'ขยายเวลาศูนย์ CI: ศูนย์บริการ CI ของพม่าในไทยเปิดถึง 17 ส.ค. 2569 เฉพาะแรงงานที่อยู่ในกลุ่ม มติคณะรัฐมนตรี ก.ย. 2567 ซึ่ง WP หมดอายุ 31 มี.ค. 2569 และยังต้องดำเนินการ CI ไม่ใช่การขยายเส้นตาย WP ฝั่งไทยทั่วไป',
    myanmar_notice_b3: 'เส้นตายต่ออายุฝั่งไทย 31 มี.ค. 2569 หมดอายุแล้วโดยไม่มีการขยายเพิ่ม ประมาณ 375,000 จาก 890,000 แรงงาน CLMV ยังไม่ได้ต่ออายุ ณ ก.พ. 2569 โปรดตรวจสอบสถานะ WP ของผู้สมัครอย่างละเอียดก่อนตัดสินใจจ้าง — แรงงานที่พลาดเส้นตายอยู่ในสถานะไม่ถูกต้องในประเทศไทย',

    // ผลลัพธ์: ไม่อนุญาตทางกฎหมายสำหรับงานในบ้าน
    nla_h2: 'ใบอนุญาตทำงานประเภทแรงงานในบ้านไม่มีสำหรับสัญชาตินี้',
    nla_p: 'ประเทศไทยมี MOU แรงงานทวิภาคีกับกัมพูชา (2546), ลาว (2545) และพม่า (2546) ต่ออายุปี 2558–2559 ในทางปฏิบัติใบอนุญาตทำงาน "แรงงานในบ้าน" ออกได้เฉพาะคนสัญชาติทั้งสามนี้เท่านั้น คนเวียดนามอยู่ใน MOU CLMV กว้างกว่า (ประมงและก่อสร้าง) แต่ไม่อยู่ในเส้นทางงานบ้าน คนฟิลิปปินส์ อินโดนีเซีย ตะวันตก และสัญชาติอื่นๆ ไม่สามารถถูกจ้างโดยครอบครัวเอกชนภายใต้ WP งานบ้านได้ ระดับเงินเดือนไม่เปลี่ยนสิ่งนี้ การจ้างนอกเส้นทางนี้เป็นการละเมิด WP ทั่วไปตามมาตรา 102 พ.ร.ก. การบริหารจัดการการทำงานของคนต่างด้าว ปัจจุบัน 10,000–100,000 บาท ต่อคน สำหรับนายจ้าง (คูณด้วยจำนวนคนงานที่พบ) พร้อมความเสี่ยงเพิกถอน WP/วีซ่า',
    nla_alt_title: 'ทางเลือกที่ถูกกฎหมาย:',
    nla_alt1_h: 'จ้างคนไทย',
    nla_alt1_p: 'ไม่ต้องมีใบอนุญาตทำงาน กลุ่มใหญ่ที่สุด เริ่มงานได้เร็วที่สุด',
    nla_alt1_cta: 'ดูผู้ช่วยคนไทย',
    nla_alt2_h: 'จ้างจากพม่า / ลาว / กัมพูชา',
    nla_alt2_p: 'สัญชาติต่างชาติเดียวที่ออก WP แรงงานในบ้านได้จริง กระบวนการใช้เวลา 3–6 เดือน',
    nla_alt2_cta: 'ดูผู้ช่วย MOU',
    nla_alt3_h: 'ปรึกษาทนายความตรวจคนเข้าเมือง',
    nla_alt3_p: 'มีทางเลือกทางกฎหมายที่แคบสำหรับสัญชาติที่ไม่ใช่ MOU3: ครัวเรือนทูต (ได้รับยกเว้นตามกฎหมาย) นายจ้างที่ได้รับการส่งเสริม BOI และ Non-B WP สำหรับบทบาทเฉพาะทางที่แท้จริง เช่น ครูสอนส่วนตัว พี่เลี้ยงเด็ก หรือผู้จัดการบ้าน เมื่อมีนายจ้างไทยที่จดทะเบียนเป็นผู้สนับสนุน บทบาทต้องสอดคล้องกับประเภท WP ไม่ใช่เพียงในนาม ขอคำปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจ',
    nla_alt3_cta: 'หาผู้เชี่ยวชาญในเมืองของคุณ',

    no_wp_h2: 'ข่าวดี — ไม่ต้องมีใบอนุญาตทำงาน',
    no_wp_p: 'คนไทยสามารถทำงานในครัวเรือนในประเทศไทยได้โดยไม่ต้องมีใบอนุญาตทำงานแยกต่างหาก คุณสามารถจ้างได้โดยตรงและจ่ายเงินสมทบประกันสังคมหากการจ้างงานเป็นประจำ',
    no_wp_cta_browse: 'ดูผู้ช่วยคนไทย',

    nw_h2: 'ใบอนุญาตทำงานอาจไม่คุ้มค่าสำหรับการจ้างงานนี้',
    nw_p: 'ค่าธรรมเนียมและเวลาดำเนินการของใบอนุญาตทำงานมักจะคุ้มค่าก็ต่อเมื่อคุณจ้างใครสักคนนานอย่างน้อย 6 เดือน นี่คือคำแนะนำของเรา:',
    nw_rec1_h: 'จ้างผู้ช่วยคนไทย',
    nw_rec1_p: 'คนไทยไม่ต้องมีใบอนุญาตทำงาน ดูโปรไฟล์ในเมืองของคุณ',
    nw_rec1_cta: 'ดูผู้ช่วยคนไทย',
    nw_rec2_h: 'ส่งข้อความหาผู้ช่วยและสอบถาม',
    nw_rec2_p: 'ผู้ช่วยบางคนมีใบอนุญาตทำงานที่ถูกต้องจากนายจ้างก่อนหน้า ถามก่อนสันนิษฐาน',
    nw_rec2_cta: 'ดูผู้ช่วยทั้งหมด',
    nw_rec3_h: 'พูดคุยกับเอเจนซี่ที่ได้รับใบอนุญาต',
    nw_rec3_p: 'สำหรับงานสั้นมาก เอเจนซี่ที่ได้รับใบอนุญาตสามารถจัดหาผู้ช่วยที่มีใบอนุญาตทำงานครอบคลุมแล้ว',

    ws_h2: 'ใบอนุญาตทำงานคุ้มค่า — แต่กระบวนการใช้เวลา',
    ws_p: 'สำหรับการจ้างงาน 3–6 เดือน คณิตศาสตร์มักจะใช้ได้ผล แต่เอกสารอาจใช้เวลานานกว่างานเอง วิธีที่ปฏิบัติได้คือใช้สะพานเชื่อม',
    ws_rec1_h: 'จ้างผู้ช่วยคนไทยเป็นสะพานเชื่อม',
    ws_rec1_p: 'หาคนที่สามารถเริ่มงานได้ทันทีในขณะที่คุณจัดการ WP สำหรับผู้สมัครที่คุณต้องการ',
    ws_rec1_cta: 'ดูผู้ช่วยคนไทย',
    ws_rec2_h: 'หาผู้ช่วยที่มีใบอนุญาตทำงาน',
    ws_rec2_p: 'ผู้ช่วยบางคนมี WP ที่ถูกต้องอยู่แล้ว — เส้นทางที่เร็วที่สุด ไม่ต้องรอ',
    ws_rec2_cta: 'ดูผู้ช่วยที่มี WP',
    ws_rec3_h: 'ขอความช่วยเหลือจากผู้เชี่ยวชาญ',
    ws_rec3_p: 'ทนายความตรวจคนเข้าเมืองหรือเอเจนซี่วีซ่าสามารถดำเนินการขอ WP คู่ขนานได้',
    ws_rec3_cta: 'หาผู้เชี่ยวชาญในเมืองของคุณ',

    wi_h2: 'ใบอนุญาตทำงานสมเหตุสมผลสำหรับการจ้างงานนี้',
    wi_p_long: 'สำหรับการจัดการระยะยาว ค่าใช้จ่ายล่วงหน้าจะคุ้มค่า นี่คือแผนที่ปฏิบัติได้:',
    wi_step1_h: 'ยืนยันผู้สมัคร',
    wi_step1_p: 'เลือกผู้ช่วยของคุณก่อนเริ่มเอกสาร — ใบสมัครผูกกับนายจ้าง/ลูกจ้างคู่หนึ่งโดยเฉพาะ',
    wi_step2_h: 'จ้างผู้เชี่ยวชาญ',
    wi_step2_p: 'ทนายความหรือตัวแทนวีซ่าที่มีใบอนุญาตจะดำเนินการตั้งแต่ต้นจนจบ',
    wi_step3_h: 'วางแผนสะพานเชื่อม',
    wi_step3_p: 'จ้างผู้ช่วยคนไทยระยะสั้นในขณะที่กำลังดำเนินการเอกสาร',
    wi_transfer: 'เนื่องจากผู้ช่วยทำงานอยู่แล้ว (หรืออยู่บน Non-B แล้ว) การโอนย้ายมักจะเร็วกว่าการเริ่มใหม่',
    wi_cta_experts: 'หาผู้เชี่ยวชาญในเมืองของคุณ',
    wi_cta_bridge: 'ดูผู้ช่วยคนไทย (สะพานเชื่อม)',

    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_product: 'ผลิตภัณฑ์', footer_pricing: 'ราคา', footer_employers: 'สำหรับครอบครัว',
    footer_company: 'บริษัท', footer_contact: 'ติดต่อ', footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย',
    footer_legal: 'กฎหมาย', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'ข้อกำหนดการให้บริการ',
  },
};

// Generate a one-shot session id for analytics correlation. Crypto.randomUUID
// is widely supported but we keep a fallback for older browsers / SSR.
function makeSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'wiz-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Format the cost range as a localised string.
function formatCostRange(cost, lang) {
  if (!cost) return '';
  const fmt = new Intl.NumberFormat(lang === 'th' ? 'th-TH' : 'en-US');
  return `${fmt.format(cost.min)} – ${fmt.format(cost.max)}`;
}

export default function WorkPermitWizard() {
  const { lang } = useLang();
  const t = T[lang] || T.en;

  const [step, setStep] = useState(1);
  const [city, setCity] = useState('');           // slug
  const [nationality, setNationality] = useState('');
  const [helperStatus, setHelperStatus] = useState('');
  const [visaType, setVisaType] = useState('');
  const [duration, setDuration] = useState('');
  const [agree, setAgree] = useState(false);

  // Stable session id — generated once per visit, reused for the result
  // insert + every CTA-click event.
  const [sessionId] = useState(() => makeSessionId());
  const [analyticsSent, setAnalyticsSent] = useState(false);

  // Nationality short-circuits: Thai (no WP needed) and non-MOU3
  // (domestic-worker permit category unavailable) both land on the
  // result panel directly from step 2, skipping helper-status / visa /
  // duration which don't change the outcome.
  const isMou3 = MOU_DW_NATIONALITIES.includes(nationality);
  const skipsToResult = nationality === 'thai' || (nationality && !isMou3);

  // Skip the visa-type question for Thai nationals (handled above) and
  // for new hires not yet in Thailand (no current Thai visa).
  const showVisaStep = nationality !== 'thai' && helperStatus !== 'new_hire_abroad';

  // Compute the result object once we have enough info. Non-MOU3
  // nationalities don't need a duration — the legal answer is the same
  // for any duration.
  const result = useMemo(() => {
    if (!nationality) return null;
    if (skipsToResult && nationality !== 'thai') {
      // not_legally_allowed — duration is irrelevant
      return getWizardResult({ city, nationality, helperStatus, visaType, duration: 'any' });
    }
    if (!duration) return null;
    return getWizardResult({ city, nationality, helperStatus, visaType, duration });
  }, [city, nationality, helperStatus, visaType, duration, skipsToResult]);

  // Map slug → display name (for analytics — pickEnum expects display names)
  const cityDisplay = useMemo(() => {
    const opt = CITY_OPTIONS.find(c => c.slug === city);
    return opt ? opt.name : null;
  }, [city]);

  // Fire analytics once when we land on the result step.
  useEffect(() => {
    if (step !== 6 || !result || analyticsSent) return;
    setAnalyticsSent(true);
    fetch('/api/wizard-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        city: cityDisplay,
        nationality,
        helperStatus,
        visaType: visaType || null,
        duration,
        resultFlow: result.flow,
        resultTrack: result.track || null,
      }),
    }).catch(() => { /* analytics is best-effort */ });
  }, [step, result, analyticsSent, sessionId, cityDisplay, nationality, helperStatus, visaType, duration]);

  // CTA-click tracking — fires on the way out so the wizard knows which
  // recommendation actually converted.
  const trackCta = (ctaName) => {
    if (!result) return;
    fetch('/api/wizard-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        city: cityDisplay,
        nationality,
        helperStatus,
        visaType: visaType || null,
        duration,
        resultFlow: result.flow,
        resultTrack: result.track || null,
        ctaClicked: ctaName,
      }),
    }).catch(() => {});
  };

  const restart = () => {
    setStep(1);
    setCity(''); setNationality(''); setHelperStatus('');
    setVisaType(''); setDuration(''); setAgree(false);
    setAnalyticsSent(false);
  };

  // ── Step gating: which "Next" buttons are enabled ──
  const canNext = (
    (step === 1 && !!city) ||
    (step === 2 && !!nationality) ||
    (step === 3 && !!helperStatus) ||
    (step === 4 && (!showVisaStep || !!visaType)) ||
    (step === 5 && !!duration)
  );

  // Advance with smart skip:
  //   • Thai national → straight to duration (we'll route to no_wp_needed)
  //   • Non-MOU3 nationality → straight to result (not_legally_allowed,
  //     duration / status / visa don't matter)
  //   • abroad hire → skip the visa-type step
  const goNext = () => {
    if (step === 2 && nationality === 'thai') {
      // Jump to duration; helperStatus / visaType won't matter.
      setHelperStatus('');
      setVisaType('');
      setStep(5);
      return;
    }
    if (step === 2 && nationality && !isMou3) {
      // Non-MOU3 → straight to result. Clear downstream state so a
      // user who backs up and changes nationality doesn't carry stale
      // helper-status / visa-type / duration into a different flow.
      setHelperStatus('');
      setVisaType('');
      setDuration('');
      setStep(6);
      return;
    }
    if (step === 3 && !showVisaStep) {
      setVisaType('');
      setStep(5);
      return;
    }
    if (step === 5) {
      setStep(6);
      return;
    }
    setStep(s => s + 1);
  };

  const goBack = () => {
    if (step === 5 && nationality === 'thai') { setStep(2); return; }
    if (step === 5 && !showVisaStep) { setStep(3); return; }
    // From result step: non-MOU3 came straight from q2, others from q5
    if (step === 6 && nationality && !isMou3 && nationality !== 'thai') {
      setStep(2);
      return;
    }
    if (step === 6) { setStep(5); return; }
    setStep(s => Math.max(1, s - 1));
  };

  return (
    <>
      <SEOHead
        title={t.page_title}
        description={t.meta_desc}
        path="/work-permit-wizard"
        lang={lang}
        jsonLd={getBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Work Permit Wizard', path: '/work-permit-wizard' },
        ])}
      />

      <div className={`min-h-screen bg-background text-on-background font-sans ${lang === 'th' ? 'lang-th' : ''}`}>
        {/* Audience switch */}
        <div className="fixed top-0 left-0 w-full bg-[#001b3d] text-white z-[60]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-2.5 flex justify-center md:justify-end items-center gap-5 md:gap-7 text-xs md:text-sm">
            <Link href="/employers" className="font-semibold hover:text-gold transition-colors whitespace-nowrap">
              {t.nav_employers} →
            </Link>
            <Link href="/helpers" className="font-semibold hover:text-gold transition-colors whitespace-nowrap">
              {t.nav_helpers} →
            </Link>
          </div>
        </div>

        <nav className="fixed top-9 md:top-11 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <Link href="/" className="text-xl md:text-2xl font-bold font-headline">
            <span>Thai</span><span style={{ color: '#006a62' }}>Helper</span>
          </Link>
          {(() => {
            const navItems = [
              { href: '/helpers',             label: t.nav_browse_helpers },
              { href: '/directory',           label: t.nav_directory },
              { href: '/employers',           label: t.nav_employers },
              { href: '/about',               label: t.nav_about },
              { href: '/faq',                 label: t.nav_faq },
              { href: '/blog',                label: t.nav_blog },
            ];
            return (
              <>
                <div className="hidden lg:flex items-center gap-4">
                  <ResourcesDropdown label={t.nav_resources} items={navItems} />
                  <Link className="text-sm font-semibold text-[#001b3d] hover:text-primary transition-colors" href="/login">{t.nav_login}</Link>
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
          {/* Hero */}
          <section className="px-6 pt-8 pb-6 md:pt-12 md:pb-8">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                {t.hero_eyebrow}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-on-background mb-3 leading-tight">
                {t.hero_h1}
              </h1>
              <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                {t.hero_sub}
              </p>
            </div>
          </section>

          {/* Baseline rule callout — visible upfront so the wizard's
              role (cost/benefit decision) doesn't get confused with the
              question of whether a WP is legally required. The legal
              answer is always yes for non-Thai workers. */}
          <section className="px-4 md:px-6 pb-2">
            <div className="max-w-2xl mx-auto rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900 leading-relaxed">
              <strong className="font-bold">📋 {t.rule_label}: </strong>
              {t.rule_text}
            </div>
          </section>

          {/* May 2026 enforcement banner — surfaces the active nationwide
              crackdown launched after the 1 May 2026 Koh Phangan raid.
              Sits above the wizard intentionally so every visitor sees it,
              not just those who reach the result step. */}
          <section className="px-4 md:px-6 pb-2 pt-2">
            <div className="max-w-2xl mx-auto rounded-xl border-2 border-red-300 bg-red-50 px-5 py-4 text-sm text-red-900 leading-relaxed">
              <strong className="font-bold block mb-1">{t.enforcement_label}</strong>
              {t.enforcement_text}
            </div>
          </section>

          {/* Wizard card */}
          <section className="px-4 md:px-6 pb-16">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10">
              {step <= 5 ? (
                <>
                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                      <span>{t.step_label.replace('{n}', String(step))}</span>
                      <span>{Math.min(step, 5)}/5</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(step / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  {step === 1 && (
                    <Question
                      title={t.q1_title}
                      sub={t.q1_sub}
                    >
                      <select
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-300 text-base bg-white"
                      >
                        <option value="">{t.q1_placeholder}</option>
                        {CITY_OPTIONS.map(c => (
                          <option key={c.slug} value={c.slug}>{c.name}</option>
                        ))}
                      </select>
                    </Question>
                  )}

                  {step === 2 && (
                    <Question
                      title={t.q2_title}
                      sub={t.q2_sub}
                    >
                      <ChoiceList
                        options={NATIONALITY_OPTIONS}
                        value={nationality}
                        onChange={setNationality}
                        lang={lang}
                      />
                    </Question>
                  )}

                  {step === 3 && (
                    <Question
                      title={t.q3_title}
                      sub={t.q3_sub}
                    >
                      <ChoiceList
                        options={HELPER_STATUS_OPTIONS}
                        value={helperStatus}
                        onChange={setHelperStatus}
                        lang={lang}
                      />
                    </Question>
                  )}

                  {step === 4 && showVisaStep && (
                    <Question
                      title={t.q4_title}
                      sub={t.q4_sub}
                    >
                      <ChoiceList
                        options={VISA_TYPE_OPTIONS}
                        value={visaType}
                        onChange={setVisaType}
                        lang={lang}
                      />
                    </Question>
                  )}

                  {step === 5 && (
                    <Question
                      title={t.q5_title}
                      sub={t.q5_sub}
                    >
                      <ChoiceList
                        options={DURATION_OPTIONS}
                        value={duration}
                        onChange={setDuration}
                        lang={lang}
                      />
                    </Question>
                  )}

                  {/* Nav buttons */}
                  <div className="flex items-center justify-between mt-8">
                    <button
                      onClick={goBack}
                      disabled={step === 1}
                      className="text-sm font-semibold text-slate-600 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t.btn_back}
                    </button>
                    <button
                      onClick={goNext}
                      disabled={!canNext}
                      className="px-6 py-3 rounded-full bg-primary text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-container transition-colors"
                    >
                      {t.btn_next}
                    </button>
                  </div>
                </>
              ) : (
                <ResultPanel
                  result={result}
                  t={t}
                  lang={lang}
                  city={city}
                  nationality={nationality}
                  agree={agree}
                  setAgree={setAgree}
                  trackCta={trackCta}
                  onRestart={restart}
                />
              )}
            </div>

            {/* Disclaimer always visible on the wizard page */}
            <div className="max-w-2xl mx-auto">
              <LegalDisclaimer lang={lang} />
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="w-full bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto py-10 px-6 text-center">
            <p className="text-slate-400 text-xs leading-relaxed max-w-3xl mx-auto mb-2">
              {t.footer_desc}
            </p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-500 mt-3">
              <Link href="/about" className="hover:text-primary">{t.footer_about}</Link>
              <Link href="/faq" className="hover:text-primary">{t.footer_faq}</Link>
              <Link href="/privacy" className="hover:text-primary">{t.footer_privacy}</Link>
              <Link href="/terms" className="hover:text-primary">{t.footer_terms}</Link>
            </div>
            <p className="text-slate-400 text-xs mt-4">© 2026 ThaiHelper.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Question({ title, sub, children }) {
  return (
    <div>
      <h2 className="text-xl md:text-2xl font-extrabold font-headline text-on-background mb-2">
        {title}
      </h2>
      {sub && (
        <p className="text-sm md:text-base text-on-surface-variant mb-5 leading-relaxed">
          {sub}
        </p>
      )}
      {children}
    </div>
  );
}

function ChoiceList({ options, value, onChange, lang }) {
  return (
    <div className="grid gap-2">
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
              active
                ? 'border-primary bg-primary/5 text-primary font-semibold'
                : 'border-slate-200 hover:border-primary/40 bg-white'
            }`}
          >
            {lang === 'th' ? opt.th : opt.en}
          </button>
        );
      })}
    </div>
  );
}

function ResultPanel({ result, t, lang, city, nationality, agree, setAgree, trackCta, onRestart }) {
  if (!result) return null;

  // CTA URL helpers — keep all link generation in one place so the
  // /helpers and /directory routes stay consistent. We use the
  // nationality filter (`?nationality=thai`) for the "Thai helper"
  // CTAs because it matches helpers self-identifying as Thai citizens
  // directly, rather than going through the WP-status proxy.
  const thaiHelpersUrl   = '/helpers?nationality=thai';
  const validWpHelpersUrl = '/helpers?wp=valid_wp';
  const allHelpersUrl    = '/helpers';
  const directoryUrl = () => {
    const params = new URLSearchParams({ source: 'wizard' });
    if (city) params.set('city', city);
    return `/directory?${params.toString()}`;
  };

  // Disable CTAs until the user confirms they understand this is general
  // information, not legal advice (per spec section 2.13).
  const ctaDisabledClass = agree
    ? 'bg-primary text-white hover:bg-primary-container'
    : 'bg-slate-200 text-slate-500 cursor-not-allowed pointer-events-none';

  // Only the MOU track is in scope for this wizard now — non-MOU3
  // nationalities short-circuit to the not_legally_allowed flow before
  // a track is assigned.
  const trackTitle = result.track === 'mou' ? t.result_label_track_mou : null;

  return (
    <div>
      {/* Header by flow */}
      {result.flow === 'no_wp_needed' && (
        <>
          <h2 className="text-2xl md:text-3xl font-extrabold font-headline mb-3">{t.no_wp_h2}</h2>
          <p className="text-base text-on-surface-variant mb-6">{t.no_wp_p}</p>
        </>
      )}
      {result.flow === 'not_legally_allowed' && (
        <>
          <h2 className="text-2xl md:text-3xl font-extrabold font-headline mb-3 text-red-700">{t.nla_h2}</h2>
          <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 md:p-5 mb-6">
            <p className="text-sm md:text-base text-red-900 leading-relaxed">{t.nla_p}</p>
          </div>
        </>
      )}
      {result.flow === 'not_worth_it' && (
        <>
          <h2 className="text-2xl md:text-3xl font-extrabold font-headline mb-3">{t.nw_h2}</h2>
          <p className="text-base text-on-surface-variant mb-6">{t.nw_p}</p>
        </>
      )}
      {result.flow === 'worth_it_but_slow' && (
        <>
          <h2 className="text-2xl md:text-3xl font-extrabold font-headline mb-3">{t.ws_h2}</h2>
          <p className="text-base text-on-surface-variant mb-6">{t.ws_p}</p>
        </>
      )}
      {result.flow === 'worth_it' && (
        <>
          <h2 className="text-2xl md:text-3xl font-extrabold font-headline mb-3">{t.wi_h2}</h2>
          <p className="text-base text-on-surface-variant mb-4">{t.wi_p_long}</p>
        </>
      )}

      {/* Cost / time facts (only when we have a track) */}
      {result.estimatedCost && trackTitle && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-6 text-sm">
          <div className="font-semibold mb-2">{trackTitle}</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{t.result_estimated_cost}</div>
              <div className="font-bold">{formatCostRange(result.estimatedCost, lang)} {t.result_thb}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{t.result_estimated_time}</div>
              <div className="font-bold">{result.estimatedCost.timeMonths}</div>
            </div>
          </div>
        </div>
      )}

      {/* Myanmar-specific 2026 compliance notice. Shown for every MOU
          result where the helper is Myanmar — covers NIC/household-list
          requirement, CI status, and the 31 Mar 2026 renewal deadline
          that a large share of Myanmar workers missed. */}
      {result.track === 'mou' && nationality === 'myanmar' && (
        <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-4 md:p-5 mb-6">
          <div className="font-bold text-orange-900 mb-2 text-sm md:text-base">
            {t.myanmar_notice_title}
          </div>
          <ul className="text-sm text-orange-900 leading-relaxed space-y-2 list-disc pl-5">
            <li>{t.myanmar_notice_b1}</li>
            <li>{t.myanmar_notice_b2}</li>
            <li>{t.myanmar_notice_b3}</li>
          </ul>
        </div>
      )}

      {/* Agree-to-disclaimer gate (per spec section 2.13) */}
      <label className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
        <input
          type="checkbox"
          checked={agree}
          onChange={e => setAgree(e.target.checked)}
          className="mt-1 w-4 h-4 accent-amber-600"
        />
        <span className="text-sm text-amber-900">
          <strong>{t.result_disclaimer_title}:</strong> {t.result_disclaimer}
        </span>
      </label>

      {/* Recommendations by flow */}
      {result.flow === 'no_wp_needed' && (
        <Link
          href={thaiHelpersUrl}
          onClick={() => trackCta('no_wp_browse_thai')}
          className={`inline-block w-full text-center px-6 py-3.5 rounded-2xl font-bold transition-colors ${ctaDisabledClass}`}
        >
          {t.no_wp_cta_browse}
        </Link>
      )}

      {result.flow === 'not_legally_allowed' && (
        <div className="grid gap-3">
          <div className="text-sm font-bold text-on-background mb-1">{t.nla_alt_title}</div>
          <Recommendation t={t}
            title={t.nla_alt1_h} body={t.nla_alt1_p} cta={t.nla_alt1_cta}
            href={thaiHelpersUrl}
            disabled={!agree}
            onClick={() => trackCta('nla_browse_thai')}
          />
          <Recommendation t={t}
            title={t.nla_alt2_h} body={t.nla_alt2_p} cta={t.nla_alt2_cta}
            href="/helpers?nationality=myanmar,laos,cambodia"
            disabled={!agree}
            onClick={() => trackCta('nla_browse_mou3')}
          />
          <Recommendation t={t}
            title={t.nla_alt3_h} body={t.nla_alt3_p} cta={t.nla_alt3_cta}
            href={directoryUrl()}
            disabled={!agree}
            onClick={() => trackCta('nla_directory')}
          />
        </div>
      )}

      {result.flow === 'not_worth_it' && (
        <div className="grid gap-3">
          <Recommendation t={t}
            title={t.nw_rec1_h} body={t.nw_rec1_p} cta={t.nw_rec1_cta}
            href={thaiHelpersUrl}
            disabled={!agree}
            onClick={() => trackCta('nw_browse_thai')}
          />
          <Recommendation t={t}
            title={t.nw_rec2_h} body={t.nw_rec2_p} cta={t.nw_rec2_cta}
            href={allHelpersUrl}
            disabled={!agree}
            onClick={() => trackCta('nw_browse_all')}
          />
          <RecommendationStatic
            title={t.nw_rec3_h} body={t.nw_rec3_p}
          />
        </div>
      )}

      {result.flow === 'worth_it_but_slow' && (
        <div className="grid gap-3">
          <Recommendation t={t}
            title={t.ws_rec1_h} body={t.ws_rec1_p} cta={t.ws_rec1_cta}
            href={thaiHelpersUrl}
            disabled={!agree}
            onClick={() => trackCta('ws_browse_thai')}
          />
          <Recommendation t={t}
            title={t.ws_rec2_h} body={t.ws_rec2_p} cta={t.ws_rec2_cta}
            href={validWpHelpersUrl}
            disabled={!agree}
            onClick={() => trackCta('ws_browse_valid_wp')}
          />
          <Recommendation t={t}
            title={t.ws_rec3_h} body={t.ws_rec3_p} cta={t.ws_rec3_cta}
            href={directoryUrl()}
            disabled={!agree}
            onClick={() => trackCta('ws_directory')}
          />
        </div>
      )}

      {result.flow === 'worth_it' && (
        <div className="grid gap-3">
          <NumberedStep n={1} title={t.wi_step1_h} body={t.wi_step1_p} />
          <NumberedStep n={2} title={t.wi_step2_h} body={t.wi_step2_p} />
          <NumberedStep n={3} title={t.wi_step3_h} body={t.wi_step3_p} />
          {result.canTransfer && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              ✅ {t.wi_transfer}
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            <Link
              href={directoryUrl()}
              onClick={() => trackCta('wi_directory')}
              className={`inline-block text-center px-6 py-3 rounded-2xl font-bold transition-colors ${ctaDisabledClass}`}
            >
              {t.wi_cta_experts}
            </Link>
            <Link
              href={thaiHelpersUrl}
              onClick={() => trackCta('wi_bridge')}
              className={`inline-block text-center px-6 py-3 rounded-2xl font-bold border-2 border-primary text-primary bg-white transition-colors ${agree ? 'hover:bg-primary/5' : 'opacity-40 pointer-events-none'}`}
            >
              {t.wi_cta_bridge}
            </Link>
          </div>
        </div>
      )}

      <button
        onClick={onRestart}
        className="mt-6 text-sm font-semibold text-slate-500 hover:text-primary"
      >
        {t.btn_restart}
      </button>
    </div>
  );
}

function Recommendation({ title, body, cta, href, disabled, onClick }) {
  const baseLink = 'inline-block px-5 py-2.5 rounded-full font-bold text-sm transition-colors';
  const linkClass = disabled
    ? `${baseLink} bg-slate-200 text-slate-500 pointer-events-none`
    : `${baseLink} bg-primary text-white hover:bg-primary-container`;
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="text-base md:text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-on-surface-variant mb-3">{body}</p>
      <Link href={href} onClick={onClick} className={linkClass}>{cta}</Link>
    </div>
  );
}

function RecommendationStatic({ title, body }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
      <h3 className="text-base md:text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-on-surface-variant">{body}</p>
    </div>
  );
}

function NumberedStep({ n, title, body }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4 flex gap-4">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-white font-bold flex items-center justify-center">
        {n}
      </div>
      <div>
        <h3 className="text-base md:text-lg font-bold mb-1">{title}</h3>
        <p className="text-sm text-on-surface-variant">{body}</p>
      </div>
    </div>
  );
}
