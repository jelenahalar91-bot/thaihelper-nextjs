import { useState } from 'react';
import Link from 'next/link';
import BrandWordmark from '@/components/BrandWordmark';
import SEOHead, { getBreadcrumbSchema, getOrganizationSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu, ResourcesDropdown } from '@/components/MobileMenu';
import { getServiceSupabase, selectAll } from '@/lib/supabase';
import { cityLabel, roleLabel } from '@/lib/recent-helpers-display';
import { useLang } from './_app';

const PRESS_EMAIL = 'support@thaihelper.app';

const T = {
  en: {
    page_title: 'Press & Media – ThaiHelper',
    meta_desc: 'Press kit for ThaiHelper: live platform figures, boilerplate texts, brand assets and press contact. A free direct-hiring platform for household staff in Thailand.',
    nav_employers: 'For Families',
    nav_helpers: 'For Helpers',
    nav_blog: 'Blog',
    nav_login: 'Login',
    nav_resources: 'Resources',
    nav_browse_helpers: 'Browse Helpers',
    nav_wizard: 'Work Permit Wizard',
    nav_directory: 'Expert Directory',
    nav_faq_link: 'FAQ',
    nav_cta: 'Register – Free',

    hero_eyebrow: 'Press & Media',
    hero_h1: 'Everything you need to write about us.',
    hero_sub: 'Live figures, ready-to-use boilerplate, brand assets and a direct line to the founders. If something is missing, just ask — we answer within one business day.',
    hero_cta: 'Email press contact',

    facts_title: 'The platform in numbers',
    facts_sub: 'Pulled directly from our database and refreshed every hour. Last updated:',
    facts_unavailable: 'Figures are temporarily unavailable. Please email us and we will send them over.',
    fact_helpers: 'Verified helpers',
    fact_families: 'Verified families',
    fact_conversations: 'Conversations started',
    fact_messages: 'Messages exchanged',
    fact_cities: 'Cities covered',
    fact_new30: 'New registrations (30 days)',
    fact_hires: 'Confirmed hires',
    fact_hires_note: 'Self-reported by families after a hire.',
    fact_founded: 'Platform launched',
    fact_founded_val: 'April 2026',

    break_cities: 'Helpers by city',
    break_categories: 'Helpers by role',
    break_nationalities: 'Helpers by nationality',
    break_note: 'A helper can offer several roles, so role figures add up to more than the total.',
    break_col_count: 'Helpers',
    break_other: 'Other / not stated',

    boiler_title: 'Boilerplate',
    boiler_sub: 'Three lengths, cleared for publication. Copy and paste as is.',
    boiler_copy: 'Copy',
    boiler_copied: 'Copied',
    boiler_short_h: 'One line',
    boiler_short: 'ThaiHelper (www.thaihelper.app) is a free platform where families in Thailand and household professionals find each other directly, without an agency in between.',
    boiler_mid_h: 'Short — about 50 words',
    boiler_mid: 'ThaiHelper (www.thaihelper.app) is a free platform connecting families in Thailand with nannies, housekeepers, chefs, drivers, gardeners, carers, tutors and pet sitters. Helpers create their own profiles, families browse and message them directly. There are no sign-up fees, no subscriptions and no commission on either side.',
    boiler_long_h: 'Long — about 120 words',
    boiler_long: 'ThaiHelper (www.thaihelper.app) is a free platform on which families in Thailand and household professionals connect directly — nannies, housekeepers, chefs, drivers, gardeners, elder carers, tutors and pet sitters. Helpers publish their own profiles with photos, experience, languages and references; families browse by city and role and message the people they are interested in themselves. Neither side pays a sign-up fee, a subscription or a commission. The platform was built by a family of four who moved to Thailand in December 2024 and spent weeks trying to find a nanny, a gardener and tutors of their own. It launched in April 2026 and is available in English and Thai.',

    accurate_title: 'Please get these right',
    accurate_sub: 'The four things that are most often reported inaccurately about us. We would rather hand you the precise version up front.',
    acc1_h: 'We are not a recruitment agency.',
    acc1_p: 'ThaiHelper provides listings and a messaging channel, nothing more. We do not place candidates, do not screen them on a family\'s behalf, do not employ anyone, and take no part in the hiring decision or the employment relationship that follows.',
    acc2_h: '"Verified" means email and phone — not a background check.',
    acc2_p: 'Every account is email-verified before it goes live, and families additionally confirm a phone number by SMS before they can message anyone. We do not carry out identity checks, criminal-record checks or background screening, and we ask that we are never described as doing so.',
    acc3_h: 'Free means free, on both sides.',
    acc3_p: 'No sign-up fee, no subscription, no placement fee, no commission — for families and helpers alike. Every baht a helper earns from a job stays with the helper. The platform is currently funded by its founders.',
    acc4_h: 'Work permits are the users\' responsibility.',
    acc4_p: 'Thai law restricts which nationalities may legally work in private households, and some roles are closed to foreign nationals entirely. We publish a free Work Permit Wizard and a legal overview to help people understand the rules, but compliance rests with the employer and the employee.',
    acc_wizard: 'Work Permit Wizard',
    acc_legal: 'Legal overview',

    confusion_title: 'Not to be confused with',
    confusion_sub: 'Four unrelated products share part of our name. Searching for "Thai Helper" will surface them.',
    conf1: 'The Thai Helper language-learning app for iOS and Android, which teaches Thai vocabulary and pronunciation.',
    conf2: 'thai-helper.com (hyphenated, .com) — an unrelated visa, relocation and tourist-assistance service.',
    conf3: 'ThaiFriendly (thaifriendly.com), a Thai dating site.',
    conf4: 'The Thai TDAC Arrival Card Helper app, a tourist arrival-card utility.',
    conf_us: 'We are thaihelper.app — household staff hiring, nothing else.',

    angles_title: 'Stories we can help with',
    angles_sub: 'Happy to provide data, context or an interview on any of these. Exclusives are possible — just say so.',
    ang1_h: 'What household help actually costs in Thailand',
    ang1_p: 'We hold salary expectations across every verified profile, broken down by city, role, experience and nationality. We will prepare a custom analysis with charts for you, free of charge.',
    ang2_h: 'Who may legally work in a Thai household — and who may not',
    ang2_p: 'In practice only a narrow set of nationalities has a legal route into private households, and driving is closed to foreign nationals altogether. Many families only discover this after hiring. We have the figures on how widespread the misunderstanding is.',
    ang3_h: 'The scams targeting domestic workers',
    ang3_p: 'Fake employers, impersonated support staff, requests for passport scans. We have documented cases, the moderation data behind them, and practical advice for readers.',
    ang4_h: 'A family that built the thing it needed',
    ang4_p: 'The founder story: moving countries with two children, weeks of fruitless searching, and the decision to build a platform instead of giving up. Interviews available in English and German.',

    about_title: 'Background',
    about_p1: 'ThaiHelper was built by a family of four who moved from Europe to Thailand in December 2024. Like most expat families with children, one of the first things they needed was a nanny — and finding one took weeks of chaotic Facebook threads and unanswered agency enquiries.',
    about_p2: 'The same frustration repeated itself when they looked for a gardener and for tutors. Instead of giving up, they built the platform they had been looking for. It launched in April 2026 and is free for everyone who uses it.',
    about_more: 'Read the full story',

    assets_title: 'Brand assets',
    assets_sub: 'Free to use in editorial coverage of ThaiHelper. Please do not alter the wordmark or its colours.',
    asset_logo: 'Logo (SVG)',
    asset_icon: 'App icon (PNG, 512px)',
    asset_og: 'Preview image (JPG)',
    asset_download: 'Download',
    colors_title: 'Brand colours',
    color_primary: 'Primary teal',
    color_navy: 'Navy',
    color_gold: 'Gold',
    assets_name_h: 'How to write our name',
    assets_name_p: 'One word, capital T and capital H: ThaiHelper. Not "Thai Helper", not "Thaihelper", not "THAIHELPER". The domain is thaihelper.app.',

    contact_title: 'Press contact',
    contact_p: 'Questions, interview requests, fact checks or a figure you need in a hurry — write to us and you will have an answer within one business day.',
    contact_langs: 'Interviews and written answers available in English and German.',
    contact_btn: 'Email us',

    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_product: 'Product', footer_find: 'Benefits', footer_hire: 'Categories', footer_employers: 'For Families',
    footer_company: 'Company', footer_contact: 'Contact', footer_line: 'LINE', footer_about: 'About', footer_faq: 'FAQ', footer_press: 'Press',
    footer_legal: 'Legal', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
    footer_disclaimer: 'ThaiHelper.app is free to use. We are not a recruitment agency and do not provide placement services. Compliance with Thai labor and immigration laws is the sole responsibility of the users.',
  },

  th: {
    page_title: 'สำหรับสื่อมวลชน – ThaiHelper',
    meta_desc: 'ชุดข้อมูลสำหรับสื่อมวลชนของ ThaiHelper: ตัวเลขล่าสุดของแพลตฟอร์ม ข้อความแนะนำองค์กร ไฟล์โลโก้ และช่องทางติดต่อ แพลตฟอร์มฟรีสำหรับการจ้างพนักงานในบ้านโดยตรงในประเทศไทย',
    nav_employers: 'สำหรับครอบครัว',
    nav_helpers: 'สำหรับผู้ช่วย',
    nav_blog: 'บล็อก',
    nav_resources: 'แหล่งข้อมูล',
    nav_browse_helpers: 'ดูผู้ช่วย',
    nav_wizard: 'ตัวช่วยใบอนุญาตทำงาน',
    nav_directory: 'รายชื่อผู้เชี่ยวชาญ',
    nav_faq_link: 'คำถามที่พบบ่อย',
    nav_login: 'เข้าสู่ระบบ',
    nav_cta: 'สมัคร – ฟรี',

    hero_eyebrow: 'สำหรับสื่อมวลชน',
    // "เขียนถึงเรา" would mean writing TO us, not ABOUT us — the
    // back-translation check caught it. "เกี่ยวกับ" is the one that carries
    // the intended sense.
    hero_h1: 'ทุกสิ่งที่คุณต้องใช้ในการเขียนเกี่ยวกับเรา',
    hero_sub: 'ตัวเลขล่าสุด ข้อความแนะนำองค์กรที่พร้อมใช้ ไฟล์โลโก้ และช่องทางติดต่อผู้ก่อตั้งโดยตรง หากขาดสิ่งใด กรุณาแจ้งเรา เราตอบกลับภายในหนึ่งวันทำการ',
    // Not "ฝ่ายสื่อสาร" — that promises a communications department, and
    // what a journalist actually reaches is the founders.
    hero_cta: 'ส่งอีเมลถึงเรา',

    facts_title: 'แพลตฟอร์มในรูปตัวเลข',
    facts_sub: 'ดึงจากฐานข้อมูลของเราโดยตรงและอัปเดตทุกชั่วโมง ข้อมูลล่าสุดเมื่อ',
    facts_unavailable: 'ขณะนี้ยังไม่สามารถแสดงตัวเลขได้ กรุณาส่งอีเมลถึงเรา แล้วเราจะส่งข้อมูลให้',
    fact_helpers: 'ผู้ช่วยที่ยืนยันแล้ว',
    fact_families: 'ครอบครัวที่ยืนยันแล้ว',
    fact_conversations: 'การสนทนาที่เริ่มแล้ว',
    fact_messages: 'ข้อความที่ส่งถึงกัน',
    fact_cities: 'จังหวัดที่ครอบคลุม',
    fact_new30: 'สมัครใหม่ (30 วัน)',
    fact_hires: 'การจ้างงานที่ได้รับการยืนยัน',
    fact_hires_note: 'ครอบครัวเป็นผู้แจ้งเองหลังจ้างงาน',
    fact_founded: 'เปิดให้บริการ',
    fact_founded_val: 'เมษายน 2026',

    break_cities: 'ผู้ช่วยแยกตามจังหวัด',
    break_categories: 'ผู้ช่วยแยกตามประเภทงาน',
    break_nationalities: 'ผู้ช่วยแยกตามสัญชาติ',
    break_note: 'ผู้ช่วยหนึ่งคนรับงานได้หลายประเภท ผลรวมของแต่ละประเภทจึงมากกว่าจำนวนผู้ช่วยทั้งหมด',
    break_col_count: 'ผู้ช่วย',
    break_other: 'อื่นๆ / ไม่ระบุ',

    boiler_title: 'ข้อความแนะนำองค์กร',
    boiler_sub: 'สามความยาว อนุญาตให้เผยแพร่ได้ คัดลอกไปใช้ได้ทันที',
    boiler_copy: 'คัดลอก',
    boiler_copied: 'คัดลอกแล้ว',
    boiler_short_h: 'หนึ่งบรรทัด',
    boiler_short: 'ThaiHelper (www.thaihelper.app) คือแพลตฟอร์มฟรีที่ครอบครัวในประเทศไทยและผู้ทำงานบ้านมืออาชีพหากันได้โดยตรง โดยไม่มีบริษัทจัดหางานเป็นคนกลาง',
    boiler_mid_h: 'สั้น — ประมาณ 50 คำ',
    boiler_mid: 'ThaiHelper (www.thaihelper.app) คือแพลตฟอร์มฟรีที่เชื่อมครอบครัวในประเทศไทยเข้ากับพี่เลี้ยงเด็ก แม่บ้าน พ่อครัว คนขับรถ คนสวน ผู้ดูแลผู้สูงอายุ ติวเตอร์ และผู้ดูแลสัตว์เลี้ยง ผู้ช่วยสร้างโปรไฟล์ของตนเอง ครอบครัวค้นหาและส่งข้อความถึงพวกเขาได้โดยตรง ไม่มีค่าสมัคร ไม่มีค่าสมาชิก และไม่มีค่าคอมมิชชั่นทั้งสองฝ่าย',
    boiler_long_h: 'ยาว — ประมาณ 120 คำ',
    boiler_long: 'ThaiHelper (www.thaihelper.app) คือแพลตฟอร์มฟรีที่ครอบครัวในประเทศไทยและผู้ทำงานบ้านมืออาชีพติดต่อกันได้โดยตรง ทั้งพี่เลี้ยงเด็ก แม่บ้าน พ่อครัว คนขับรถ คนสวน ผู้ดูแลผู้สูงอายุ ติวเตอร์ และผู้ดูแลสัตว์เลี้ยง ผู้ช่วยเผยแพร่โปรไฟล์ของตนเองพร้อมรูปภาพ ประสบการณ์ ภาษา และใบอ้างอิง ส่วนครอบครัวค้นหาตามจังหวัดและประเภทงาน แล้วส่งข้อความถึงคนที่สนใจด้วยตนเอง ทั้งสองฝ่ายไม่ต้องจ่ายค่าสมัคร ค่าสมาชิก หรือค่าคอมมิชชั่น แพลตฟอร์มนี้สร้างโดยครอบครัวสี่คนที่ย้ายมาประเทศไทยในเดือนธันวาคม 2024 และใช้เวลาหลายสัปดาห์ในการตามหาพี่เลี้ยง คนสวน และติวเตอร์ให้ครอบครัวของตนเอง เปิดให้บริการเมื่อเดือนเมษายน 2026 และใช้งานได้ทั้งภาษาอังกฤษและภาษาไทย',

    accurate_title: 'สี่เรื่องที่ขอให้เขียนให้ถูกต้อง',
    accurate_sub: 'สี่เรื่องที่สื่อมักรายงานคลาดเคลื่อนเกี่ยวกับเรา เราจึงขอให้ข้อมูลที่ถูกต้องไว้ตั้งแต่ต้น',
    acc1_h: 'เราไม่ใช่บริษัทจัดหางาน',
    acc1_p: 'ThaiHelper ให้บริการเพียงการลงประกาศโปรไฟล์และช่องทางส่งข้อความเท่านั้น เราไม่จัดหาคนให้ ไม่คัดกรองแทนครอบครัว ไม่ได้จ้างใครเป็นลูกจ้าง และไม่มีส่วนร่วมในการตัดสินใจจ้างงานหรือความสัมพันธ์การจ้างงานที่เกิดขึ้นตามมา',
    acc2_h: '"ยืนยันแล้ว" หมายถึงอีเมลและเบอร์โทร ไม่ใช่การตรวจสอบประวัติ',
    acc2_p: 'ทุกบัญชีต้องยืนยันอีเมลก่อนเปิดใช้งาน และครอบครัวต้องยืนยันเบอร์โทรศัพท์ทาง SMS เพิ่มเติมก่อนจึงจะส่งข้อความได้ เราไม่ได้ตรวจสอบบัตรประจำตัว ไม่ได้ตรวจสอบประวัติอาชญากรรม และไม่ได้ตรวจสอบภูมิหลัง จึงขอความกรุณาอย่าเขียนว่าเราทำสิ่งเหล่านี้',
    acc3_h: 'ฟรีจริง ฟรีทั้งสองฝ่าย',
    acc3_p: 'ไม่มีค่าสมัคร ไม่มีค่าสมาชิก ไม่มีค่าจัดหางาน ไม่มีค่าคอมมิชชั่น ทั้งสำหรับครอบครัวและผู้ช่วย ทุกบาทที่ผู้ช่วยได้รับจากงานเป็นของผู้ช่วย ขณะนี้ผู้ก่อตั้งเป็นผู้ออกค่าใช้จ่ายของแพลตฟอร์มเอง',
    acc4_h: 'ใบอนุญาตทำงานเป็นความรับผิดชอบของผู้ใช้',
    acc4_p: 'กฎหมายไทยจำกัดว่าสัญชาติใดทำงานในบ้านส่วนบุคคลได้อย่างถูกกฎหมาย และบางอาชีพปิดสำหรับคนต่างชาติโดยสิ้นเชิง เราจัดทำตัวช่วยใบอนุญาตทำงานและสรุปข้อกฎหมายไว้ให้ฟรีเพื่อช่วยให้เข้าใจกฎเกณฑ์ แต่การปฏิบัติตามกฎหมายเป็นความรับผิดชอบของนายจ้างและลูกจ้าง',
    acc_wizard: 'ตัวช่วยใบอนุญาตทำงาน',
    acc_legal: 'สรุปข้อกฎหมาย',

    confusion_title: 'อย่าสับสนกับสิ่งเหล่านี้',
    confusion_sub: 'มีผลิตภัณฑ์สี่อย่างที่ไม่เกี่ยวข้องกับเราแต่ใช้ชื่อคล้ายกัน การค้นหาคำว่า "Thai Helper" จะพบสิ่งเหล่านี้',
    conf1: 'แอปเรียนภาษา Thai Helper บน iOS และ Android ที่สอนคำศัพท์และการออกเสียงภาษาไทย',
    conf2: 'thai-helper.com (มีขีดกลาง ลงท้าย .com) บริการด้านวีซ่า การย้ายถิ่นฐาน และช่วยเหลือนักท่องเที่ยว ซึ่งไม่เกี่ยวข้องกับเรา',
    conf3: 'ThaiFriendly (thaifriendly.com) เว็บไซต์หาคู่',
    conf4: 'แอป Thai TDAC Arrival Card Helper ซึ่งเป็นเครื่องมือกรอกบัตรขาเข้าสำหรับนักท่องเที่ยว',
    conf_us: 'เราคือ thaihelper.app สำหรับการจ้างพนักงานในบ้านเท่านั้น',

    angles_title: 'ประเด็นข่าวที่เราช่วยได้',
    angles_sub: 'เรายินดีให้ข้อมูล บริบท หรือให้สัมภาษณ์ในทุกประเด็นเหล่านี้ และสามารถให้สิทธิ์เผยแพร่ก่อนใครได้ เพียงแจ้งความประสงค์',
    ang1_h: 'ค่าจ้างพนักงานในบ้านในประเทศไทยอยู่ที่เท่าไรจริงๆ',
    ang1_p: 'เรามีข้อมูลค่าจ้างที่คาดหวังจากทุกโปรไฟล์ที่ยืนยันแล้ว แยกตามจังหวัด ประเภทงาน ประสบการณ์ และสัญชาติ เรายินดีจัดทำบทวิเคราะห์พร้อมกราฟให้คุณโดยไม่คิดค่าใช้จ่าย',
    ang2_h: 'ใครทำงานในบ้านคนไทยได้อย่างถูกกฎหมาย และใครทำไม่ได้',
    ang2_p: 'ในทางปฏิบัติมีเพียงไม่กี่สัญชาติที่มีช่องทางถูกกฎหมายในการทำงานบ้านส่วนบุคคล และงานขับรถปิดสำหรับคนต่างชาติทั้งหมด ครอบครัวจำนวนมากเพิ่งรู้เรื่องนี้หลังจ้างงานไปแล้ว เรามีตัวเลขว่าความเข้าใจผิดนี้แพร่หลายเพียงใด',
    ang3_h: 'กลโกงที่พุ่งเป้าไปที่คนทำงานบ้าน',
    ang3_p: 'นายจ้างปลอม คนแอบอ้างเป็นฝ่ายสนับสนุน การขอสำเนาหนังสือเดินทาง เรามีกรณีที่บันทึกไว้ ข้อมูลการกำกับดูแลเบื้องหลัง และคำแนะนำที่ใช้ได้จริงสำหรับผู้อ่าน',
    ang4_h: 'ครอบครัวที่ลงมือสร้างสิ่งที่ตนเองต้องการ',
    ang4_p: 'เรื่องราวของผู้ก่อตั้ง การย้ายประเทศพร้อมลูกสองคน การค้นหาที่ไร้ผลนานหลายสัปดาห์ และการตัดสินใจสร้างแพลตฟอร์มแทนที่จะยอมแพ้ ให้สัมภาษณ์ได้ทั้งภาษาอังกฤษและภาษาเยอรมัน',

    about_title: 'ความเป็นมา',
    about_p1: 'ThaiHelper สร้างโดยครอบครัวสี่คนที่ย้ายจากยุโรปมาประเทศไทยในเดือนธันวาคม 2024 เช่นเดียวกับครอบครัวต่างชาติที่มีลูกส่วนใหญ่ สิ่งแรกๆ ที่พวกเขาต้องการคือพี่เลี้ยงเด็ก และการหาพี่เลี้ยงสักคนกินเวลาหลายสัปดาห์ไปกับกระทู้เฟซบุ๊กที่วุ่นวายและคำถามถึงบริษัทจัดหางานที่ไม่เคยได้รับคำตอบ',
    about_p2: 'ความยากลำบากแบบเดียวกันเกิดขึ้นซ้ำอีกตอนที่พวกเขาหาคนสวนและติวเตอร์ แทนที่จะยอมแพ้ พวกเขาจึงสร้างแพลตฟอร์มที่ตนเองตามหามาตลอด เปิดให้บริการเมื่อเดือนเมษายน 2026 และใช้งานฟรีสำหรับทุกคน',
    about_more: 'อ่านเรื่องราวทั้งหมด',

    assets_title: 'ไฟล์แบรนด์',
    assets_sub: 'ใช้ได้ฟรีในการรายงานข่าวเกี่ยวกับ ThaiHelper กรุณาอย่าดัดแปลงโลโก้หรือเปลี่ยนสี',
    asset_logo: 'โลโก้ (SVG)',
    asset_icon: 'ไอคอนแอป (PNG, 512px)',
    asset_og: 'ภาพตัวอย่าง (JPG)',
    asset_download: 'ดาวน์โหลด',
    colors_title: 'สีประจำแบรนด์',
    color_primary: 'เขียวน้ำทะเล',
    color_navy: 'น้ำเงินเข้ม',
    color_gold: 'ทอง',
    assets_name_h: 'วิธีเขียนชื่อของเรา',
    assets_name_p: 'เขียนติดกันเป็นคำเดียว ใช้ T และ H ตัวใหญ่: ThaiHelper ไม่ใช่ "Thai Helper" ไม่ใช่ "Thaihelper" และไม่ใช่ "THAIHELPER" โดเมนคือ thaihelper.app',

    contact_title: 'ติดต่อฝ่ายสื่อสาร',
    contact_p: 'ไม่ว่าจะเป็นคำถาม การขอสัมภาษณ์ การตรวจสอบข้อเท็จจริง หรือต้องการตัวเลขอย่างเร่งด่วน เขียนถึงเราแล้วคุณจะได้รับคำตอบภายในหนึ่งวันทำการ',
    contact_langs: 'ให้สัมภาษณ์และตอบเป็นลายลักษณ์อักษรได้ทั้งภาษาอังกฤษและภาษาเยอรมัน',
    contact_btn: 'ส่งอีเมลถึงเรา',

    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_product: 'ผลิตภัณฑ์', footer_find: 'ประโยชน์', footer_hire: 'หมวดหมู่', footer_employers: 'สำหรับครอบครัว',
    footer_company: 'บริษัท', footer_contact: 'ติดต่อ', footer_line: 'LINE', footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย', footer_press: 'สำหรับสื่อมวลชน',
    footer_legal: 'กฎหมาย', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'ข้อกำหนดการให้บริการ',
    footer_disclaimer: 'ThaiHelper.app ใช้งานฟรี เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางาน การปฏิบัติตามกฎหมายแรงงานและกฎหมายตรวจคนเข้าเมืองของไทยเป็นความรับผิดชอบของผู้ใช้แต่เพียงผู้เดียว',
  },
};

