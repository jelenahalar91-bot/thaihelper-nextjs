import { useState } from 'react';
import Link from 'next/link';
import BrandWordmark from '@/components/BrandWordmark';
import { FileText, Download, Printer, ChevronRight, Languages } from 'lucide-react';
import SEOHead, { getBreadcrumbSchema, getOrganizationSchema, getFAQSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu, ResourcesDropdown } from '@/components/MobileMenu';
import { useLang } from './_app';

/* ─────────── Contract Text (bilingual) ─────────── */
// Kept as a constant so the same text is rendered on-page AND served as
// the .docx download. Source of truth for both.

const CONTRACT_EN = `EMPLOYMENT AGREEMENT

This Agreement is made on [DATE] between:

EMPLOYER:
Full name: [EMPLOYER NAME]
ID Card / Passport No.: [NUMBER]
Address: [FULL ADDRESS]
Phone: [PHONE]

EMPLOYEE:
Full name: [HELPER NAME]
ID Card / Passport No.: [NUMBER]
Address: [FULL ADDRESS]
Phone: [PHONE]

1. POSITION & START DATE
The Employee is engaged as a [Nanny / Housekeeper / Cook / Driver / Caregiver / Gardener] starting [DATE]. This Agreement is for an indefinite period.

2. DUTIES
The Employee shall perform the following duties (specify clearly):
- [List duty 1]
- [List duty 2]
- [List duty 3]

Duties NOT included: [List anything explicitly excluded]

3. WORKING HOURS
Working days: [Monday to Saturday]
Working hours: [08:00 to 17:00] with a [1-hour] lunch break
Weekly rest day: [Sunday] (at least one full day per week as required by Ministerial Regulation No. 14, B.E. 2555)

4. SALARY & PAYMENT
Monthly salary: [AMOUNT] THB
Payment date: [Last day of each calendar month]
Payment method: [Bank transfer / Cash]
Overtime: 1.5 x hourly rate for hours worked beyond the schedule above, with the Employee's prior agreement.
13th-month bonus (if applicable): [AMOUNT or "one month's salary, paid each December"]

5. LEAVE
Annual leave: [6 to 12] paid days per year after one full year of service.
Sick leave: Up to 30 paid days per year (medical certificate required for 3+ consecutive days).
Public holidays: 13 paid public holidays as observed in Thailand.
Personal / emergency leave: [State policy]

6. SOCIAL SECURITY (Section 33)
The Employer shall register the Employee under the Thai Social Security Act (Section 33) and contribute 5% of monthly salary; the Employee also contributes 5%, deducted from salary. Coverage includes medical care, maternity, disability and pension.

7. ACCOMMODATION & MEALS (Live-in only)
[ ] Live-in: Private room provided, three meals per day included.
[ ] Live-out: Not applicable.

8. CONFIDENTIALITY
The Employee agrees to keep confidential all personal and family information of the Employer's household, both during and after employment.

9. TERMINATION
Either party may terminate this Agreement with 30 days' written notice. Severance pay applies per the Thai Labour Protection Act:
- 120 days to 1 year of service: 30 days' salary
- 1 to 3 years: 90 days' salary
- 3 to 6 years: 180 days' salary
- 6 to 10 years: 240 days' salary
- 10 years or more: 300 days' salary

Immediate termination without severance is permitted only for serious misconduct (theft, violence, gross negligence, repeated breach of duty after written warning) per Section 119 of the Labour Protection Act.

10. GOVERNING LAW
This Agreement is governed by the laws of the Kingdom of Thailand, including Ministerial Regulation No. 14 (B.E. 2555) on domestic workers.

SIGNATURES

Employer: ________________________________   Date: ______________

Employee: ________________________________   Date: ______________

Witness:  ________________________________   Date: ______________
`;

