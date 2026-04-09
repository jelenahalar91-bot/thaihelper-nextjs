import SEOHead from '@/components/SEOHead';
import Link from 'next/link';
import LangSwitcher from '@/components/LangSwitcher';
import { useLang } from './_app';

const T = {
  en: {
    nav_employers: 'For Employers',
    nav_helpers:   'For Helpers',
    nav_login:     'Log In',
    nav_cta:       'Register – Free',
    title:         'Terms of Service',
    updated:       'Last updated: March 2026',
    back:          '← Back to Home',
    footer_about:  'About', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service', footer_contact: 'Contact',
  },
  th: {
    nav_employers: 'สำหรับนายจ้าง',
    nav_helpers:   'สำหรับผู้ช่วย',
    nav_login:     'เข้าสู่ระบบ',
    nav_cta:       'สมัคร – ฟรี',
    title:         'ข้อกำหนดการใช้บริการ',
    updated:       'อัปเดตล่าสุด: มีนาคม 2569',
    back:          '← กลับหน้าแรก',
    footer_about:  'เกี่ยวกับเรา', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'ข้อกำหนดการใช้บริการ', footer_contact: 'ติดต่อ',
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
        {/* TEAL TOP BAR */}
        <div className="fixed top-0 left-0 w-full h-1 bg-primary z-[60]"></div>

        {/* NAV — mirrors landing page */}
        <nav className="fixed top-1 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="text-xl md:text-2xl font-bold font-headline">
              <span>Thai</span><span style={{ color: '#006a62' }}>Helper</span>
            </Link>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            <Link className="px-2.5 md:px-4 py-1.5 md:py-2 rounded-full border border-primary/40 text-[11px] md:text-sm font-semibold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap" href="/employers">
              {t.nav_employers}
            </Link>
            <Link className="px-2.5 md:px-4 py-1.5 md:py-2 rounded-full border border-primary/40 text-[11px] md:text-sm font-semibold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap" href="/helpers">
              {t.nav_helpers}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            <Link className="hidden md:inline-block text-xs md:text-sm font-semibold text-[#001b3d] hover:text-primary transition-colors" href="/login">
              {t.nav_login}
            </Link>
            <LangSwitcher />
            <Link
              className="px-3 md:px-6 py-1.5 md:py-2.5 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary text-[11px] md:text-sm font-semibold hover:shadow-lg transition-all active:scale-95 duration-150 whitespace-nowrap"
              href="/employer-register"
            >
              {t.nav_cta}
            </Link>
          </div>
        </nav>

        {/* ── CONTENT ── */}
        <main className="pt-28 pb-20" style={{ maxWidth: 760, margin: '0 auto', padding: '120px 24px 80px' }}>
          <Link href="/" style={{ color: 'var(--teal)', textDecoration: 'none', fontSize: 14 }}>{t.back}</Link>

          <h1 style={{ marginTop: 24, marginBottom: 8, color: 'var(--navy)', fontSize: 32 }}>{t.title}</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 40 }}>{t.updated}</p>

          {lang === 'en' ? <TermsEN /> : <TermsTH />}
        </main>

        {/* ── FOOTER ── */}
        <footer className="w-full py-8 px-8 bg-slate-50 border-t border-slate-100 text-center text-sm text-slate-500">
          <div>
            <span>© 2026 ThaiHelper</span>
            &nbsp;·&nbsp;
            <Link className="hover:text-teal-600" href="/about">{t.footer_about}</Link>
            &nbsp;·&nbsp;
            <Link className="hover:text-teal-600" href="/privacy">{t.footer_privacy}</Link>
            &nbsp;·&nbsp;
            <Link className="hover:text-teal-600" href="/terms">{t.footer_terms}</Link>
            &nbsp;·&nbsp;
            <a className="hover:text-teal-600" href="mailto:support@thaihelper.app">{t.footer_contact}</a>
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
        ThaiHelper is an online directory and matching platform that helps families in Thailand find household service providers, and helps service providers find work opportunities. ThaiHelper is operated by Jelena Halar, Phuket, Thailand (<a href="mailto:support@thaihelper.app">support@thaihelper.app</a>).
      </p>
      <p>
        By using ThaiHelper — whether as a service provider registering a profile, or as a family browsing the platform — you agree to these Terms of Service.
      </p>

      <h2>2. ThaiHelper Is a Platform, Not an Employer</h2>
      <p>
        ThaiHelper is a neutral intermediary. We do not employ, supervise, or control any service providers listed on the platform. We are not a staffing or recruitment agency.
      </p>
      <p>
        Any employment or service agreement entered into between a family and a service provider is solely between those two parties. ThaiHelper is not a party to any such agreement and accepts no liability arising from it.
      </p>

      <h2>3. For Service Providers</h2>
      <p>By registering on ThaiHelper, you confirm that:</p>
      <ul>
        <li>You are at least 18 years of age.</li>
        <li>All information you provide is accurate and truthful to the best of your knowledge.</li>
        <li>You have the legal right to work in Thailand (appropriate visa or work permit where required).</li>
        <li>You understand that your profile — including your name, photo, skills, experience, and WhatsApp number — will be publicly visible to families on the platform.</li>
        <li>You are responsible for negotiating and agreeing on your own working conditions, rate, and schedule directly with families.</li>
      </ul>

      <h2>4. For Families</h2>
      <p>By using ThaiHelper to find a service provider, you acknowledge that:</p>
      <ul>
        <li>ThaiHelper does not conduct background checks, verify credentials, or guarantee the suitability of any service provider.</li>
        <li>You are responsible for conducting your own due diligence, including interviews, reference checks, and any applicable legal employment steps.</li>
        <li>Any hiring or working arrangement you enter into is entirely at your own risk and discretion.</li>
        <li>ThaiHelper accepts no liability for any loss, damage, or injury arising from a service provider found through the platform.</li>
      </ul>

      <h2>5. No Fees</h2>
      <p>
        ThaiHelper is currently free to use for both service providers and families. We reserve the right to introduce fees in the future, but will provide advance notice before doing so.
      </p>

      <h2>6. Prohibited Use</h2>
      <p>You may not use ThaiHelper to:</p>
      <ul>
        <li>Post false, misleading, or fraudulent information.</li>
        <li>Harass, intimidate, or threaten other users.</li>
        <li>Solicit or engage in any illegal activities.</li>
        <li>Scrape, copy, or distribute platform content without permission.</li>
        <li>Use the platform for any commercial purpose other than finding or offering household services.</li>
      </ul>

      <h2>7. Profile Removal</h2>
      <p>
        ThaiHelper reserves the right to remove any profile or listing at any time, without prior notice, if we believe it violates these Terms or is otherwise inappropriate. Service providers may also request removal of their own profile at any time by contacting us at <a href="mailto:support@thaihelper.app">support@thaihelper.app</a>.
      </p>

      <h2>8. Disclaimer of Warranties</h2>
      <p>
        ThaiHelper is provided "as is" without any warranties, express or implied. We make no guarantees regarding the availability, accuracy, or completeness of the platform or any profiles listed on it. We do not guarantee that you will find work or find a suitable helper through the platform.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by applicable law, ThaiHelper and its operator shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use of this platform.
      </p>

      <h2>10. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the Kingdom of Thailand. Any disputes shall be subject to the jurisdiction of the courts of Phuket, Thailand.
      </p>

      <h2>11. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the platform after any changes constitutes acceptance of the new Terms. We will notify registered users of significant changes by WhatsApp or email.
      </p>

      <h2>12. Contact</h2>
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
        ThaiHelper เป็นแพลตฟอร์มออนไลน์ที่ช่วยให้ครอบครัวในประเทศไทยค้นหาผู้ให้บริการในบ้าน และช่วยให้ผู้ให้บริการค้นหาโอกาสในการทำงาน ThaiHelper ดำเนินการโดย Jelena Halar ภูเก็ต ประเทศไทย
      </p>
      <p>
        การใช้ ThaiHelper ไม่ว่าจะในฐานะผู้ให้บริการที่ลงทะเบียนโปรไฟล์ หรือครอบครัวที่ค้นหาผู้ช่วย ถือว่าคุณยอมรับข้อกำหนดการใช้บริการเหล่านี้
      </p>

      <h2>2. ThaiHelper คือแพลตฟอร์ม ไม่ใช่นายจ้าง</h2>
      <p>
        ThaiHelper เป็นตัวกลางที่เป็นกลาง เราไม่ได้จ้าง ดูแล หรือควบคุมผู้ให้บริการที่แสดงอยู่บนแพลตฟอร์ม เราไม่ใช่บริษัทจัดหางานหรือสำนักงานจัดหางาน
      </p>
      <p>
        ข้อตกลงการจ้างงานหรือบริการใดๆ ระหว่างครอบครัวและผู้ให้บริการเป็นเรื่องระหว่างสองฝ่ายนั้นเท่านั้น ThaiHelper ไม่ใช่คู่สัญญาในข้อตกลงดังกล่าวและไม่รับผิดชอบใดๆ ที่เกิดจากข้อตกลงนั้น
      </p>

      <h2>3. สำหรับผู้ให้บริการ</h2>
      <p>เมื่อลงทะเบียนบน ThaiHelper คุณยืนยันว่า:</p>
      <ul>
        <li>คุณมีอายุอย่างน้อย 18 ปี</li>
        <li>ข้อมูลทั้งหมดที่คุณให้ไว้ถูกต้องและเป็นความจริง</li>
        <li>คุณมีสิทธิ์ทำงานในประเทศไทยตามกฎหมาย</li>
        <li>โปรไฟล์ของคุณรวมถึงชื่อ รูปภาพ ทักษะ ประสบการณ์ และหมายเลข WhatsApp จะปรากฏต่อสาธารณะ</li>
        <li>คุณรับผิดชอบในการเจรจาเงื่อนไขการทำงาน อัตราค่าจ้าง และตารางเวลากับครอบครัวโดยตรง</li>
      </ul>

      <h2>4. สำหรับครอบครัว</h2>
      <p>เมื่อใช้ ThaiHelper เพื่อค้นหาผู้ให้บริการ คุณรับทราบว่า:</p>
      <ul>
        <li>ThaiHelper ไม่ได้ตรวจสอบประวัติหรือรับรองความเหมาะสมของผู้ให้บริการ</li>
        <li>คุณรับผิดชอบในการสัมภาษณ์ ตรวจสอบอ้างอิง และดำเนินการตามกฎหมายแรงงานที่เกี่ยวข้อง</li>
        <li>การจ้างงานใดๆ เป็นความเสี่ยงและดุลยพินิจของคุณเอง</li>
      </ul>

      <h2>5. ค่าบริการ</h2>
      <p>
        ThaiHelper ให้บริการฟรีสำหรับทั้งผู้ให้บริการและครอบครัวในปัจจุบัน เราขอสงวนสิทธิ์ในการเรียกเก็บค่าธรรมเนียมในอนาคต แต่จะแจ้งให้ทราบล่วงหน้า
      </p>

      <h2>6. กฎหมายที่ใช้บังคับ</h2>
      <p>
        ข้อกำหนดเหล่านี้อยู่ภายใต้กฎหมายแห่งราชอาณาจักรไทย ข้อพิพาทใดๆ อยู่ภายใต้เขตอำนาจศาลของจังหวัดภูเก็ต ประเทศไทย
      </p>

      <h2>7. ติดต่อเรา</h2>
      <p>
        มีคำถามเกี่ยวกับข้อกำหนดเหล่านี้? ติดต่อเราที่:<br />
        <a href="mailto:support@thaihelper.app">support@thaihelper.app</a>
      </p>
    </div>
  );
}