const NATIONALITY_LABELS = {
  thai:        { en: 'Thai',        th: 'ไทย' },
  myanmar:     { en: 'Myanmar',     th: 'เมียนมา' },
  philippines: { en: 'Philippines', th: 'ฟิลิปปินส์' },
  indian:      { en: 'Indian',      th: 'อินเดีย' },
  nepali:      { en: 'Nepali',      th: 'เนปาล' },
  vietnamese:  { en: 'Vietnamese',  th: 'เวียดนาม' },
  cambodian:   { en: 'Cambodian',   th: 'กัมพูชา' },
  lao:         { en: 'Lao',         th: 'ลาว' },
  other_asian: { en: 'Other Asian', th: 'เอเชียอื่นๆ' },
};

function formatNumber(n, lang) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat(lang === 'th' ? 'th-TH' : 'en-US').format(n);
}

function formatDate(iso, lang) {
  if (!iso) return '';
  // th-TH defaults to the Buddhist era (2569), but every other year on the
  // site — "April 2026" right next to it in this very grid — is written CE.
  // Pin the Gregorian calendar so the two never disagree on one screen.
  return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH-u-ca-gregory' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso));
}

/** Copy-to-clipboard button. Journalists paste boilerplate; make that one click. */
function CopyButton({ text, labelCopy, labelCopied }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          /* Clipboard blocked (http, old browser) — the text is selectable anyway. */
        }
      }}
      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
        done ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {done ? labelCopied : labelCopy}
    </button>
  );
}