const CONTRACT_TH = `สัญญาจ้างงาน

สัญญาฉบับนี้ทำขึ้นเมื่อวันที่ [วันที่] ระหว่าง:

นายจ้าง:
ชื่อ-นามสกุล: [ชื่อนายจ้าง]
บัตรประชาชน / หนังสือเดินทาง: [หมายเลข]
ที่อยู่: [ที่อยู่เต็ม]
โทรศัพท์: [เบอร์โทร]

ลูกจ้าง:
ชื่อ-นามสกุล: [ชื่อผู้ช่วย]
บัตรประชาชน / หนังสือเดินทาง: [หมายเลข]
ที่อยู่: [ที่อยู่เต็ม]
โทรศัพท์: [เบอร์โทร]

1. ตำแหน่งและวันเริ่มงาน
ลูกจ้างได้รับการจ้างเป็น [พี่เลี้ยงเด็ก / แม่บ้าน / แม่ครัว / คนขับรถ / ผู้ดูแล / คนสวน] เริ่มตั้งแต่วันที่ [วันที่] สัญญาฉบับนี้ไม่มีกำหนดระยะเวลา

2. หน้าที่
ลูกจ้างจะปฏิบัติหน้าที่ดังต่อไปนี้ (ระบุให้ชัดเจน):
- [หน้าที่ที่ 1]
- [หน้าที่ที่ 2]
- [หน้าที่ที่ 3]

หน้าที่ที่ไม่รวม: [ระบุสิ่งที่ไม่รวมอย่างชัดเจน]

3. เวลาทำงาน
วันทำงาน: [จันทร์ - เสาร์]
เวลาทำงาน: [08:00 - 17:00] พักกลางวัน [1 ชั่วโมง]
วันหยุดประจำสัปดาห์: [วันอาทิตย์] (อย่างน้อย 1 วันเต็มต่อสัปดาห์ ตามกฎกระทรวงฉบับที่ 14 พ.ศ. 2555)

4. เงินเดือนและการจ่ายเงิน
เงินเดือนรายเดือน: [จำนวน] บาท
วันจ่ายเงินเดือน: [วันสุดท้ายของเดือน]
วิธีการจ่าย: [โอนธนาคาร / เงินสด]
ค่าล่วงเวลา: 1.5 เท่าของอัตราชั่วโมงปกติสำหรับการทำงานนอกเวลา โดยลูกจ้างยินยอมล่วงหน้า
โบนัสประจำปี (ถ้ามี): [จำนวน หรือ "เงินเดือน 1 เดือน จ่ายในเดือนธันวาคม"]

5. วันลา
วันลาพักร้อน: [6 ถึง 12] วันต่อปี หลังทำงานครบ 1 ปีเต็ม
วันลาป่วย: สูงสุด 30 วันต่อปี โดยได้รับค่าจ้าง (ต้องมีใบรับรองแพทย์หากลาเกิน 3 วันติดต่อกัน)
วันหยุดนักขัตฤกษ์: 13 วันต่อปี ตามที่ประเทศไทยกำหนด
วันลากิจ / ลาฉุกเฉิน: [ระบุนโยบาย]

6. ประกันสังคม (มาตรา 33)
นายจ้างจะขึ้นทะเบียนลูกจ้างตามพระราชบัญญัติประกันสังคม (มาตรา 33) และสมทบ 5% ของเงินเดือน ลูกจ้างสมทบ 5% หักจากเงินเดือน ครอบคลุมค่ารักษาพยาบาล การคลอดบุตร ทุพพลภาพ และบำนาญ

7. ที่พักและอาหาร (เฉพาะลูกจ้างที่พักอาศัย)
[ ] พักอาศัย: มีห้องส่วนตัว อาหาร 3 มื้อต่อวัน
[ ] ไม่พักอาศัย: ไม่เกี่ยวข้อง

8. การรักษาความลับ
ลูกจ้างตกลงรักษาความลับเกี่ยวกับข้อมูลส่วนบุคคลและข้อมูลครอบครัวของนายจ้าง ทั้งในระหว่างและหลังการจ้างงาน

9. การเลิกจ้าง
ฝ่ายใดฝ่ายหนึ่งสามารถยกเลิกสัญญาได้โดยแจ้งเป็นลายลักษณ์อักษรล่วงหน้า 30 วัน ค่าชดเชยเป็นไปตามพระราชบัญญัติคุ้มครองแรงงาน:
- 120 วัน - 1 ปี: ค่าจ้าง 30 วัน
- 1 - 3 ปี: ค่าจ้าง 90 วัน
- 3 - 6 ปี: ค่าจ้าง 180 วัน
- 6 - 10 ปี: ค่าจ้าง 240 วัน
- 10 ปีขึ้นไป: ค่าจ้าง 300 วัน

การเลิกจ้างทันทีโดยไม่มีค่าชดเชย อนุญาตเฉพาะกรณีประพฤติมิชอบร้ายแรง (ลักทรัพย์ ใช้ความรุนแรง ประมาทเลินเล่ออย่างร้ายแรง การละเลยหน้าที่ซ้ำหลังได้รับคำเตือนเป็นลายลักษณ์อักษร) ตามมาตรา 119 ของพระราชบัญญัติคุ้มครองแรงงาน

10. กฎหมายที่ใช้บังคับ
สัญญาฉบับนี้อยู่ภายใต้กฎหมายของราชอาณาจักรไทย รวมถึงกฎกระทรวงฉบับที่ 14 (พ.ศ. 2555) ว่าด้วยลูกจ้างทำงานบ้าน

ลายเซ็น

นายจ้าง: ________________________________   วันที่: ______________

ลูกจ้าง: ________________________________   วันที่: ______________

พยาน:   ________________________________   วันที่: ______________
`;

