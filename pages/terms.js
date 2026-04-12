import SEOHead from '@/components/SEOHead';
import Link from 'next/link';
import LangSwitcher from '@/components/LangSwitcher';
import { useLang } from './_app';

const T = {
  en: {
    nav_employers: 'For Families',
    nav_helpers:   'For Helpers',
    nav_login:     'Login',
    nav_cta:       'Register – Free',
    title:         'Terms of Service',
    updated:       'Last updated: April 2026',
    back:          '← Back to Home',
    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_product: 'Product', footer_find: 'Benefits', footer_hire: 'Categories', footer_pricing: 'Pricing', footer_employers: 'For Families',
    footer_company: 'Company', footer_contact: 'Contact', footer_about: 'About', footer_faq: 'FAQ',
    footer_legal: 'Legal', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
    footer_disclaimer: 'ThaiHelper.app is a community connection platform and job board. We are not a recruitment agency and do not engage in placement services. We do not vet candidates, verify identities, or provide legal advice regarding work permits or visas. Compliance with the Thai Labor Act and immigration laws is the sole responsibility of the employer and the candidate.',
  },
  th: {
    nav_employers: 'สำหรับครอบครัว',
    nav_helpers:   'สำหรับผู้ช่วย',
    nav_login:     'เข้าสู่ระบบ',
    nav_cta:       'สมัคร – ฟรี',
    title:         'ข้อกำหนดการใช้บริการ',
    updated:       'อัปเดตล่าสุด: เมษายน 2569',
    back:          '← กลับหน้าแรก',
    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_product: 'ผลิตภัณฑ์', footer_find: 'ประโยชน์', footer_hire: 'หมวดหมู่', footer_pricing: 'ราคา', footer_employers: 'สำหรับครอบครัว',
    footer_company: 'บริษัท', footer_contact: 'ติดต่อ', footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย',
    footer_legal: 'กฎหมาย', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'ข้อกำหนดการใช้บริการ',
    footer_disclaimer: 'ThaiHelper.app เป็นแพลตฟอร์มเชื่อมต่อชุมชนและกระดานงาน เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางาน เราไม่ได้คัดกรองผู้สมัคร ยืนยันตัวตน หรือให้คำปรึกษาทางกฎหมายเกี่ยวกับใบอนุญาตทำงานหรือวีซ่า การปฏิบัติตามพระราชบัญญัติคุ้มครองแรงงานและกฎหมายตรวจคนเข้าเมืองเป็นความรับผิดชอบของนายจ้างและผู้สมัครแต่เพียงผู้เดียว',
  },
};

export default function Terms() {
  const { lang } = useLang();
  const t = T[lang] || T.en;

  return (
    <>
      <SEOHead
        title="Terms of Service"
        description="ThaiHelper terms of service. Read our terms and conditions for using the platform."
        path="/terms"
        lang={lang}
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
          <div className="flex items-center gap-2 md:gap-3">
            <Link className="text-xs md:text-sm font-semibold text-[#001b3d] hover:text-primary transition-colors" href="/login">
              {t.nav_login}
            </Link>
            <LangSwitcher />
            <Link
              className="px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs md:text-sm font-semibold hover:shadow-lg transition-all active:scale-95 duration-150"
              href="/employer-register"
            >
              {t.nav_cta}
            </Link>
          </div>
        </nav>

        {/* ── CONTENT ── */}
        <main className="pt-32 md:pt-36 pb-20" style={{ maxWidth: 760, margin: '0 auto', padding: '140px 24px 80px' }}>
          <Link href="/" style={{ color: 'var(--teal)', textDecoration: 'none', fontSize: 14 }}>{t.back}</Link>

          <h1 style={{ marginTop: 24, marginBottom: 8, color: 'var(--navy)', fontSize: 32 }}>{t.title}</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 40 }}>{t.updated}</p>

          {lang === 'en' ? <TermsEN /> : <TermsTH />}
        </main>

        {/* FOOTER */}
        <footer className="w-full bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto py-12 px-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="max-w-xs shrink-0">
                <div className="text-xl font-bold text-on-background mb-4 font-headline">Thai<span style={{color:"#006a62"}}>Helper</span></div>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{t.footer_desc}</p>
                <div className="flex gap-4">
                  <a aria-label="Email support" className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white transition-all" href="mailto:support@thaihelper.app">
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_product}</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/#benefits">{t.footer_find}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/#categories">{t.footer_hire}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/pricing">{t.footer_pricing}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/employers">{t.footer_employers}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_company}</h4>
                  <ul className="space-y-3">
                    <li><a className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="mailto:support@thaihelper.app">{t.footer_contact}</a></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/about">{t.footer_about}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/faq">{t.footer_faq}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_legal}</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/privacy">{t.footer_privacy}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/terms">{t.footer_terms}</Link></li>
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

