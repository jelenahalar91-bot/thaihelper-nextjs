import Link from 'next/link';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu } from '@/components/MobileMenu';
import { useLang } from '@/pages/_app';
import { Users, Briefcase, ArrowRight } from 'lucide-react';

const T = {
  en: {
    page_title: 'Sign up – ThaiHelper',
    h1: 'Join',
    sub: 'First, tell us who you are. It only takes a minute and it’s completely free.',
    family_title: 'I’m a family',
    family_desc: 'I’m looking to hire.',
    helper_title: 'I’m a helper',
    helper_desc: 'I’m looking for a job.',
    cta: 'Continue',
    have_account: 'Already have an account?',
    login_link: 'Login',
  },
  th: {
    page_title: 'ลงทะเบียน – ThaiHelper',
    h1: 'เข้าร่วม',
    sub: 'ก่อนอื่น บอกเราว่าคุณเป็นใคร ใช้เวลาเพียงนาทีเดียวและฟรี 100%',
    family_title: 'ฉันเป็นครอบครัว',
    family_desc: 'ฉันต้องการจ้างผู้ช่วย',
    helper_title: 'ฉันเป็นผู้ช่วย',
    helper_desc: 'ฉันกำลังหางาน',
    cta: 'ดำเนินการต่อ',
    have_account: 'มีบัญชีอยู่แล้ว?',
    login_link: 'เข้าสู่ระบบ',
  },
};

export default function SignupChooserPage() {
  const { lang, setLang: changeLang } = useLang();
  const t = T[lang] || T.en;

  return (
    <>
      <SEOHead
        title={t.page_title}
        description="Sign up for free on ThaiHelper as a family looking to hire household help, or as a helper looking for work."
        path="/signup"
        lang={lang}
        jsonLd={getBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Sign up', path: '/signup' },
        ])}
      />

      <div className="register-body">
        <nav className="register-nav">
          <Link href="/" className="brand">Thai<span>Helper</span></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LangSwitcher value={lang} onChange={changeLang} languages={['en', 'th']} />
            <MobileMenu
              items={[
                { href: '/',                    label: lang === 'th' ? 'หน้าแรก' : 'Home' },
                { href: '/employers',           label: lang === 'th' ? 'สำหรับครอบครัว' : 'For Families' },
                { href: '/helpers',             label: lang === 'th' ? 'ดูผู้ช่วย' : 'Browse Helpers' },
                { href: '/work-permit-wizard',  label: lang === 'th' ? 'ตัวช่วยใบอนุญาตทำงาน' : 'Work Permit Wizard' },
                { href: '/directory',           label: lang === 'th' ? 'รายชื่อผู้เชี่ยวชาญ' : 'Expert Directory' },
                { href: '/about',               label: lang === 'th' ? 'เกี่ยวกับเรา' : 'About' },
                { href: '/faq',                 label: lang === 'th' ? 'คำถามที่พบบ่อย' : 'FAQ' },
                { href: '/blog',                label: lang === 'th' ? 'บล็อก' : 'Blog' },
              ]}
              secondaryCta={{ href: '/login', label: lang === 'th' ? 'เข้าสู่ระบบ' : 'Login' }}
            />
          </div>
        </nav>

        <div className="register-container">
          <div className="w-full max-w-3xl">
            <h1
              className="text-center text-3xl md:text-4xl font-extrabold mb-2"
              style={{ color: 'var(--navy)', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.3px' }}
            >
              {t.h1} Thai<span style={{ color: '#006a62' }}>Helper</span>
            </h1>
            <p className="text-center text-[17px] text-gray-500 mb-7">
              {t.sub}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/employer-register"
                className="group flex h-full flex-col items-start rounded-2xl border border-gray-200 bg-white p-7 no-underline transition-all hover:-translate-y-0.5 hover:border-[#F4A261] hover:shadow-xl"
              >
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: '#fdf0e0', color: '#b86a1f' }}>
                  <Users size={28} strokeWidth={2} />
                </div>
                <h2 className="mb-2 text-xl font-bold" style={{ color: 'var(--navy)' }}>{t.family_title}</h2>
                <p className="mb-5 flex-grow text-[15px] leading-relaxed text-gray-500">{t.family_desc}</p>
                <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold" style={{ color: '#b86a1f' }}>
                  {t.cta} <ArrowRight size={16} />
                </span>
              </Link>

              <Link
                href="/register"
                className="group flex h-full flex-col items-start rounded-2xl border border-gray-200 bg-white p-7 no-underline transition-all hover:-translate-y-0.5 hover:border-[#006a62] hover:shadow-xl"
              >
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: '#e6f5f3', color: '#006a62' }}>
                  <Briefcase size={28} strokeWidth={2} />
                </div>
                <h2 className="mb-2 text-xl font-bold" style={{ color: 'var(--navy)' }}>{t.helper_title}</h2>
                <p className="mb-5 flex-grow text-[15px] leading-relaxed text-gray-500">{t.helper_desc}</p>
                <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold" style={{ color: '#006a62' }}>
                  {t.cta} <ArrowRight size={16} />
                </span>
              </Link>
            </div>

            <p className="mt-7 text-center text-[15px] text-gray-500">
              {t.have_account}{' '}
              <Link href="/login" className="font-semibold" style={{ color: '#006a62' }}>{t.login_link}</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