/* ─────────── FAQ schema ─────────── */
const FAQS = [
  {
    question: 'Is a written employment contract legally required for a nanny or maid in Thailand?',
    answer: 'A written contract is not strictly required for domestic workers in Thailand, but it is strongly recommended. Domestic workers are covered by Ministerial Regulation No. 14 (B.E. 2555) under the Labour Protection Act. A written agreement protects both employer and employee in case of disputes about salary, duties, leave or termination.',
  },
  {
    question: 'What should a Thai nanny contract include?',
    answer: 'A complete nanny employment contract in Thailand should include: full names and ID/passport numbers of both parties, position and start date, specific duties, working hours, weekly rest day, monthly salary and payment terms, overtime rate, annual leave, sick leave, public holidays, Social Security registration (Section 33), termination notice period, severance pay rights per the Labour Protection Act, and signatures with date.',
  },
  {
    question: 'How much notice is required to fire a nanny in Thailand?',
    answer: 'Standard notice is 30 days written notice from either party. Severance pay scales with length of service: 30 days pay for 120 days–1 year, 90 days for 1–3 years, 180 days for 3–6 years, 240 days for 6–10 years, 300 days for 10+ years. Immediate dismissal without severance is permitted only for serious misconduct (theft, violence, gross negligence) under Section 119 of the Labour Protection Act.',
  },
  {
    question: 'Do I have to register my helper for Social Security in Thailand?',
    answer: 'Yes, for full-time domestic workers. Employers must register the helper under Section 33 of the Social Security Act and contribute 5% of monthly salary; the helper also contributes 5% (deducted from salary). This covers medical care, maternity, disability and pension benefits.',
  },
  {
    question: 'Is this contract template free to use?',
    answer: 'Yes, completely free. Download the .docx file or print directly from your browser. The template is provided for informational purposes; for complex cases (especially involving foreign workers from Myanmar, Laos or Cambodia) consult a Thai labour lawyer.',
  },
];

