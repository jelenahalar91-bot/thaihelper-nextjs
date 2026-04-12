import SEOHead, { getFAQSchema, getBreadcrumbSchema } from '@/components/SEOHead';
import Link from 'next/link';
import LangSwitcher from '@/components/LangSwitcher';
import { useLang } from './_app';

/* ── Structured FAQ data for JSON-LD schema ───────── */
const ALL_FAQS = [
  { question: 'What is ThaiHelper?', answer: 'ThaiHelper is a free platform that connects household service providers (nannies, housekeepers, chefs, drivers, gardeners, caregivers, tutors) with families in Thailand. Direct connections, no middlemen.' },
  { question: 'Who is behind ThaiHelper?', answer: 'ThaiHelper was built by a family of four who moved to Thailand and experienced firsthand how difficult it is to find trusted household help.' },
  { question: 'Is ThaiHelper available in my city?', answer: 'ThaiHelper is available across Thailand including Bangkok, Chiang Mai, Phuket, Pattaya, Koh Samui, Hua Hin and many more cities.' },
  { question: 'Is ThaiHelper free for helpers?', answer: 'Yes, 100% free. Helpers never pay to create a profile, receive messages, or get hired.' },
  { question: 'How do I register as a helper?', answer: 'Click Register Free, fill in your details — name, city, service category, skills, experience and a short bio. You will receive a reference number by email to log in.' },
  { question: 'What information is visible on my profile?', answer: 'Your name, city, service category, skills, experience, languages, rate, bio and profile photo are publicly visible. Your email and phone number are never shown publicly.' },
  { question: 'How do families contact me?', answer: 'Families send you messages directly through the ThaiHelper platform. You will see their messages when you log in to your dashboard.' },
  { question: 'Can I edit or delete my profile?', answer: 'Yes. Log in to your dashboard to edit your profile at any time. To delete your profile entirely, contact support@thaihelper.app and we will remove it within 14 days.' },
  { question: 'How much does ThaiHelper cost for employers?', answer: 'New employers get 8 weeks of free access when they register. After the free period, you can purchase an access plan to continue messaging helpers.' },
  { question: 'How do I find a helper?', answer: 'Browse the helper directory and use filters (city, category, experience, languages) to narrow down your search. Click on a profile to see the full details, then send a message directly.' },
  { question: 'Does ThaiHelper do background checks?', answer: 'No. ThaiHelper is a platform that connects helpers with families. We do not verify credentials or conduct background checks. We recommend conducting your own interviews, reference checks and any applicable legal employment steps before hiring.' },
  { question: 'Can I post a job listing?', answer: 'Currently, employers browse and contact helpers directly. A dedicated job board feature is planned for the future.' },
  { question: 'How do I log in?', answer: 'Use the email address you registered with and your reference number (e.g. TH-A1B2C3 for helpers, EMP-A1B2C3 for employers). Use the Forgot reference number link if needed.' },
  { question: 'Is my data safe?', answer: 'Yes. ThaiHelper follows strict data privacy practices. Personal contact details are only shared through the messaging system, not publicly displayed.' },
];

const T = {
  en: {
    nav_employers: 'For Families',
    nav_helpers:   'For Helpers',
    nav_login:     'Login',
    nav_cta:       'Register – Free',
    title:         'Frequently Asked Questions',
    back:          '← Back to Home',
    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_product: 'Product', footer_find: 'Benefits', footer_hire: 'Categories', footer_pricing: 'Pricing', footer_employers: 'For Families',
    footer_company: 'Company', footer_contact: 'Contact', footer_about: 'About', footer_faq: 'FAQ',
    footer_legal: 'Legal', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
    footer_disclaimer: 'ThaiHelper.app is a community connection platform, operated from Germany. We are not a recruitment agency and do not provide placement services. The platform is currently 100% free to use. All arrangements are private agreements between users. Compliance with Thai labor and immigration laws is the sole responsibility of the users.',
  },
  th: {
    nav_employers: 'สำหรับครอบครัว',
    nav_helpers:   'สำหรับผู้ช่วย',
    nav_login:     'เข้าสู่ระบบ',
    nav_cta:       'สมัคร – ฟรี',
    title:         'คำถามที่พบบ่อย',
    back:          '← กลับหน้าแรก',
    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_product: 'ผลิตภัณฑ์', footer_find: 'ประโยชน์', footer_hire: 'หมวดหมู่', footer_pricing: 'ราคา', footer_employers: 'สำหรับครอบครัว',
    footer_company: 'บริษัท', footer_contact: 'ติดต่อ', footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย',
    footer_legal: 'กฎหมาย', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'ข้อกำหนดการใช้บริการ',
    footer_disclaimer: 'ThaiHelper.app เป็นแพลตฟอร์มเชื่อมต่อชุมชน ดำเนินการจากประเทศเยอรมนี เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางาน แพลตฟอร์มให้บริการฟรี 100% ในปัจจุบัน ข้อตกลงทั้งหมดเป็นข้อตกลงส่วนตัวระหว่างผู้ใช้ การปฏิบัติตามกฎหมายแรงงานและกฎหมายตรวจคนเข้าเมืองของไทยเป็นความรับผิดชอบของผู้ใช้แต่เพียงผู้เดียว',
  },
};

