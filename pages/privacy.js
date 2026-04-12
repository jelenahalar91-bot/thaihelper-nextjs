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
    title:         'Privacy Policy',
    updated:       'Last updated: April 2026',
    back:          '← Back to Home',
    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_product: 'Product', footer_find: 'Benefits', footer_hire: 'Categories', footer_pricing: 'Pricing', footer_employers: 'For Families',
    footer_company: 'Company', footer_contact: 'Contact', footer_about: 'About', footer_faq: 'FAQ',
    footer_legal: 'Legal', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
    footer_disclaimer: 'ThaiHelper.app is a community connection platform operated by Jelena Hermann (Planet Bamboo GmbH), registered in Germany. We are not a recruitment agency and do not provide placement services. The platform is currently 100% free to use. All arrangements are private agreements between users. Compliance with Thai labor and immigration laws is the sole responsibility of the users.',
  },
  th: {
    nav_employers: 'สำหรับครอบครัว',
    nav_helpers:   'สำหรับผู้ช่วย',
    nav_login:     'เข้าสู่ระบบ',
    nav_cta:       'สมัคร – ฟรี',
    title:         'นโยบายความเป็นส่วนตัว',
    updated:       'อัปเดตล่าสุด: เมษายน 2569',
    back:          '← กลับหน้าแรก',
    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_product: 'ผลิตภัณฑ์', footer_find: 'ประโยชน์', footer_hire: 'หมวดหมู่', footer_pricing: 'ราคา', footer_employers: 'สำหรับครอบครัว',
    footer_company: 'บริษัท', footer_contact: 'ติดต่อ', footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย',
    footer_legal: 'กฎหมาย', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'ข้อกำหนดการใช้บริการ',
    footer_disclaimer: 'ThaiHelper.app เป็นแพลตฟอร์มเชื่อมต่อชุมชน ดำเนินการโดย Jelena Hermann (Planet Bamboo GmbH) จดทะเบียนในประเทศเยอรมนี เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางาน แพลตฟอร์มให้บริการฟรี 100% ในปัจจุบัน ข้อตกลงทั้งหมดเป็นข้อตกลงส่วนตัวระหว่างผู้ใช้ การปฏิบัติตามกฎหมายแรงงานและกฎหมายตรวจคนเข้าเมืองของไทยเป็นความรับผิดชอบของผู้ใช้แต่เพียงผู้เดียว',
  },
};