function TermsEN() {
  return (
    <div className="legal-content">
      <h2>1. About ThaiHelper</h2>
      <p>
        ThaiHelper.app is a community connection platform and online job board that helps families and expats in Thailand discover household service providers, and helps service providers find work opportunities. ThaiHelper is operated by Jelena Halar, Phuket, Thailand (<a href="mailto:support@thaihelper.app">support@thaihelper.app</a>).
      </p>
      <p>
        By using ThaiHelper — whether as a service provider registering a profile, or as a family browsing the platform — you agree to these Terms of Service.
      </p>

      <h2>2. Who ThaiHelper Is For</h2>
      <p>
        ThaiHelper is designed for <strong>expats, tourists, digital nomads, and individuals on temporary visas</strong> in Thailand (including but not limited to DTV, tourist, ED, O, and retirement visas) who are looking for household help during their stay.
      </p>
      <p>
        ThaiHelper is <strong>not intended for Thai nationals or permanent residents of Thailand</strong> seeking to hire domestic staff. Thai nationals hiring domestic workers are subject to specific provisions under Thai labor law, and should consult local labor authorities or licensed recruitment agencies for such arrangements.
      </p>
      <p>
        By registering as a family or employer on ThaiHelper, you confirm that you are a foreign national residing in Thailand on a valid visa or visiting as a tourist.
      </p>

      <h2>3. Nature of Service — Platform, Not an Agency</h2>
      <p>
        ThaiHelper.app provides an information and advertising service that allows users to post profiles and communicate. We are a venue, not an employer, agent, or recruiter. We are not a recruitment agency and do not engage in placement services as defined under Thai law.
      </p>
      <p>
        Any agreement between a "Helper" (service provider) and a "Family" (employer) is a private contract to which ThaiHelper.app is not a party. ThaiHelper does not employ, supervise, or control any service providers listed on the platform and accepts no liability arising from any such agreement.
      </p>

      <h2>4. For Service Providers (Helpers)</h2>
      <p>By registering on ThaiHelper, you confirm that:</p>
      <ul>
        <li>You are at least 18 years of age.</li>
        <li>All information you provide is accurate and truthful to the best of your knowledge.</li>
        <li>You have the legal right to work in Thailand (appropriate visa or work permit where required).</li>
        <li>You understand that your profile — including your name, photo, skills, experience, and contact details — will be visible to families on the platform.</li>
        <li>You are responsible for negotiating and agreeing on your own working conditions, rate, and schedule directly with families.</li>
        <li>You are solely responsible for your own compliance with Thai immigration and labor laws.</li>
      </ul>

      <h2>4. For Families (Employers)</h2>
      <p>By using ThaiHelper to find a service provider, you acknowledge that:</p>
      <ul>
        <li>ThaiHelper does not conduct background checks, verify identities or credentials, or guarantee the suitability or legal eligibility of any service provider.</li>
        <li>You are responsible for conducting your own due diligence, including interviews, reference checks, and any applicable legal employment steps.</li>
        <li>Any hiring or working arrangement you enter into is entirely at your own risk and discretion.</li>
        <li>ThaiHelper accepts no liability for any loss, damage, or injury arising from a service provider found through the platform.</li>
        <li>You are strictly advised to consult with the Thai Department of Employment or a legal professional before formalizing an employment arrangement.</li>
      </ul>

      <h2>5. Fee Structure &amp; Platform Access</h2>
      <p>
        ThaiHelper is free for service providers (Helpers) to create a profile and be listed on the platform.
      </p>
      <p>
        For families (Employers), ThaiHelper may charge a <strong>Platform Access Fee</strong> which grants the ability to use messaging tools and view full contact details. This fee is strictly for the use of the software, database access, and communication tools only. It is <strong>not</strong> a "Success Fee," "Placement Fee," or "Recruitment Fee."
      </p>
      <p>
        Payment of the Platform Access Fee does not guarantee a successful hire, the availability of any candidate, or the legal eligibility of any service provider to work in a specific role. No refunds are issued for unsuccessful searches.
      </p>

      <h2>6. Work Permits &amp; Visas</h2>
      <p>
        Users acknowledge that working in Thailand is subject to strict regulations under the Thai Labor Act, the Foreign Employment Act, and immigration laws. ThaiHelper.app does not guarantee that any candidate is legally permitted to work in a specific role or that any employer is compliant with applicable labor regulations.
      </p>
      <p>
        Compliance with all work permit, visa, and employment regulations under Thai law is the <strong>sole responsibility of the employer and the candidate</strong>. ThaiHelper does not provide legal advice regarding work permits, visas, or employment law.
      </p>

      <h2>7. Prohibited Use</h2>
      <p>You may not use ThaiHelper to:</p>
      <ul>
        <li>Post false, misleading, or fraudulent information.</li>
        <li>Harass, intimidate, or threaten other users.</li>
        <li>Solicit or engage in any illegal activities.</li>
        <li>Scrape, copy, or distribute platform content without permission.</li>
        <li>Use the platform for any commercial purpose other than finding or offering household services.</li>
      </ul>

      <h2>8. Profile Removal</h2>
      <p>
        ThaiHelper reserves the right to remove any profile or listing at any time, without prior notice, if we believe it violates these Terms or is otherwise inappropriate. Service providers may also request removal of their own profile at any time by contacting us at <a href="mailto:support@thaihelper.app">support@thaihelper.app</a>.
      </p>

      <h2>9. Disclaimer of Warranties</h2>
      <p>
        ThaiHelper is provided "as is" without any warranties, express or implied. We make no guarantees regarding the availability, accuracy, or completeness of the platform or any profiles listed on it. We do not guarantee that you will find work or find a suitable helper through the platform.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by applicable law, ThaiHelper.app and its operator shall not be held liable for any disputes, legal issues, or damages arising from connections made through the platform. This includes, but is not limited to:
      </p>
      <ul>
        <li>The inability to obtain a work permit or visa for any candidate.</li>
        <li>Any breach of labor laws, immigration laws, or tax obligations by users.</li>
        <li>Any loss, injury, theft, or damage arising from an employment or service arrangement.</li>
        <li>Any indirect, incidental, special, or consequential damages arising out of or in connection with the use of this platform.</li>
      </ul>

      <h2>11. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the Kingdom of Thailand. Any disputes shall be subject to the jurisdiction of the courts of Phuket, Thailand.
      </p>

      <h2>12. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the platform after any changes constitutes acceptance of the new Terms. We will notify registered users of significant changes by WhatsApp or email.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms? Contact us at:<br />
        <a href="mailto:support@thaihelper.app">support@thaihelper.app</a>
      </p>
    </div>
  );
}