export default function FAQ() {
  const { lang } = useLang();
  const t = T[lang] || T.en;

  return (
    <>
      <SEOHead
        title="FAQ – Frequently Asked Questions"
        description="Find answers to common questions about ThaiHelper — how it works, pricing for employers, helper registration, verification, safety and more."
        path="/faq"
        lang={lang}
        jsonLd={[
          getFAQSchema(ALL_FAQS),
          getBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]),
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
              {t.nav_helpers} →
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

        {/* CONTENT */}
        <main className="pt-32 md:pt-36 pb-20" style={{ maxWidth: 760, margin: '0 auto', padding: '140px 24px 80px' }}>
          <Link href="/" style={{ color: 'var(--teal)', textDecoration: 'none', fontSize: 14 }}>{t.back}</Link>

          <h1 style={{ marginTop: 24, marginBottom: 40, color: 'var(--navy)', fontSize: 32 }}>{t.title}</h1>

          {lang === 'en' ? <FAQEN /> : <FAQTH />}
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

function FAQEN() {
  return (
    <div className="legal-content">
      <h2>General</h2>

      <h3>What is ThaiHelper?</h3>
      <p>
        ThaiHelper is a free platform that connects household service providers (nannies, housekeepers, chefs, drivers, gardeners, caregivers, tutors) with families in Thailand. We simply make it easy for both sides to find each other and communicate directly.
      </p>

      <h3>Who is behind ThaiHelper?</h3>
      <p>
        ThaiHelper was built by a family of four who moved to Thailand and experienced firsthand how difficult it is to find trusted household help. <Link href="/about" style={{ color: '#006a62' }}>Read our full story</Link>.
      </p>

      <h3>Is ThaiHelper available in my city?</h3>
      <p>
        ThaiHelper is available across Thailand — including Bangkok, Chiang Mai, Phuket, Pattaya, Koh Samui, Hua Hin and many more cities. If your city is not listed yet, you can still register and we will notify you when we expand.
      </p>

      <h2>For Helpers</h2>

      <h3>Is ThaiHelper free for helpers?</h3>
      <p>
        Yes, 100% free. Helpers never pay to create a profile, receive messages, or get hired. We believe helpers should keep every baht they earn.
      </p>

      <h3>How do I register as a helper?</h3>
      <p>
        Click <Link href="/register" style={{ color: '#006a62' }}>"Register Free"</Link> and fill in your details — name, city, service category, skills, experience and a short bio. You will receive a reference number by email that you can use to log in.
      </p>

      <h3>What information is visible on my profile?</h3>
      <p>
        Your name, city, service category, skills, experience, languages, rate, bio and profile photo are publicly visible to families. Your email and phone number are never shown publicly.
      </p>

      <h3>How do families contact me?</h3>
      <p>
        Families send you messages directly through the ThaiHelper platform. You will see their messages when you log in to your dashboard.
      </p>

      <h3>Can I edit or delete my profile?</h3>
      <p>
        Yes. Log in to your dashboard to edit your profile at any time. To delete your profile entirely, contact us at <a href="mailto:support@thaihelper.app" style={{ color: '#006a62' }}>support@thaihelper.app</a> and we will remove it within 14 days.
      </p>

      <h2>For Families & Households</h2>

      <h3>How much does ThaiHelper cost for families?</h3>
      <p>
        New employers get <strong>8 weeks of free access</strong> when they register. After the free period, you can purchase an access plan to continue messaging helpers. Check our <Link href="/pricing" style={{ color: '#006a62' }}>pricing page</Link> for details.
      </p>

      <h3>How do I find a helper?</h3>
      <p>
        Browse our <Link href="/helpers" style={{ color: '#006a62' }}>helper directory</Link> and use filters (city, category, experience, languages) to narrow down your search. Click on a profile to see the full details, then send a message directly.
      </p>

      <h3>Does ThaiHelper do background checks?</h3>
      <p>
        ThaiHelper is a platform that connects helpers with families. We do not verify credentials or conduct background checks. We recommend conducting your own interviews, reference checks and any applicable legal employment steps before hiring.
      </p>

      <h3>Can I post a job listing?</h3>
      <p>
        Currently, employers create a profile describing what they are looking for, and helpers can browse employer profiles and reach out. We are working on a dedicated job board feature for the future.
      </p>

      <h2>Account & Security</h2>

      <h3>How do I log in?</h3>
      <p>
        Use the email address you registered with and your reference number (e.g. TH-A1B2C3 for helpers, EMP-A1B2C3 for employers). If you forgot your reference number, use the "Forgot reference number?" link on the <Link href="/login" style={{ color: '#006a62' }}>login page</Link> to have it sent to your email.
      </p>

      <h3>Is my data safe?</h3>
      <p>
        Yes. We take privacy seriously. Read our <Link href="/privacy" style={{ color: '#006a62' }}>Privacy Policy</Link> for full details on what data we collect and how we protect it.
      </p>

      <h2>Contact</h2>

      <h3>I have a question not listed here</h3>
      <p>
        Email us at <a href="mailto:support@thaihelper.app" style={{ color: '#006a62' }}>support@thaihelper.app</a> — we usually respond within 24 hours.
      </p>
    </div>
  );
}

function FAQTH() {
  return (
    <div className="legal-content">
      <h2>ทั่วไป</h2>

      <h3>ThaiHelper คืออะไร?</h3>
      <p>
        ThaiHelper เป็นแพลตฟอร์มฟรีที่เชื่อมต่อผู้ให้บริการในบ้าน (พี่เลี้ยง แม่บ้าน พ่อครัว คนขับรถ คนสวน ผู้ดูแลผู้สูงอายุ ติวเตอร์) กับครอบครัวในประเทศไทย เราเพียงแค่ทำให้ทั้งสองฝ่ายค้นพบกันและสื่อสารกันได้โดยตรง
      </p>

      <h3>ใครอยู่เบื้องหลัง ThaiHelper?</h3>
      <p>
        ThaiHelper สร้างโดยครอบครัวสี่คนที่ย้ายมาประเทศไทยและเจอปัญหาโดยตรงว่าการหาผู้ช่วยที่ไว้ใจได้นั้นยากแค่ไหน <Link href="/about" style={{ color: '#006a62' }}>อ่านเรื่องราวของเรา</Link>
      </p>

      <h3>ThaiHelper มีให้บริการในเมืองของฉันไหม?</h3>
      <p>
        ThaiHelper ให้บริการทั่วประเทศไทย รวมถึง กรุงเทพฯ เชียงใหม่ ภูเก็ต พัทยา เกาะสมุย หัวหิน และอีกหลายเมือง หากเมืองของคุณยังไม่อยู่ในรายการ คุณยังสามารถลงทะเบียนได้ เราจะแจ้งคุณเมื่อขยายพื้นที่
      </p>

      <h2>สำหรับผู้ช่วย</h2>

      <h3>ThaiHelper ฟรีสำหรับผู้ช่วยไหม?</h3>
      <p>
        ใช่ ฟรี 100% ผู้ช่วยไม่ต้องจ่ายเงินเพื่อสร้างโปรไฟล์ รับข้อความ หรือได้งาน เราเชื่อว่าผู้ช่วยควรเก็บทุกบาทที่พวกเขาหาได้
      </p>

      <h3>ฉันลงทะเบียนเป็นผู้ช่วยได้อย่างไร?</h3>
      <p>
        คลิก <Link href="/register" style={{ color: '#006a62' }}>"สมัครฟรี"</Link> และกรอกข้อมูลของคุณ — ชื่อ เมือง ประเภทบริการ ทักษะ ประสบการณ์ และแนะนำตัวสั้นๆ คุณจะได้รับหมายเลขอ้างอิงทางอีเมลเพื่อใช้เข้าสู่ระบบ
      </p>

      <h3>ข้อมูลอะไรที่แสดงในโปรไฟล์?</h3>
      <p>
        ชื่อ เมือง ประเภทบริการ ทักษะ ประสบการณ์ ภาษา อัตราค่าจ้าง แนะนำตัว และรูปโปรไฟล์จะแสดงต่อสาธารณะ อีเมลและหมายเลขโทรศัพท์จะไม่ถูกแสดงต่อสาธารณะ
      </p>

      <h3>ครอบครัวติดต่อฉันได้อย่างไร?</h3>
      <p>
        ครอบครัวส่งข้อความถึงคุณโดยตรงผ่านแพลตฟอร์ม ThaiHelper คุณจะเห็นข้อความเมื่อเข้าสู่ระบบแดชบอร์ด
      </p>

      <h3>ฉันแก้ไขหรือลบโปรไฟล์ได้ไหม?</h3>
      <p>
        ได้ เข้าสู่ระบบแดชบอร์ดเพื่อแก้ไขโปรไฟล์ได้ตลอดเวลา หากต้องการลบโปรไฟล์ทั้งหมด ติดต่อเราที่ <a href="mailto:support@thaihelper.app" style={{ color: '#006a62' }}>support@thaihelper.app</a> เราจะลบภายใน 14 วัน
      </p>

      <h2>สำหรับครอบครัวและครัวเรือน</h2>

      <h3>ThaiHelper ราคาเท่าไหร่?</h3>
      <p>
        นายจ้างใหม่จะได้รับ <strong>สิทธิ์เข้าถึงฟรี 8 สัปดาห์</strong> เมื่อลงทะเบียน หลังจากช่วงฟรี คุณสามารถซื้อแผนเพื่อใช้งานต่อ ดูรายละเอียดที่ <Link href="/pricing" style={{ color: '#006a62' }}>หน้าราคา</Link>
      </p>

      <h3>ฉันหาผู้ช่วยได้อย่างไร?</h3>
      <p>
        เรียกดู <Link href="/helpers" style={{ color: '#006a62' }}>รายชื่อผู้ช่วย</Link> และใช้ตัวกรอง (เมือง ประเภท ประสบการณ์ ภาษา) เพื่อจำกัดการค้นหา คลิกที่โปรไฟล์เพื่อดูรายละเอียด จากนั้นส่งข้อความโดยตรง
      </p>

      <h3>ThaiHelper ตรวจสอบประวัติไหม?</h3>
      <p>
        ThaiHelper เป็นแพลตฟอร์มที่เชื่อมต่อผู้ช่วยกับครอบครัว เราไม่ได้ยืนยันข้อมูลรับรองหรือตรวจสอบประวัติ เราแนะนำให้ทำการสัมภาษณ์ ตรวจสอบข้อมูลอ้างอิง และดำเนินการตามกฎหมายแรงงานก่อนจ้าง
      </p>

      <h2>บัญชีและความปลอดภัย</h2>

      <h3>ฉันเข้าสู่ระบบอย่างไร?</h3>
      <p>
        ใช้อีเมลที่ลงทะเบียนและหมายเลขอ้างอิง (เช่น TH-A1B2C3 สำหรับผู้ช่วย, EMP-A1B2C3 สำหรับนายจ้าง) หากลืมหมายเลขอ้างอิง ใช้ลิงก์ "ลืมหมายเลขอ้างอิง?" ใน <Link href="/login" style={{ color: '#006a62' }}>หน้าเข้าสู่ระบบ</Link>
      </p>

      <h3>ข้อมูลของฉันปลอดภัยไหม?</h3>
      <p>
        ใช่ เราให้ความสำคัญกับความเป็นส่วนตัว อ่าน <Link href="/privacy" style={{ color: '#006a62' }}>นโยบายความเป็นส่วนตัว</Link> สำหรับรายละเอียดทั้งหมด
      </p>

      <h2>ติดต่อเรา</h2>

      <h3>มีคำถามที่ไม่ได้อยู่ในรายการนี้</h3>
      <p>
        อีเมลเราที่ <a href="mailto:support@thaihelper.app" style={{ color: '#006a62' }}>support@thaihelper.app</a> — เรามักตอบกลับภายใน 24 ชั่วโมง
      </p>
    </div>
  );
}