export default function Privacy() {
  const { lang } = useLang();
  const t = T[lang] || T.en;

  return (
    <>
      <SEOHead
        title="Privacy Policy"
        description="ThaiHelper privacy policy. Learn how we protect your data. We only use local storage for language preferences — no tracking."
        path="/privacy"
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

          {lang === 'en' ? <PrivacyEN /> : <PrivacyTH />}
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

function PrivacyEN() {
  return (
    <div className="legal-content">
      <h2>1. Who We Are</h2>
      <p>
        ThaiHelper is a platform that connects household service providers (helpers, nannies, housekeepers, chefs, drivers, gardeners, elder care workers) with families in Thailand. ThaiHelper is operated by Jelena Hermann, Planet Bamboo GmbH, Ginsterweg 7, 70794 Filderstadt, Germany.
      </p>
      <p>Contact: <a href="mailto:support@thaihelper.app">support@thaihelper.app</a></p>

      <h2>2. What Data We Collect</h2>
      <p>When you register as a service provider, we collect the following information:</p>
      <ul>
        <li>Full name</li>
        <li>Age</li>
        <li>City / location in Thailand</li>
        <li>Neighborhood / Area within the city</li>
        <li>Service category and specific skills</li>
        <li>Years of experience</li>
        <li>Languages spoken</li>
        <li>Preferred hourly rate</li>
        <li>Personal bio / description</li>
        <li>WhatsApp number (required for contact by families)</li>
        <li>Email address (optional)</li>
        <li>Profile photo (optional)</li>
      </ul>
      <p>We do not collect sensitive categories of data such as health information, nationality, or government ID numbers.</p>

      <h2>3. Why We Collect This Data</h2>
      <p>Your data is used solely to:</p>
      <ul>
        <li>Create and display your public profile on the ThaiHelper platform</li>
        <li>Allow families to find and contact you directly</li>
        <li>Notify you when the platform launches in your city</li>
      </ul>
      <p>We do not use your data for advertising, and we do not sell your data to third parties.</p>

      <h2>4. Legal Basis for Processing</h2>
      <p>
        We process your data based on your explicit consent, which you give by checking the agreement box during registration (Thailand PDPA Section 19; GDPR Art. 6(1)(a)). You may withdraw your consent at any time by contacting us.
      </p>

      <h2>5. Where Your Data Is Stored</h2>
      <p>
        Your registration data is stored in Google Sheets, a service provided by Google LLC (USA). Google processes data in accordance with their Privacy Policy and is certified under the EU-US Data Privacy Framework. Your profile information may also be displayed on this website, which is hosted via Vercel, Inc. (USA).
      </p>
      <p>
        Profile photos you upload are stored temporarily during the registration process. We do not store photos on external servers at this time.
      </p>

      <h2>6. How Long We Keep Your Data</h2>
      <p>
        We retain your data for as long as you wish to be listed on ThaiHelper. You can request deletion of your data at any time by emailing us at <a href="mailto:support@thaihelper.app">support@thaihelper.app</a>. We will delete your entry within 14 days.
      </p>

      <h2>7. Your Rights</h2>
      <p>Under the Thailand PDPA and/or GDPR (if applicable), you have the right to:</p>
      <ul>
        <li><strong>Access</strong> — request a copy of the data we hold about you</li>
        <li><strong>Correction</strong> — request that we correct inaccurate data</li>
        <li><strong>Deletion</strong> — request that we delete your data ("right to be forgotten")</li>
        <li><strong>Withdrawal of consent</strong> — withdraw your consent to processing at any time</li>
        <li><strong>Complaint</strong> — lodge a complaint with a data protection authority</li>
      </ul>
      <p>To exercise any of these rights, contact us at <a href="mailto:support@thaihelper.app">support@thaihelper.app</a>.</p>

      <h2>8. Cookies & Analytics</h2>
      <p>
        ThaiHelper uses Google Analytics 4 to understand how visitors use the platform (e.g. page views, traffic sources). Google Analytics sets cookies to distinguish users and sessions. These cookies do not contain personal information.
      </p>
      <p>
        When you first visit ThaiHelper, a cookie consent banner will ask for your permission. Analytics cookies are only set if you click "Accept." You can decline, and the site will work normally without tracking.
      </p>
      <p>
        We also use browser local storage to remember your language preference (English or Thai). No personal data is stored in local storage.
      </p>

      <h2>9. Children's Privacy</h2>
      <p>
        ThaiHelper is intended for adults (18+). We do not knowingly collect data from anyone under 18 years of age.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify registered users of any significant changes by WhatsApp or email. The date at the top of this page indicates when it was last updated.
      </p>

      <h2>11. Contact</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us at:<br />
        <a href="mailto:support@thaihelper.app">support@thaihelper.app</a>
      </p>
    </div>
  );
}

function PrivacyTH() {
  return (
    <div className="legal-content">
      <h2>1. เราคือใคร</h2>
      <p>
        ThaiHelper เป็นแพลตฟอร์มที่เชื่อมต่อผู้ให้บริการในบ้าน (ผู้ช่วย, พี่เลี้ยง, แม่บ้าน, พ่อครัว/แม่ครัว, คนขับรถ, ช่างสวน, ผู้ดูแลผู้สูงอายุ) กับครอบครัวในประเทศไทย ThaiHelper ดำเนินการโดย Jelena Hermann, Planet Bamboo GmbH, Ginsterweg 7, 70794 Filderstadt ประเทศเยอรมนี
      </p>
      <p>ติดต่อ: <a href="mailto:support@thaihelper.app">support@thaihelper.app</a></p>

      <h2>2. ข้อมูลที่เราเก็บรวบรวม</h2>
      <p>เมื่อคุณลงทะเบียนเป็นผู้ให้บริการ เราจะเก็บข้อมูลดังต่อไปนี้:</p>
      <ul>
        <li>ชื่อ-นามสกุล</li>
        <li>เมือง/ที่ตั้งในประเทศไทย</li>
        <li>ประเภทบริการและทักษะเฉพาะ</li>
        <li>ประสบการณ์การทำงาน (ปี)</li>
        <li>ภาษาที่พูดได้</li>
        <li>อัตราค่าจ้างต่อชั่วโมงที่ต้องการ</li>
        <li>ข้อมูลส่วนตัว/คำอธิบายตนเอง</li>
        <li>หมายเลข WhatsApp (จำเป็นสำหรับการติดต่อจากครอบครัว)</li>
        <li>ที่อยู่อีเมล (ไม่บังคับ)</li>
        <li>รูปโปรไฟล์ (ไม่บังคับ)</li>
      </ul>

      <h2>3. เหตุผลที่เราเก็บข้อมูล</h2>
      <p>ข้อมูลของคุณจะถูกนำไปใช้เพื่อ:</p>
      <ul>
        <li>สร้างและแสดงโปรไฟล์สาธารณะของคุณบนแพลตฟอร์ม ThaiHelper</li>
        <li>ให้ครอบครัวสามารถค้นหาและติดต่อคุณได้โดยตรง</li>
        <li>แจ้งให้คุณทราบเมื่อแพลตฟอร์มเปิดตัวในเมืองของคุณ</li>
      </ul>
      <p>เราไม่ใช้ข้อมูลของคุณเพื่อการโฆษณา และไม่ขายข้อมูลของคุณให้กับบุคคลที่สาม</p>

      <h2>4. ฐานทางกฎหมายในการประมวลผล</h2>
      <p>
        เราประมวลผลข้อมูลของคุณโดยอาศัยความยินยอมอย่างชัดแจ้งของคุณ ซึ่งคุณให้ไว้โดยการทำเครื่องหมายในช่องยืนยันระหว่างการลงทะเบียน (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล มาตรา 19) คุณสามารถถอนความยินยอมได้ทุกเมื่อโดยการติดต่อเรา
      </p>

      <h2>5. สิทธิ์ของคุณ</h2>
      <p>ภายใต้ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล คุณมีสิทธิ์:</p>
      <ul>
        <li><strong>เข้าถึง</strong> — ขอสำเนาข้อมูลที่เราเก็บเกี่ยวกับคุณ</li>
        <li><strong>แก้ไข</strong> — ขอให้เราแก้ไขข้อมูลที่ไม่ถูกต้อง</li>
        <li><strong>ลบ</strong> — ขอให้เราลบข้อมูลของคุณ</li>
        <li><strong>ถอนความยินยอม</strong> — ถอนความยินยอมในการประมวลผลได้ทุกเมื่อ</li>
      </ul>
      <p>ติดต่อเราที่ <a href="mailto:support@thaihelper.app">support@thaihelper.app</a></p>

      <h2>6. การติดต่อ</h2>
      <p>
        หากคุณมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ โปรดติดต่อเรา:<br />
        <a href="mailto:support@thaihelper.app">support@thaihelper.app</a>
      </p>
    </div>
  );
}