/** A labelled count, used for the city / role / nationality breakdowns. */
function BreakdownTable({ title, rows, total, countLabel, lang }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-base font-bold font-headline text-on-background mb-4">{title}</h3>
      <table className="w-full text-sm">
        <caption className="sr-only">{`${title} — ${countLabel}`}</caption>
        <tbody>
          {rows.map(([key, label, value]) => (
            <tr key={key} className="border-b border-slate-100 last:border-0">
              <th scope="row" className="py-2 pr-3 text-left font-medium text-on-surface-variant">{label}</th>
              <td className="py-2 w-full">
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${total ? Math.max(2, Math.round((value / total) * 100)) : 0}%` }}
                  />
                </div>
              </td>
              <td className="py-2 pl-3 text-right font-bold tabular-nums text-on-background">
                {formatNumber(value, lang)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Press({ facts }) {
  const { lang } = useLang();
  const t = T[lang] || T.en;

  const boilerplates = [
    { h: t.boiler_short_h, text: t.boiler_short },
    { h: t.boiler_mid_h,   text: t.boiler_mid },
    { h: t.boiler_long_h,  text: t.boiler_long },
  ];

  const keyFigures = facts ? [
    { label: t.fact_helpers,       value: formatNumber(facts.helpers, lang) },
    { label: t.fact_families,      value: formatNumber(facts.families, lang) },
    { label: t.fact_conversations, value: formatNumber(facts.conversations, lang) },
    { label: t.fact_messages,      value: formatNumber(facts.messages, lang) },
    { label: t.fact_cities,        value: formatNumber(facts.cities, lang) },
    { label: t.fact_new30,         value: formatNumber(facts.newLast30, lang) },
    { label: t.fact_hires,         value: formatNumber(facts.hires, lang), note: t.fact_hires_note },
    { label: t.fact_founded,       value: t.fact_founded_val },
  ] : [];

  const label = (map, key) => (map[key] ? map[key][lang === 'th' ? 'th' : 'en'] : null);

  const cityRows = (facts?.topCities || []).map(([slug, n]) => [slug, cityLabel(slug), n]);
  const roleRows = (facts?.topRoles || []).map(([slug, n]) => [slug, roleLabel(slug, lang), n]);
  const natRows  = (facts?.topNationalities || []).map(([slug, n]) => [
    slug, label(NATIONALITY_LABELS, slug) || t.break_other, n,
  ]);

  const navItems = [
    { href: '/employers',          label: t.nav_employers },
    { href: '/helpers',            label: t.nav_browse_helpers },
    { href: '/work-permit-wizard', label: t.nav_wizard },
    { href: '/directory',          label: t.nav_directory },
    { href: '/faq',                label: t.nav_faq_link },
    { href: '/blog',               label: t.nav_blog },
  ];

  const mailto = `mailto:${PRESS_EMAIL}?subject=${encodeURIComponent('Press enquiry — ThaiHelper')}`;

  return (
    <>
      <SEOHead
        title={t.page_title}
        description={t.meta_desc}
        path="/press"
        lang={lang}
        jsonLd={[
          getOrganizationSchema(),
          getBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Press', path: '/press' },
          ]),
        ]}
      />

      <div className="min-h-screen bg-background text-on-background font-sans">
        {/* UTILITY TOP BAR — audience switch */}
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

        {/* NAV — mirrors landing page */}
        <nav className="fixed top-9 md:top-11 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="text-xl md:text-2xl font-bold font-headline">
              <span>Thai</span><span style={{ color: '#006a62' }}>Helper</span>
            </Link>
          </div>
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
        </nav>

        <main className="pt-24 md:pt-28">
          {/* HERO */}
          <section className="px-6 pt-10 pb-8 md:pt-16 md:pb-12">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                {t.hero_eyebrow}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-on-background mb-4 leading-tight">
                {t.hero_h1}
              </h1>
              <p className="text-base md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-7">
                {t.hero_sub}
              </p>
              <a
                href={mailto}
                className="inline-block px-7 py-3 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
              >
                {t.hero_cta}
              </a>
            </div>
          </section>

          {/* LIVE FACTSHEET */}
          <section className="px-6 py-14 bg-surface-container-low">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline mb-2">{t.facts_title}</h2>
              {facts ? (
                <p className="text-sm text-on-surface-variant mb-8">
                  {t.facts_sub} {formatDate(facts.generatedAt, lang)}
                </p>
              ) : (
                <p className="text-sm text-on-surface-variant mb-8">{t.facts_unavailable}</p>
              )}

              {facts && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {keyFigures.map((f) => (
                      <div key={f.label} className="bg-white rounded-2xl border border-slate-200 p-5">
                        <div className="font-headline font-extrabold text-primary leading-none tabular-nums text-2xl md:text-3xl">
                          {f.value}
                        </div>
                        <div className="text-xs md:text-sm text-on-surface-variant mt-2 font-medium leading-snug">
                          {f.label}
                        </div>
                        {f.note && (
                          <div className="text-[11px] text-on-surface-variant/70 mt-1 leading-snug">{f.note}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <BreakdownTable title={t.break_cities} rows={cityRows} total={facts.helpers} countLabel={t.break_col_count} lang={lang} />
                    <BreakdownTable title={t.break_categories} rows={roleRows} total={facts.helpers} countLabel={t.break_col_count} lang={lang} />
                    <BreakdownTable title={t.break_nationalities} rows={natRows} total={facts.helpers} countLabel={t.break_col_count} lang={lang} />
                  </div>
                  <p className="text-xs text-on-surface-variant mt-4">{t.break_note}</p>
                </>
              )}
            </div>
          </section>

          {/* BOILERPLATE */}
          <section className="px-6 py-14">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline mb-2">{t.boiler_title}</h2>
              <p className="text-sm text-on-surface-variant mb-8">{t.boiler_sub}</p>
              <div className="space-y-4">
                {boilerplates.map((b) => (
                  <div key={b.h} className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant pt-1">
                        {b.h}
                      </h3>
                      <CopyButton text={b.text} labelCopy={t.boiler_copy} labelCopied={t.boiler_copied} />
                    </div>
                    <p className="text-base text-on-background leading-relaxed">{b.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ACCURACY — the things we are most often got wrong about */}
          <section className="px-6 py-14 bg-surface-container-low">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline mb-2">{t.accurate_title}</h2>
              <p className="text-sm text-on-surface-variant mb-8 max-w-2xl">{t.accurate_sub}</p>
              <div className="space-y-4">
                {[
                  { h: t.acc1_h, p: t.acc1_p },
                  { h: t.acc2_h, p: t.acc2_p },
                  { h: t.acc3_h, p: t.acc3_p },
                  {
                    h: t.acc4_h,
                    p: t.acc4_p,
                    links: [
                      { href: '/work-permit-wizard', label: t.acc_wizard },
                      { href: '/legal', label: t.acc_legal },
                    ],
                  },
                ].map((item) => (
                  <div key={item.h} className="bg-white rounded-2xl border-l-4 border-l-primary border border-slate-200 p-6">
                    <h3 className="text-base md:text-lg font-bold font-headline text-on-background mb-2">{item.h}</h3>
                    <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">{item.p}</p>
                    {item.links && (
                      <div className="flex flex-wrap gap-4 mt-3">
                        {item.links.map((l) => (
                          <Link key={l.href} href={l.href} className="text-sm font-semibold text-primary hover:underline">
                            {l.label} →
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Name disambiguation — four unrelated products share the name. */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-4">
                <h3 className="text-base md:text-lg font-bold font-headline text-on-background mb-1">
                  {t.confusion_title}
                </h3>
                <p className="text-sm text-on-surface-variant mb-4">{t.confusion_sub}</p>
                <ul className="space-y-2 mb-4">
                  {[t.conf1, t.conf2, t.conf3, t.conf4].map((c, i) => (
                    <li key={i} className="flex gap-3 text-sm text-on-surface-variant leading-relaxed">
                      <span aria-hidden="true" className="text-slate-300 shrink-0">—</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-semibold text-primary">{t.conf_us}</p>
              </div>
            </div>
          </section>

          {/* STORY ANGLES */}
          <section className="px-6 py-14">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline mb-2">{t.angles_title}</h2>
              <p className="text-sm text-on-surface-variant mb-8 max-w-2xl">{t.angles_sub}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { h: t.ang1_h, p: t.ang1_p },
                  { h: t.ang2_h, p: t.ang2_p },
                  { h: t.ang3_h, p: t.ang3_p },
                  { h: t.ang4_h, p: t.ang4_p },
                ].map((a) => (
                  <div key={a.h} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7 hover:border-primary/30 hover:shadow-md transition-all">
                    <h3 className="text-lg font-bold font-headline text-on-background mb-2">{a.h}</h3>
                    <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">{a.p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* BACKGROUND */}
          <section className="px-6 py-14 bg-surface-container-low">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline mb-6">{t.about_title}</h2>
              <div className="space-y-4 text-base md:text-lg text-on-surface-variant leading-relaxed">
                <p>{t.about_p1}</p>
                <p>{t.about_p2}</p>
              </div>
              <Link href="/about" className="inline-block mt-5 text-sm font-semibold text-primary hover:underline">
                {t.about_more} →
              </Link>
            </div>
          </section>

          {/* BRAND ASSETS */}
          <section className="px-6 py-14">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline mb-2">{t.assets_title}</h2>
              <p className="text-sm text-on-surface-variant mb-8">{t.assets_sub}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { href: '/icon.svg',    label: t.asset_logo },
                  { href: '/icon-512.png', label: t.asset_icon },
                  { href: '/og-image.jpg', label: t.asset_og },
                ].map((a) => (
                  <div key={a.href} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
                    <div className="h-20 flex items-center justify-center mb-4 rounded-xl bg-surface-container-low">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.href} alt="" className="max-h-16 max-w-[80%] object-contain" />
                    </div>
                    <div className="text-sm font-semibold text-on-background mb-3">{a.label}</div>
                    <a
                      href={a.href}
                      download
                      className="mt-auto text-sm font-semibold text-primary hover:underline"
                    >
                      {t.asset_download} →
                    </a>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-base font-bold font-headline mb-4">{t.colors_title}</h3>
                  <ul className="space-y-3">
                    {[
                      { hex: '#006a62', name: t.color_primary },
                      { hex: '#1B3A4B', name: t.color_navy },
                      { hex: '#F4A261', name: t.color_gold },
                    ].map((c) => (
                      <li key={c.hex} className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="w-9 h-9 rounded-lg border border-slate-200 shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-sm text-on-surface-variant">{c.name}</span>
                        <code className="ml-auto text-xs font-mono text-on-background bg-slate-100 px-2 py-1 rounded">
                          {c.hex}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-base font-bold font-headline mb-3">{t.assets_name_h}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{t.assets_name_p}</p>
                  <BrandWordmark href={null} size="lg" />
                </div>
              </div>
            </div>
          </section>

          {/* PRESS CONTACT */}
          <section className="px-6 py-20 bg-gradient-to-br from-primary/5 to-primary-container/10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold font-headline mb-4">{t.contact_title}</h2>
              <p className="text-on-surface-variant mb-3">{t.contact_p}</p>
              <p className="text-sm text-on-surface-variant mb-8">{t.contact_langs}</p>
              <a
                href={mailto}
                className="inline-block px-8 py-3.5 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white font-bold text-base shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
              >
                {t.contact_btn}
              </a>
              <p className="mt-5">
                <a href={mailto} className="text-sm font-semibold text-primary hover:underline">
                  {PRESS_EMAIL}
                </a>
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
                    <li><Link className="text-slate-500 hover:text-primary text-sm" href="/#benefits">{t.footer_find}</Link></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm" href="/#categories">{t.footer_hire}</Link></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm" href="/employers">{t.footer_employers}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_company}</h4>
                  <ul className="space-y-3">
                    <li><a className="text-slate-500 hover:text-primary text-sm" href={`mailto:${PRESS_EMAIL}`}>{t.footer_contact}</a></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm" href="/about">{t.footer_about}</Link></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm" href="/press">{t.footer_press}</Link></li>
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

/**
 * Journalists check numbers, and a press kit that quotes a figure the site
 * itself contradicts is worse than no figure at all. So the factsheet is
 * rendered server-side from the database and revalidated hourly: the counts
 * sit in the HTML, which also means crawlers and AI engines read them without
 * running any JavaScript.
 *
 * Every failure mode degrades to `facts: null` and a "write to us" note
 * rather than taking the page down — a build must never fail because a count
 * query timed out.
 */
export async function getStaticProps() {
  let facts = null;

  try {
    const supabase = getServiceSupabase();

    const headCount = async (table, apply) => {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });
      if (apply) query = apply(query);
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    };

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [helpers, families, conversations, messages, helpers30, families30] = await Promise.all([
      headCount('helper_profiles',   (q) => q.eq('email_verified', true)),
      headCount('employer_accounts', (q) => q.eq('email_verified', true)),
      headCount('conversations'),
      headCount('messages'),
      headCount('helper_profiles',   (q) => q.eq('email_verified', true).gte('created_at', since30)),
      headCount('employer_accounts', (q) => q.eq('email_verified', true).gte('created_at', since30)),
    ]);

    // Confirmed hires live in their own table and only exist once a family
    // says so — treat a missing table as "no figure" rather than an error.
    let hires = 0;
    try {
      hires = await headCount('hiring_outcomes');
    } catch {
      hires = 0;
    }

    // Breakdowns need the rows themselves. Past 1000 verified helpers a bare
    // .select() silently drops the oldest — see selectAll() in lib/supabase.js.
    const { data: rows, error: rowsError } = await selectAll(() =>
      supabase
        .from('helper_profiles')
        .select('city, category, nationality')
        .eq('email_verified', true)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
    );
    if (rowsError) throw rowsError;

    const tally = (list) => list.reduce((acc, key) => {
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const top = (counts, n) => Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, n);

    // "other" is the catch-all a helper picks when their town is not in the
    // list. It is a real answer, but it is not a city — ranked second it
    // would read as one, so it stays out of the city table and its count.
    const cityCounts = tally(rows.map((r) => (r.city === 'other' ? null : r.city)));
    // A helper can register for several roles, stored comma-separated
    // ("nanny, housekeeper"). Counting the raw string would invent a
    // "nanny, housekeeper" category, so split and count each role.
    const roleCounts = tally(rows.flatMap((r) => String(r.category || '').split(',').map((s) => s.trim())));
    // "prefer_not_say" is an answer about privacy, not a nationality, so it
    // is left out rather than published as a group.
    const natCounts = tally(rows.map((r) => (r.nationality === 'prefer_not_say' ? null : r.nationality)));

    facts = {
      helpers,
      families,
      conversations,
      messages,
      hires,
      newLast30: helpers30 + families30,
      cities: Object.keys(cityCounts).length,
      topCities: top(cityCounts, 8),
      topRoles: top(roleCounts, 8),
      topNationalities: top(natCounts, 6),
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[press] factsheet unavailable:', err);
  }

  return { props: { facts }, revalidate: 3600 };
}