const T = {
  en: {
    page_title: 'Free Nanny & Maid Employment Contract Template Thailand (EN + TH)',
    meta_desc: 'Download a free bilingual employment contract template (English + Thai) for hiring a nanny, maid, housekeeper, cook, driver or caregiver in Thailand. Compliant with Thai labour law. .docx and print-friendly.',
    nav_employers: 'For Families',
    nav_helpers: 'For Helpers',
    nav_blog: 'Blog',
    nav_login: 'Login',
    nav_resources: 'Resources',
    nav_browse_helpers: 'Browse Helpers',
    nav_wizard: 'Work Permit Wizard',
    nav_directory: 'Expert Directory',
    nav_faq_link: 'FAQ',
    nav_about: 'About',
    nav_cta: 'Register – Free',

    hero_eyebrow: 'Free Lead-Magnet',
    hero_h1: 'Nanny & Maid Employment Contract Thailand',
    hero_sub: 'A free bilingual (English + Thai) employment contract template for hiring household staff in Thailand. Built around Ministerial Regulation No. 14 and the Labour Protection Act. Use it as-is or customise.',

    btn_download: 'Download .docx (English)',
    btn_download_th: 'Download .docx (Thai)',
    btn_print: 'Print / Save as PDF',
    lang_label: 'Preview language:',

    what_h: 'What it covers',
    what_items: [
      'Position, start date, and indefinite-term clause',
      'Specific duties (and what is explicitly NOT included)',
      'Working hours with mandatory weekly rest day (per MR No. 14)',
      'Salary, payment date, overtime rate, optional 13th-month bonus',
      'Annual leave, sick leave, 13 Thai public holidays',
      'Social Security Section 33 registration & contributions',
      'Live-in accommodation & meals (optional)',
      'Confidentiality clause',
      'Termination notice + severance scale per Labour Protection Act',
      'Section 119 immediate-dismissal grounds',
    ],

    legal_h: 'Legal basis',
    legal_p: 'Domestic workers in Thailand are covered by Ministerial Regulation No. 14 (B.E. 2555 / 2012) under the Labour Protection Act, plus Section 33 of the Social Security Act for full-time employees. This template references both. For workers from Myanmar, Laos, Cambodia or the Philippines, additional work-permit obligations apply — consult a Thai labour lawyer or our Work Permit Wizard.',

    disclaimer_h: 'Disclaimer',
    disclaimer_p: 'This template is provided for informational purposes only and does not constitute legal advice. For complex employment situations (especially involving foreign workers), consult a licensed Thai labour lawyer. ThaiHelper is not responsible for any loss arising from use of this template.',

    faq_title: 'Frequently asked questions',

    cta_h2: 'Need to find your next helper first?',
    cta_p: 'Browse hundreds of verified household-staff profiles across Thailand — free for both sides.',
    cta_btn_browse: 'Browse Helpers',
    cta_btn_emp: 'Register as a Family',

    related_h: 'Related guides',
    related_blog: 'Full guide: Why and how to use this contract',
    related_costs: 'Nanny costs in Thailand (2026)',
    related_law: 'Work permits for foreign helpers',

    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_product: 'Product', footer_find: 'Benefits', footer_hire: 'Categories', footer_pricing: 'Pricing', footer_employers: 'For Families',
    footer_company: 'Company', footer_contact: 'Contact', footer_line: 'LINE', footer_about: 'About', footer_faq: 'FAQ',
    footer_legal: 'Legal', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
    footer_disclaimer: 'ThaiHelper.app is free to use. We are not a recruitment agency and do not provide placement services. Compliance with Thai labor and immigration laws is the sole responsibility of the users.',
  },

  th: {
    page_title: 'แบบฟอร์มสัญญาจ้างพี่เลี้ยง/แม่บ้านฟรี (ไทย + อังกฤษ)',
    meta_desc: 'ดาวน์โหลดแบบฟอร์มสัญญาจ้างงานสองภาษา (อังกฤษ + ไทย) ฟรี สำหรับจ้างพี่เลี้ยง แม่บ้าน แม่ครัว คนขับรถ ผู้ดูแล ในประเทศไทย เป็นไปตามกฎหมายแรงงานไทย',
    nav_employers: 'สำหรับครอบครัว',
    nav_helpers: 'สำหรับผู้ช่วย',
    nav_blog: 'บล็อก',
    nav_resources: 'แหล่งข้อมูล',
    nav_browse_helpers: 'ดูผู้ช่วย',
    nav_wizard: 'ตัวช่วยใบอนุญาตทำงาน',
    nav_directory: 'รายชื่อผู้เชี่ยวชาญ',
    nav_faq_link: 'คำถามที่พบบ่อย',
    nav_about: 'เกี่ยวกับเรา',
    nav_login: 'เข้าสู่ระบบ',
    nav_cta: 'สมัคร – ฟรี',

    hero_eyebrow: 'ดาวน์โหลดฟรี',
    hero_h1: 'สัญญาจ้างพี่เลี้ยงและแม่บ้านในประเทศไทย',
    hero_sub: 'แบบฟอร์มสัญญาจ้างงานสองภาษา (อังกฤษ + ไทย) ฟรี สำหรับจ้างพนักงานในบ้าน ออกแบบตามกฎกระทรวงฉบับที่ 14 และพระราชบัญญัติคุ้มครองแรงงาน',

    btn_download: 'ดาวน์โหลด .docx (อังกฤษ)',
    btn_download_th: 'ดาวน์โหลด .docx (ไทย)',
    btn_print: 'พิมพ์ / บันทึกเป็น PDF',
    lang_label: 'ภาษาตัวอย่าง:',

    what_h: 'สิ่งที่ครอบคลุม',
    what_items: [
      'ตำแหน่ง วันเริ่มงาน และเงื่อนไขไม่มีกำหนด',
      'หน้าที่เฉพาะ (และสิ่งที่ไม่รวม)',
      'เวลาทำงานพร้อมวันหยุดประจำสัปดาห์ (ตามกฎกระทรวงฯ ที่ 14)',
      'เงินเดือน วันจ่าย ค่าล่วงเวลา โบนัสประจำปี',
      'วันลาพักร้อน วันลาป่วย วันหยุดนักขัตฤกษ์ 13 วัน',
      'การขึ้นทะเบียนประกันสังคมมาตรา 33',
      'ที่พักและอาหาร (เฉพาะลูกจ้างที่พักอาศัย)',
      'ข้อตกลงการรักษาความลับ',
      'การแจ้งเลิกจ้าง + ค่าชดเชยตามกฎหมาย',
      'เหตุเลิกจ้างทันทีตามมาตรา 119',
    ],

    legal_h: 'พื้นฐานทางกฎหมาย',
    legal_p: 'ลูกจ้างทำงานบ้านในประเทศไทยอยู่ภายใต้กฎกระทรวงฉบับที่ 14 (พ.ศ. 2555) ของพระราชบัญญัติคุ้มครองแรงงาน รวมถึงมาตรา 33 ของพระราชบัญญัติประกันสังคม สำหรับพนักงานเต็มเวลา แบบฟอร์มนี้อ้างอิงทั้งสอง สำหรับแรงงานจากเมียนมา ลาว กัมพูชา หรือฟิลิปปินส์ มีข้อผูกพันใบอนุญาตทำงานเพิ่มเติม ปรึกษาทนายความแรงงานไทย',

    disclaimer_h: 'ข้อจำกัดความรับผิดชอบ',
    disclaimer_p: 'แบบฟอร์มนี้จัดทำขึ้นเพื่อเป็นข้อมูลเท่านั้น ไม่ถือเป็นคำแนะนำทางกฎหมาย สำหรับสถานการณ์การจ้างงานที่ซับซ้อน (โดยเฉพาะที่เกี่ยวข้องกับแรงงานต่างชาติ) ปรึกษาทนายความแรงงานไทยที่มีใบอนุญาต ThaiHelper ไม่รับผิดชอบต่อความสูญเสียใดๆ ที่เกิดจากการใช้แบบฟอร์มนี้',

    faq_title: 'คำถามที่พบบ่อย',

    cta_h2: 'ต้องการหาผู้ช่วยก่อนหรือไม่?',
    cta_p: 'ดูโปรไฟล์พนักงานในบ้านที่ผ่านการยืนยันหลายร้อยคนทั่วประเทศไทย — ฟรีทั้งสองฝ่าย',
    cta_btn_browse: 'ดูผู้ช่วย',
    cta_btn_emp: 'สมัครเป็นครอบครัว',

    related_h: 'คู่มือที่เกี่ยวข้อง',
    related_blog: 'คู่มือเต็ม: ทำไมและวิธีใช้สัญญาฉบับนี้',
    related_costs: 'ค่าจ้างพี่เลี้ยงในประเทศไทย (2026)',
    related_law: 'ใบอนุญาตทำงานสำหรับผู้ช่วยต่างชาติ',

    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_product: 'ผลิตภัณฑ์', footer_find: 'ประโยชน์', footer_hire: 'หมวดหมู่', footer_pricing: 'ราคา', footer_employers: 'สำหรับครอบครัว',
    footer_company: 'บริษัท', footer_contact: 'ติดต่อ', footer_line: 'LINE', footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย',
    footer_legal: 'กฎหมาย', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'ข้อกำหนดการให้บริการ',
    footer_disclaimer: 'ThaiHelper.app ใช้งานฟรี เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางาน การปฏิบัติตามกฎหมายแรงงานและกฎหมายตรวจคนเข้าเมืองของไทยเป็นความรับผิดชอบของผู้ใช้แต่เพียงผู้เดียว',
  },
};