function TermsTH() {
  return (
    <div className="legal-content">
      <h2>1. เกี่ยวกับ ThaiHelper</h2>
      <p>
        ThaiHelper.app เป็นแพลตฟอร์มเชื่อมต่อชุมชนและกระดานงานออนไลน์ที่ช่วยให้ครอบครัวและชาวต่างชาติในประเทศไทยค้นหาผู้ให้บริการในบ้าน และช่วยให้ผู้ให้บริการค้นหาโอกาสในการทำงาน ThaiHelper ดำเนินการโดย Jelena Halar ภูเก็ต ประเทศไทย (<a href="mailto:support@thaihelper.app">support@thaihelper.app</a>)
      </p>
      <p>
        การใช้ ThaiHelper ไม่ว่าจะในฐานะผู้ให้บริการที่ลงทะเบียนโปรไฟล์ หรือครอบครัวที่ค้นหาผู้ช่วย ถือว่าคุณยอมรับข้อกำหนดการใช้บริการเหล่านี้
      </p>

      <h2>2. ThaiHelper มีไว้สำหรับใคร</h2>
      <p>
        ThaiHelper ออกแบบมาสำหรับ <strong>ชาวต่างชาติ นักท่องเที่ยว ดิจิทัลโนแมด และบุคคลที่ถือวีซ่าชั่วคราว</strong> ในประเทศไทย (รวมถึงแต่ไม่จำกัดเพียง วีซ่า DTV วีซ่าท่องเที่ยว วีซ่า ED วีซ่า O และวีซ่าเกษียณ) ที่ต้องการผู้ช่วยในบ้านระหว่างพำนักในประเทศไทย
      </p>
      <p>
        ThaiHelper <strong>ไม่ได้มีไว้สำหรับคนไทยหรือผู้มีถิ่นพำนักถาวรในประเทศไทย</strong> ที่ต้องการจ้างพนักงานในบ้าน คนไทยที่จ้างพนักงานในบ้านอยู่ภายใต้บทบัญญัติเฉพาะตามกฎหมายแรงงานไทย และควรปรึกษาหน่วยงานแรงงานในพื้นที่หรือบริษัทจัดหางานที่ได้รับอนุญาต
      </p>
      <p>
        เมื่อลงทะเบียนเป็นครอบครัวหรือนายจ้างบน ThaiHelper คุณยืนยันว่าคุณเป็นชาวต่างชาติที่พำนักในประเทศไทยด้วยวีซ่าที่ถูกต้องหรือมาเยี่ยมเยือนในฐานะนักท่องเที่ยว
      </p>

      <h2>3. ลักษณะของบริการ — แพลตฟอร์ม ไม่ใช่ตัวแทนจัดหางาน</h2>
      <p>
        ThaiHelper.app ให้บริการข้อมูลและโฆษณาที่อนุญาตให้ผู้ใช้โพสต์โปรไฟล์และสื่อสารกัน เราเป็นสถานที่ (venue) ไม่ใช่นายจ้าง ตัวแทน หรือผู้สรรหา เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางานตามที่กฎหมายไทยกำหนด
      </p>
      <p>
        ข้อตกลงใดๆ ระหว่าง "ผู้ช่วย" (ผู้ให้บริการ) และ "ครอบครัว" (นายจ้าง) เป็นสัญญาส่วนตัวที่ ThaiHelper.app ไม่ใช่คู่สัญญา ThaiHelper ไม่ได้จ้าง ดูแล หรือควบคุมผู้ให้บริการที่แสดงอยู่บนแพลตฟอร์ม และไม่รับผิดชอบใดๆ ที่เกิดจากข้อตกลงดังกล่าว
      </p>

      <h2>4. สำหรับผู้ให้บริการ (ผู้ช่วย)</h2>
      <p>เมื่อลงทะเบียนบน ThaiHelper คุณยืนยันว่า:</p>
      <ul>
        <li>คุณมีอายุอย่างน้อย 18 ปี</li>
        <li>ข้อมูลทั้งหมดที่คุณให้ไว้ถูกต้องและเป็นความจริง</li>
        <li>คุณมีสิทธิ์ทำงานในประเทศไทยตามกฎหมาย (วีซ่าหรือใบอนุญาตทำงานที่เหมาะสม)</li>
        <li>โปรไฟล์ของคุณรวมถึงชื่อ รูปภาพ ทักษะ ประสบการณ์ และข้อมูลติดต่อจะปรากฏต่อครอบครัวบนแพลตฟอร์ม</li>
        <li>คุณรับผิดชอบในการเจรจาเงื่อนไขการทำงาน อัตราค่าจ้าง และตารางเวลากับครอบครัวโดยตรง</li>
        <li>คุณเป็นผู้รับผิดชอบแต่เพียงผู้เดียวในการปฏิบัติตามกฎหมายตรวจคนเข้าเมืองและกฎหมายแรงงานไทย</li>
      </ul>

      <h2>5. สำหรับครอบครัว (นายจ้าง)</h2>
      <p>เมื่อใช้ ThaiHelper เพื่อค้นหาผู้ให้บริการ คุณรับทราบว่า:</p>
      <ul>
        <li>ThaiHelper ไม่ได้ตรวจสอบประวัติ ยืนยันตัวตนหรือคุณสมบัติ หรือรับรองความเหมาะสมหรือสิทธิ์ตามกฎหมายของผู้ให้บริการ</li>
        <li>คุณรับผิดชอบในการสัมภาษณ์ ตรวจสอบอ้างอิง และดำเนินการตามกฎหมายแรงงานที่เกี่ยวข้อง</li>
        <li>การจ้างงานใดๆ เป็นความเสี่ยงและดุลยพินิจของคุณเอง</li>
        <li>ThaiHelper ไม่รับผิดชอบต่อความเสียหาย การสูญเสีย หรือการบาดเจ็บใดๆ ที่เกิดจากผู้ให้บริการที่พบผ่านแพลตฟอร์ม</li>
        <li>แนะนำอย่างยิ่งให้ปรึกษากรมการจัดหางานหรือผู้เชี่ยวชาญทางกฎหมายก่อนทำข้อตกลงการจ้างงาน</li>
      </ul>

      <h2>6. โครงสร้างค่าบริการและการเข้าถึงแพลตฟอร์ม</h2>
      <p>
        ThaiHelper ให้บริการฟรีสำหรับผู้ให้บริการ (ผู้ช่วย) ในการสร้างโปรไฟล์และแสดงรายชื่อบนแพลตฟอร์ม
      </p>
      <p>
        สำหรับครอบครัว (นายจ้าง) ThaiHelper อาจเรียกเก็บ <strong>ค่าธรรมเนียมการเข้าถึงแพลตฟอร์ม</strong> ซึ่งให้สิทธิ์ใช้เครื่องมือส่งข้อความและดูข้อมูลติดต่อเต็มรูปแบบ ค่าธรรมเนียมนี้เป็นค่าใช้จ่ายสำหรับการใช้ซอฟต์แวร์ การเข้าถึงฐานข้อมูล และเครื่องมือสื่อสารเท่านั้น <strong>ไม่ใช่</strong> "ค่าธรรมเนียมความสำเร็จ" "ค่าจัดหางาน" หรือ "ค่าสรรหาบุคลากร"
      </p>
      <p>
        การชำระค่าธรรมเนียมการเข้าถึงแพลตฟอร์มไม่ได้รับประกันการจ้างงานที่สำเร็จ ความพร้อมของผู้สมัคร หรือสิทธิ์ตามกฎหมายของผู้ให้บริการในการทำงานในตำแหน่งใดตำแหน่งหนึ่ง ไม่มีการคืนเงินสำหรับการค้นหาที่ไม่สำเร็จ
      </p>

      <h2>7. ใบอนุญาตทำงานและวีซ่า</h2>
      <p>
        ผู้ใช้รับทราบว่าการทำงานในประเทศไทยอยู่ภายใต้กฎระเบียบที่เข้มงวดตามพระราชบัญญัติคุ้มครองแรงงาน พระราชบัญญัติการทำงานของคนต่างด้าว และกฎหมายตรวจคนเข้าเมือง ThaiHelper.app ไม่รับประกันว่าผู้สมัครรายใดได้รับอนุญาตให้ทำงานในตำแหน่งใดตำแหน่งหนึ่งตามกฎหมาย หรือนายจ้างรายใดปฏิบัติตามกฎระเบียบแรงงานที่เกี่ยวข้อง
      </p>
      <p>
        การปฏิบัติตามกฎระเบียบทั้งหมดเกี่ยวกับใบอนุญาตทำงาน วีซ่า และการจ้างงานตามกฎหมายไทยเป็น <strong>ความรับผิดชอบของนายจ้างและผู้สมัครแต่เพียงผู้เดียว</strong> ThaiHelper ไม่ให้คำปรึกษาทางกฎหมายเกี่ยวกับใบอนุญาตทำงาน วีซ่า หรือกฎหมายแรงงาน
      </p>

      <h2>8. การใช้งานที่ห้าม</h2>
      <p>คุณไม่สามารถใช้ ThaiHelper เพื่อ:</p>
      <ul>
        <li>โพสต์ข้อมูลเท็จ ทำให้เข้าใจผิด หรือฉ้อโกง</li>
        <li>คุกคาม ข่มขู่ หรือหมิ่นประมาทผู้ใช้อื่น</li>
        <li>ชักชวนหรือมีส่วนร่วมในกิจกรรมที่ผิดกฎหมาย</li>
        <li>คัดลอก ดึงข้อมูล หรือเผยแพร่เนื้อหาแพลตฟอร์มโดยไม่ได้รับอนุญาต</li>
        <li>ใช้แพลตฟอร์มเพื่อวัตถุประสงค์เชิงพาณิชย์อื่นนอกเหนือจากการหาหรือเสนอบริการในบ้าน</li>
      </ul>

      <h2>9. การลบโปรไฟล์</h2>
      <p>
        ThaiHelper ขอสงวนสิทธิ์ในการลบโปรไฟล์หรือรายชื่อใดๆ ได้ตลอดเวลาโดยไม่ต้องแจ้งล่วงหน้า หากเราเชื่อว่ามีการละเมิดข้อกำหนดเหล่านี้ ผู้ให้บริการสามารถขอลบโปรไฟล์ของตนได้ตลอดเวลาโดยติดต่อ <a href="mailto:support@thaihelper.app">support@thaihelper.app</a>
      </p>

      <h2>10. ข้อจำกัดการรับประกัน</h2>
      <p>
        ThaiHelper ให้บริการ "ตามที่เป็น" โดยไม่มีการรับประกันใดๆ ทั้งโดยชัดแจ้งหรือโดยนัย เราไม่รับประกันความพร้อม ความถูกต้อง หรือความสมบูรณ์ของแพลตฟอร์มหรือโปรไฟล์ที่แสดงอยู่ เราไม่รับประกันว่าคุณจะหางานหรือหาผู้ช่วยที่เหมาะสมผ่านแพลตฟอร์ม
      </p>

      <h2>11. ข้อจำกัดความรับผิด</h2>
      <p>
        ในขอบเขตสูงสุดที่กฎหมายอนุญาต ThaiHelper.app และผู้ดำเนินการจะไม่รับผิดชอบต่อข้อพิพาท ปัญหาทางกฎหมาย หรือความเสียหายใดๆ ที่เกิดจากการเชื่อมต่อผ่านแพลตฟอร์ม รวมถึงแต่ไม่จำกัดเพียง:
      </p>
      <ul>
        <li>การไม่สามารถขอใบอนุญาตทำงานหรือวีซ่าสำหรับผู้สมัคร</li>
        <li>การละเมิดกฎหมายแรงงาน กฎหมายตรวจคนเข้าเมือง หรือภาระภาษีโดยผู้ใช้</li>
        <li>การสูญเสีย การบาดเจ็บ การโจรกรรม หรือความเสียหายที่เกิดจากข้อตกลงการจ้างงานหรือบริการ</li>
        <li>ความเสียหายทางอ้อม โดยบังเอิญ พิเศษ หรือเป็นผลสืบเนื่องที่เกิดจากหรือเกี่ยวข้องกับการใช้แพลตฟอร์มนี้</li>
      </ul>

      <h2>12. กฎหมายที่ใช้บังคับ</h2>
      <p>
        ข้อกำหนดเหล่านี้อยู่ภายใต้กฎหมายแห่งราชอาณาจักรไทย ข้อพิพาทใดๆ อยู่ภายใต้เขตอำนาจศาลของจังหวัดภูเก็ต ประเทศไทย
      </p>

      <h2>13. การเปลี่ยนแปลงข้อกำหนด</h2>
      <p>
        เราอาจปรับปรุงข้อกำหนดเหล่านี้เป็นครั้งคราว การใช้แพลตฟอร์มต่อหลังจากการเปลี่ยนแปลงถือว่ายอมรับข้อกำหนดใหม่ เราจะแจ้งผู้ใช้ที่ลงทะเบียนเกี่ยวกับการเปลี่ยนแปลงสำคัญผ่าน WhatsApp หรืออีเมล
      </p>

      <h2>14. ติดต่อเรา</h2>
      <p>
        มีคำถามเกี่ยวกับข้อกำหนดเหล่านี้? ติดต่อเราที่:<br />
        <a href="mailto:support@thaihelper.app">support@thaihelper.app</a>
      </p>
    </div>
  );
}
