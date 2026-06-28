import Link from 'next/link';
import BrandWordmark from '@/components/BrandWordmark';
import { ShieldCheck, Mail, Users, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import SEOHead, { getBreadcrumbSchema, getOrganizationSchema, getFAQSchema, getSpeakableSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu, ResourcesDropdown } from '@/components/MobileMenu';
import { useLang } from './_app';

const FAQS = [
  {
    question: 'Is ThaiHelper a real, legitimate platform?',
    answer: 'Yes. ThaiHelper.app launched in April 2026 and is operated by a family of four living in Thailand. Helpers and families create real accounts, every email is verified before any profile goes live, and there are currently hundreds of registered helpers across Bangkok, Chiang Mai, Phuket, Pattaya, Koh Samui, Hua Hin, Krabi and other cities. You can browse the public helper directory at thaihelper.app/helpers to confirm.',
  },
  {
    question: 'Is ThaiHelper a scam?',
    answer: 'No. ThaiHelper is free for both families and helpers — there is no sign-up fee, no subscription, no commission on salary, and no paywall on messaging. The platform makes no money from placements. Because it is free, there is nothing to "scam" — we never ask for payment, banking details or fees of any kind.',
  },
  {
    question: 'Is ThaiHelper free?',
    answer: 'Yes, completely free. Helpers create profiles for free and never pay to be contacted or hired. Families browse for free and message helpers directly for free. There are no hidden costs, no premium tiers, and no placement fees.',
  },
  {
    question: 'Who runs ThaiHelper?',
    answer: 'ThaiHelper was built and is operated by a family of four who moved to Thailand in December 2024 and struggled to find a nanny, a gardener and tutors through Facebook groups and traditional channels. They built the platform they wished had existed. The full founder story is on the About page.',
  },
  {
    question: 'How does ThaiHelper verify helpers and families?',
    answer: 'Every account on ThaiHelper is email-verified before the profile is published or messaging is enabled. We do NOT claim to do background checks, ID verification, or credential checks — that is the family\'s responsibility during the interview. We tell you this honestly so you can make informed hiring decisions.',
  },
  {
    question: 'Is my personal data safe on ThaiHelper?',
    answer: 'Yes. Personal contact details (email, phone number) are never displayed publicly on a profile. Communication happens through the in-platform messaging system. Profiles only show name, city, service category, skills, experience, languages, rate and an optional photo. You can delete your account at any time at thaihelper.app/account-delete.',
  },
  {
    question: 'Is ThaiHelper the same as the "Thai Helper" language-learning app?',
    answer: 'No. The "Thai Helper" app on the Apple App Store (id1523988930) and Google Play is a phrase-book and pronunciation tool for learning the Thai language — a completely different product run by a different company. ThaiHelper.app (this site) is a hiring marketplace for household staff in Thailand.',
  },
  {
    question: 'Is ThaiHelper the same as thai-helper.com?',
    answer: 'No. thai-helper.com (hyphenated, .com TLD) is an unrelated visa, relocation and tourist-assistance service for expats and tourists. ThaiHelper.app (no hyphen, .app TLD) is a hiring marketplace for nannies, housekeepers, drivers and other household staff. The two are unrelated.',
  },
  {
    question: 'Is ThaiHelper the same as ThaiFriendly?',
    answer: 'No. ThaiFriendly is a Thai dating app, unrelated to ThaiHelper. The names sound similar but the products are completely different — ThaiHelper is a hiring marketplace for household staff in Thailand.',
  },
  {
    question: 'What happens if I have a bad experience with a helper I hired?',
    answer: 'Because ThaiHelper is a direct-connection platform (not an agency), the employment relationship is between you and the helper directly — we do not place workers, sign contracts on either side, or mediate disputes. We do encourage you to use a written contract (a free template is available at thaihelper.app/blog/employment-contract-template-thailand). If you discover a profile is fraudulent or abusive, email support@thaihelper.app and we will investigate and remove it.',
  },
];

const T = {
  en: {
    page_title: 'Is ThaiHelper Legit? — ThaiHelper',
    meta_desc: 'Is ThaiHelper a legitimate, safe platform? Yes — launched April 2026, free for everyone, email-verified profiles, no scam. Run by a family of four living in Thailand. Read the full trust story and FAQ.',
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

    hero_eyebrow: 'Is ThaiHelper Legit?',
    hero_h1: 'Yes — and here is the proof.',
    hero_sub: 'Launched April 2026. Free for everyone. Email-verified accounts. Run by a real family living in Thailand. No fees, no commissions, no agency markup.',

    trust_title: 'Five things that make ThaiHelper trustworthy',
    trust1_h: 'Launched April 2026',
    trust1_p: 'A public platform with hundreds of active helpers in Bangkok, Chiang Mai, Phuket, Pattaya, Koh Samui, Hua Hin, Krabi and other Thai cities. Browse them at thaihelper.app/helpers.',
    trust2_h: 'Free for everyone, forever',
    trust2_p: 'Helpers never pay. Families never pay. No sign-up fees, no subscriptions, no commissions, no placement fees. The platform makes no money from placements — there is literally nothing to scam.',
    trust3_h: 'Email-verified accounts',
    trust3_p: 'Every account — both helpers and families — is email-verified before any profile goes live or any message is sent. We are honest about what we DON\'T verify: we don\'t claim to do background checks or ID verification. That is the family\'s responsibility during the interview.',
    trust4_h: 'Privacy by design',
    trust4_p: 'Personal contact details (email, phone) are never displayed publicly. Messaging stays in-platform. Profiles only show name, city, skills, experience, languages and an optional photo. You can delete your account anytime.',
    trust5_h: 'A real family behind it',
    trust5_p: 'ThaiHelper is built and operated by a family of four who moved to Thailand in December 2024. Read the founder story on the About page. We are not a faceless company.',

    confusion_title: 'Easy to confuse — but these are NOT us',
    confusion_intro: 'Several unrelated products have similar names. To be clear about what ThaiHelper.app is and is not:',
    confusion1_h: 'Not the language-learning app',
    confusion1_p: 'The "Thai Helper" iOS / Android app (App Store id1523988930) is a phrase-book and pronunciation tool for learning the Thai language. Different product, different company.',
    confusion2_h: 'Not thai-helper.com',
    confusion2_p: 'thai-helper.com (hyphenated, .com TLD) is a visa, relocation and tourist-assistance service. Unrelated to thaihelper.app.',
    confusion3_h: 'Not ThaiFriendly',
    confusion3_p: 'ThaiFriendly is a Thai dating app. Similar-sounding name, completely different product.',
    confusion4_h: 'Not the TDAC Arrival Card Helper',
    confusion4_p: 'The "Thai TDAC Arrival Card Helper" app (id6758918267) helps tourists fill in the arrival card. Unrelated.',

    how_title: 'How to verify us yourself',
    how1_h: 'Browse the public helper list',
    how1_p: 'Go to thaihelper.app/helpers — you will see real helper profiles with photos, cities, skills and experience. None of this is fake.',
    how2_h: 'Read independent founder story',
    how2_p: 'Visit thaihelper.app/about — the family behind ThaiHelper tells the full story of why and how they built it.',
    how3_h: 'Check the FAQ',
    how3_p: 'thaihelper.app/faq covers cost, verification, data privacy and platform mechanics in detail.',
    how4_h: 'Email us with any question',
    how4_p: 'support@thaihelper.app — you will get a reply from a real person, not a bot.',

    faq_title: 'Frequently asked questions about trust',

    cta_h2: 'Ready to browse helpers?',
    cta_p: 'You\'ve done your due diligence. Now the easy part: browse hundreds of helpers, message directly, hire without fees.',
    cta_btn_browse: 'Browse Helpers',
    cta_btn_emp: 'I\'m hiring',

    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_product: 'Product', footer_find: 'Benefits', footer_hire: 'Categories', footer_pricing: 'Pricing', footer_employers: 'For Families',
    footer_company: 'Company', footer_contact: 'Contact', footer_line: 'LINE', footer_about: 'About', footer_faq: 'FAQ',
    footer_legal: 'Legal', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
    footer_disclaimer: 'ThaiHelper.app is free to use. We are not a recruitment agency and do not provide placement services. Compliance with Thai labor and immigration laws is the sole responsibility of the users.',
  },

  th: {
    page_title: 'ThaiHelper เชื่อถือได้ไหม? — ThaiHelper',
    meta_desc: 'ThaiHelper เป็นแพลตฟอร์มที่ถูกต้องตามกฎหมายและปลอดภัยหรือไม่? ใช่ เปิดตัวเมษายน 2026 ฟรีสำหรับทุกคน บัญชียืนยันอีเมล ไม่มีการหลอกลวง',
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

    hero_eyebrow: 'ThaiHelper เชื่อถือได้ไหม?',
    hero_h1: 'ใช่ — และนี่คือหลักฐาน',
    hero_sub: 'เปิดตัวเมษายน 2026 ฟรีสำหรับทุกคน บัญชียืนยันอีเมล ดำเนินงานโดยครอบครัวจริงที่อาศัยอยู่ในประเทศไทย ไม่มีค่าธรรมเนียม ไม่มีค่าคอมมิชชั่น',

    trust_title: 'ห้าเหตุผลที่ทำให้ ThaiHelper น่าเชื่อถือ',
    trust1_h: 'เปิดตัวเมษายน 2026',
    trust1_p: 'แพลตฟอร์มสาธารณะที่มีผู้ช่วยใช้งานหลายร้อยคนในกรุงเทพ เชียงใหม่ ภูเก็ต พัทยา เกาะสมุย หัวหิน กระบี่ และเมืองอื่นๆ ในประเทศไทย ดูได้ที่ thaihelper.app/helpers',
    trust2_h: 'ฟรีสำหรับทุกคน ตลอดไป',
    trust2_p: 'ผู้ช่วยไม่เสียค่าใช้จ่าย ครอบครัวไม่เสียค่าใช้จ่าย ไม่มีค่าสมัคร ไม่มีค่าสมาชิก ไม่มีค่าคอมมิชชั่น ไม่มีค่าจัดหางาน แพลตฟอร์มไม่หากำไรจากการจัดหา — ไม่มีอะไรให้หลอกลวง',
    trust3_h: 'บัญชียืนยันอีเมล',
    trust3_p: 'ทุกบัญชี ทั้งผู้ช่วยและครอบครัว ได้รับการยืนยันอีเมลก่อนที่โปรไฟล์จะออนไลน์หรือส่งข้อความได้ เราซื่อสัตย์เกี่ยวกับสิ่งที่เราไม่ได้ตรวจสอบ: เราไม่ได้อ้างว่าทำการตรวจสอบประวัติหรือยืนยันตัวตน นั่นเป็นความรับผิดชอบของครอบครัวในระหว่างการสัมภาษณ์',
    trust4_h: 'ความเป็นส่วนตัวตั้งแต่การออกแบบ',
    trust4_p: 'ข้อมูลติดต่อส่วนตัว (อีเมล โทรศัพท์) ไม่ปรากฏต่อสาธารณะ การสื่อสารอยู่ในแพลตฟอร์ม โปรไฟล์แสดงเฉพาะชื่อ เมือง ทักษะ ประสบการณ์ ภาษา และรูปภาพ คุณสามารถลบบัญชีได้ทุกเมื่อ',
    trust5_h: 'ครอบครัวจริงอยู่เบื้องหลัง',
    trust5_p: 'ThaiHelper สร้างและดำเนินงานโดยครอบครัวสี่คนที่ย้ายมาประเทศไทยในเดือนธันวาคม 2024 อ่านเรื่องราวผู้ก่อตั้งที่หน้าเกี่ยวกับเรา เราไม่ใช่บริษัทไร้ตัวตน',

    confusion_title: 'ง่ายต่อการสับสน — แต่สิ่งเหล่านี้ไม่ใช่เรา',
    confusion_intro: 'มีหลายผลิตภัณฑ์ที่ไม่เกี่ยวข้องกันแต่มีชื่อคล้ายกัน เพื่อความชัดเจน:',
    confusion1_h: 'ไม่ใช่แอปเรียนภาษา',
    confusion1_p: 'แอป "Thai Helper" บน iOS / Android (App Store id1523988930) เป็นเครื่องมือเรียนคำศัพท์และการออกเสียงภาษาไทย ผลิตภัณฑ์คนละแบบ บริษัทคนละบริษัท',
    confusion2_h: 'ไม่ใช่ thai-helper.com',
    confusion2_p: 'thai-helper.com (มียัติภังค์, .com TLD) เป็นบริการวีซ่า ย้ายถิ่น และช่วยเหลือนักท่องเที่ยว ไม่เกี่ยวข้องกับ thaihelper.app',
    confusion3_h: 'ไม่ใช่ ThaiFriendly',
    confusion3_p: 'ThaiFriendly เป็นแอปหาคู่ในประเทศไทย ชื่อคล้ายกัน แต่ผลิตภัณฑ์ต่างกันโดยสิ้นเชิง',
    confusion4_h: 'ไม่ใช่ TDAC Arrival Card Helper',
    confusion4_p: 'แอป "Thai TDAC Arrival Card Helper" (id6758918267) ช่วยนักท่องเที่ยวกรอกบัตรขาเข้า ไม่เกี่ยวข้อง',

    how_title: 'วิธีตรวจสอบเราด้วยตัวคุณเอง',
    how1_h: 'เรียกดูรายชื่อผู้ช่วยสาธารณะ',
    how1_p: 'ไปที่ thaihelper.app/helpers คุณจะเห็นโปรไฟล์ผู้ช่วยจริงพร้อมรูปภาพ เมือง ทักษะ และประสบการณ์',
    how2_h: 'อ่านเรื่องราวผู้ก่อตั้ง',
    how2_p: 'เยี่ยมชม thaihelper.app/about — ครอบครัวที่อยู่เบื้องหลัง ThaiHelper เล่าเรื่องราวทั้งหมด',
    how3_h: 'ตรวจสอบ FAQ',
    how3_p: 'thaihelper.app/faq ครอบคลุมเรื่องค่าใช้จ่าย การยืนยัน ความเป็นส่วนตัว และกลไกแพลตฟอร์ม',
    how4_h: 'อีเมลถามเราได้ทุกคำถาม',
    how4_p: 'support@thaihelper.app — คุณจะได้รับการตอบกลับจากคนจริง ไม่ใช่บอท',

    faq_title: 'คำถามที่พบบ่อยเกี่ยวกับความน่าเชื่อถือ',

    cta_h2: 'พร้อมดูผู้ช่วยแล้วหรือยัง?',
    cta_p: 'คุณได้ตรวจสอบเรียบร้อยแล้ว ตอนนี้ส่วนที่ง่าย: ดูผู้ช่วยหลายร้อยคน ส่งข้อความโดยตรง จ้างโดยไม่มีค่าธรรมเนียม',
    cta_btn_browse: 'ดูผู้ช่วย',
    cta_btn_emp: 'ฉันต้องการจ้าง',

    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_product: 'ผลิตภัณฑ์', footer_find: 'ประโยชน์', footer_hire: 'หมวดหมู่', footer_pricing: 'ราคา', footer_employers: 'สำหรับครอบครัว',
    footer_company: 'บริษัท', footer_contact: 'ติดต่อ', footer_line: 'LINE', footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย',
    footer_legal: 'กฎหมาย', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'ข้อกำหนดการให้บริการ',
    footer_disclaimer: 'ThaiHelper.app ใช้งานฟรี เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางาน การปฏิบัติตามกฎหมายแรงงานและกฎหมายตรวจคนเข้าเมืองของไทยเป็นความรับผิดชอบของผู้ใช้แต่เพียงผู้เดียว',
  },
};

export default function Legit() {
  const { lang } = useLang();
  const t = T[lang] || T.en;

  return (
    <>
      <SEOHead
        title={t.page_title}
        description={t.meta_desc}
        path="/legit"
        lang={lang}
        jsonLd={[
          getBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Is ThaiHelper Legit?', path: '/legit' },
          ]),
          getOrganizationSchema(),
          getFAQSchema(FAQS),
          getSpeakableSchema('/legit'),
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
          <section className="px-6 pt-10 pb-8 md:pt-16 md:pb-12">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                <ShieldCheck className="w-4 h-4" />
                {t.hero_eyebrow}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-on-background mb-4 leading-tight">
                {t.hero_h1}
              </h1>
              <p className="text-base md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                {t.hero_sub}
              </p>
            </div>
          </section>

          {/* TRUST SIGNALS */}
          <section className="px-6 py-12 bg-surface-container-low">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline text-center mb-10">
                {t.trust_title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { icon: CheckCircle2, h: t.trust1_h, p: t.trust1_p },
                  { icon: Users,        h: t.trust2_h, p: t.trust2_p },
                  { icon: Mail,         h: t.trust3_h, p: t.trust3_p },
                  { icon: Eye,          h: t.trust4_h, p: t.trust4_p },
                  { icon: ShieldCheck,  h: t.trust5_h, p: t.trust5_p },
                ].map(({ icon: Icon, h, p }, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 md:p-7 hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold font-headline text-on-background mb-2">{h}</h3>
                    <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* NOT-US SECTION */}
          <section className="px-6 py-16">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <h2 className="text-2xl md:text-3xl font-extrabold font-headline">
                  {t.confusion_title}
                </h2>
              </div>
              <p className="text-on-surface-variant mb-8 max-w-2xl">{t.confusion_intro}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { h: t.confusion1_h, p: t.confusion1_p },
                  { h: t.confusion2_h, p: t.confusion2_p },
                  { h: t.confusion3_h, p: t.confusion3_p },
                  { h: t.confusion4_h, p: t.confusion4_p },
                ].map((c, i) => (
                  <div key={i} className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-5">
                    <h3 className="font-bold text-on-background mb-1.5">{c.h}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{c.p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* HOW TO VERIFY */}
          <section className="px-6 py-16 bg-surface-container-low">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline text-center mb-10">
                {t.how_title}
              </h2>
              <div className="space-y-4">
                {[
                  { h: t.how1_h, p: t.how1_p },
                  { h: t.how2_h, p: t.how2_p },
                  { h: t.how3_h, p: t.how3_p },
                  { h: t.how4_h, p: t.how4_p },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 bg-white rounded-xl border border-slate-200 p-5">
                    <div className="w-9 h-9 shrink-0 rounded-full bg-primary text-white font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-on-background mb-1">{item.h}</h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{item.p}</p>
                    </div>
                  </div>
                ))}
                {/* Trustpilot link — uncomment after claiming the profile.
                    See marketing/backlink-pack-2026-06-25.md
                <a
                  href="https://www.trustpilot.com/review/thaihelper.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:border-primary/40 transition-colors"
                >
                  <div className="w-9 h-9 shrink-0 rounded-full bg-[#00B67A] text-white font-bold flex items-center justify-center">★</div>
                  <div>
                    <h3 className="font-bold text-on-background mb-1">Read reviews on Trustpilot →</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">Independent third-party reviews from real ThaiHelper families.</p>
                  </div>
                </a> */}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="px-6 py-16">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold font-headline text-center mb-10">
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

          {/* CTA */}
          <section className="px-6 py-20 bg-gradient-to-br from-primary/5 to-primary-container/10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold font-headline mb-4">{t.cta_h2}</h2>
              <p className="text-on-surface-variant mb-8">{t.cta_p}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/helpers"
                  className="inline-block px-8 py-3.5 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white font-bold text-base shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                  {t.cta_btn_browse}
                </Link>
                <Link
                  href="/employer-register"
                  className="inline-block px-8 py-3.5 rounded-2xl bg-white border-2 border-primary text-primary font-bold text-base hover:bg-primary/5 transition-colors"
                >
                  {t.cta_btn_emp}
                </Link>
              </div>
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
                    <li><Link className="text-slate-500 hover:text-primary text-sm whitespace-nowrap" href="/#benefits">{t.footer_find}</Link></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm whitespace-nowrap" href="/#categories">{t.footer_hire}</Link></li>
                    <li><Link className="text-slate-500 hover:text-primary text-sm whitespace-nowrap" href="/employers">{t.footer_employers}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_company}</h4>
                  <ul className="space-y-3">
                    <li><a className="text-slate-500 hover:text-primary text-sm whitespace-nowrap" href="mailto:support@thaihelper.app">{t.footer_contact}</a></li>
                    <li><a className="text-slate-500 hover:text-primary text-sm whitespace-nowrap" href="https://lin.ee/U7B1KX6" target="_blank" rel="noopener noreferrer">{t.footer_line}</a></li>
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