/* ─────────── Browser-side helpers ─────────── */

// Build a Word-compatible .doc using MS Office HTML — opens directly in
// Word, Pages, Google Docs and LibreOffice without any library.
function downloadDoc(text, filename) {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${filename}</title>
<style>body{font-family:'Sarabun','Calibri',sans-serif;font-size:11pt;line-height:1.55;white-space:pre-wrap;}h1{font-size:14pt;}</style>
</head><body><pre style="font-family:'Sarabun','Calibri',sans-serif;font-size:11pt;line-height:1.55;white-space:pre-wrap;">${text.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</pre></body></html>`;
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ─────────── Page ─────────── */

export default function ContractTemplate() {
  const { lang } = useLang();
  const t = T[lang] || T.en;
  const [preview, setPreview] = useState('en');

  return (
    <>
      <SEOHead
        title={t.page_title}
        description={t.meta_desc}
        path="/contract-template"
        lang={lang}
        jsonLd={[
          getBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Contract Template', path: '/contract-template' },
          ]),
          getOrganizationSchema(),
          getFAQSchema(FAQS),
        ]}
      />

      <style jsx global>{`
        @media print {
          nav, header, footer, .no-print { display: none !important; }
          main { padding: 0 !important; }
          .contract-preview { border: none !important; box-shadow: none !important; padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="min-h-screen bg-background text-on-background font-sans">
        {/* UTILITY TOP BAR */}
        <div className="fixed top-0 left-0 w-full bg-[#001b3d] text-white z-[60] no-print">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-2.5 flex justify-center md:justify-end items-center gap-5 md:gap-7 text-xs md:text-sm">
            <Link href="/employers" className="font-semibold hover:text-gold transition-colors whitespace-nowrap">
              {t.nav_employers} →
            </Link>
            <Link href="/helpers" className="font-semibold hover:text-gold transition-colors whitespace-nowrap">
              {t.nav_helpers} →
            </Link>
          </div>
        </div>

        {/* NAV */}
        <nav className="fixed top-9 md:top-11 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm no-print">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="text-xl md:text-2xl font-bold font-headline">
              <span>Thai</span><span style={{ color: '#006a62' }}>Helper</span>
            </Link>
          </div>
          {(() => {
            const navItems = [
              { href: '/employers',           label: t.nav_employers },
              { href: '/helpers',             label: t.nav_browse_helpers },
              { href: '/about',               label: t.nav_about },
              { href: '/faq',                 label: t.nav_faq_link },
              { href: '/blog',                label: t.nav_blog },
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
          <section className="px-6 pt-10 pb-8 md:pt-12 md:pb-10 no-print">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                <FileText className="w-4 h-4" />
                {t.hero_eyebrow}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-on-background mb-4 leading-tight">
                {t.hero_h1}
              </h1>
              <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                {t.hero_sub}
              </p>
            </div>
          </section>

          {/* DOWNLOAD BUTTONS */}
          <section className="px-6 pb-10 no-print">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-primary/5 to-primary-container/10 border border-primary/20 rounded-2xl p-6 md:p-8">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => downloadDoc(CONTRACT_EN, 'thaihelper-employment-contract-en.doc')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" /> {t.btn_download}
                  </button>
                  <button
                    onClick={() => downloadDoc(CONTRACT_TH, 'thaihelper-employment-contract-th.doc')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" /> {t.btn_download_th}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 text-on-background font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
                  >
                    <Printer className="w-4 h-4" /> {t.btn_print}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* WHAT IT COVERS */}
          <section className="px-6 pb-12 no-print">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-extrabold font-headline mb-4 flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-primary" />
                {t.what_h}
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm md:text-base text-on-surface-variant">
                {t.what_items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* CONTRACT PREVIEW */}
          <section className="px-6 pb-12">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-3 no-print">
                <Languages className="w-4 h-4 text-on-surface-variant" />
                <span className="text-sm text-on-surface-variant">{t.lang_label}</span>
                <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
                  <button
                    onClick={() => setPreview('en')}
                    className={`px-3 py-1.5 text-xs font-bold transition-colors ${preview === 'en' ? 'bg-primary text-white' : 'bg-white text-on-surface-variant hover:bg-slate-50'}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setPreview('th')}
                    className={`px-3 py-1.5 text-xs font-bold transition-colors ${preview === 'th' ? 'bg-primary text-white' : 'bg-white text-on-surface-variant hover:bg-slate-50'}`}
                  >
                    TH
                  </button>
                </div>
              </div>
              <pre className="contract-preview bg-white border border-slate-200 rounded-2xl p-6 md:p-10 whitespace-pre-wrap text-sm md:text-base leading-relaxed text-on-background font-mono shadow-sm overflow-x-auto">
{preview === 'en' ? CONTRACT_EN : CONTRACT_TH}
              </pre>
            </div>
          </section>

          {/* LEGAL BASIS */}
          <section className="px-6 py-12 bg-surface-container-low no-print">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl md:text-2xl font-extrabold font-headline mb-3">{t.legal_h}</h2>
              <p className="text-on-surface-variant leading-relaxed mb-6">{t.legal_p}</p>
              <h3 className="text-base font-bold font-headline mb-2">{t.disclaimer_h}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{t.disclaimer_p}</p>
            </div>
          </section>

          {/* FAQ */}
          <section className="px-6 py-12 no-print">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl md:text-2xl font-extrabold font-headline text-center mb-8">
                {t.faq_title}
              </h2>
              <div className="space-y-3">
                {FAQS.map((faq, i) => (
                  <details key={i} className="group bg-white rounded-xl border border-slate-200 p-5 open:shadow-md transition-all">
                    <summary className="font-bold text-on-background cursor-pointer list-none flex justify-between items-center gap-3">
                      <span>{faq.question}</span>
                      <span className="text-primary text-xl shrink-0 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="mt-3 text-sm md:text-base text-on-surface-variant leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* RELATED */}
          <section className="px-6 py-10 no-print">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">{t.related_h}</h3>
              <ul className="space-y-2">
                <li><Link href="/blog/employment-contract-template-thailand" className="text-primary hover:underline">→ {t.related_blog}</Link></li>
                <li><Link href="/blog/nanny-costs-thailand" className="text-primary hover:underline">→ {t.related_costs}</Link></li>
                <li><Link href="/blog/work-permits-foreign-helpers-thailand" className="text-primary hover:underline">→ {t.related_law}</Link></li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <section className="px-6 py-16 bg-gradient-to-br from-primary/5 to-primary-container/10 no-print">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline mb-3">{t.cta_h2}</h2>
              <p className="text-on-surface-variant mb-6">{t.cta_p}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/helpers"
                  className="inline-block px-7 py-3 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white font-bold text-base shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                  {t.cta_btn_browse}
                </Link>
                <Link
                  href="/employer-register"
                  className="inline-block px-7 py-3 rounded-2xl bg-white border-2 border-primary text-primary font-bold text-base hover:bg-primary/5 transition-colors"
                >
                  {t.cta_btn_emp}
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="w-full bg-slate-50 border-t border-slate-100 no-print">
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
                    <li><Link className="text-slate-500 hover:text-primary text-sm whitespace-nowrap" href="/#benefits">{t.footer_find}</Link></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm whitespace-nowrap" href="/#categories">{t.footer_hire}</Link></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm whitespace-nowrap" href="/employers">{t.footer_employers}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_company}</h4>
                  <ul className="space-y-3">
                    <li><a className="text-slate-500 hover:text-primary text-sm whitespace-nowrap" href="mailto:support@thaihelper.app">{t.footer_contact}</a></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm whitespace-nowrap" href="/about">{t.footer_about}</Link></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm whitespace-nowrap" href="/faq">{t.footer_faq}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_legal}</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-primary text-sm whitespace-nowrap" href="/privacy">{t.footer_privacy}</Link></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm whitespace-nowrap" href="/terms">{t.footer_terms}</Link></li>
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
