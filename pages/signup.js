import Link from 'next/link';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu } from '@/components/MobileMenu';
import { useLang } from '@/pages/_app';
import { Users, Briefcase, ArrowRight } from 'lucide-react';

const T = {
  en: {
    page_title: 'Sign up – ThaiHelper',
    h1: 'Join ThaiHelper',
    sub: 'First, tell us who you are. It only takes a minute and it’s completely free.',
    family_title: 'I’m a family',
    family_desc: 'I’m looking to hire a nanny, housekeeper, cook, driver or caregiver — directly, no agency.',
    helper_title: 'I’m a helper',
    helper_desc: 'I’m looking for work. Create a profile and get found by families hiring directly.',
    cta: 'Continue',
    have_account: 'Already have an account?',
    login_link: 'Login',
  },
  th: {
    page_title: 'ลงทะเบียน – ThaiHelper',
    h1: 'เข้าร่วม ThaiHelper',
    sub: 'ก่อนอื่น บอกเราว่าคุณเป็นใคร ใช้เวลาเพียงนาทีเดียวและฟรี 100%',
    family_title: 'ฉันเป็นครอบครัว',
    family_desc: 'ฉันกำลังมองหาพี่เลี้ยงเด็ก แม่บ้าน พ่อครัว คนขับรถ หรือผู้ดูแล โดยตรง ไม่ผ่านเอเจนซี่',
    helper_title: 'ฉันเป็นผู้ช่วย',
    helper_desc: 'ฉันกำลังหางาน สร้างโปรไฟล์เพื่อให้ครอบครัวที่จ้างโดยตรงพบคุณ',
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
          <div style={{ maxWidth: '720px', width: '100%' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 700, marginBottom: '8px', color: 'var(--gray-900)', textAlign: 'center' }}>
              {t.h1}
            </h1>
            <p style={{ fontSize: '17px', color: 'var(--gray-500)', marginBottom: '28px', textAlign: 'center' }}>
              {t.sub}
            </p>

            <div className="signup-choices">
              <Link href="/employer-register" className="signup-choice signup-choice--family">
                <div className="signup-choice__icon" style={{ background: '#fdf0e0', color: '#b86a1f' }}>
                  <Users size={28} strokeWidth={2} />
                </div>
                <h2>{t.family_title}</h2>
                <p>{t.family_desc}</p>
                <span className="signup-choice__cta" style={{ color: '#b86a1f' }}>
                  {t.cta} <ArrowRight size={16} />
                </span>
              </Link>

              <Link href="/register" className="signup-choice signup-choice--helper">
                <div className="signup-choice__icon" style={{ background: '#e6f5f3', color: '#006a62' }}>
                  <Briefcase size={28} strokeWidth={2} />
                </div>
                <h2>{t.helper_title}</h2>
                <p>{t.helper_desc}</p>
                <span className="signup-choice__cta" style={{ color: '#006a62' }}>
                  {t.cta} <ArrowRight size={16} />
                </span>
              </Link>
            </div>

            <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '15px', color: 'var(--gray-500)' }}>
              {t.have_account}{' '}
              <Link href="/login" style={{ color: '#006a62', fontWeight: 600 }}>{t.login_link}</Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .signup-choices {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 600px) {
          .signup-choices {
            grid-template-columns: 1fr;
          }
        }
        .signup-choice {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 28px;
          border-radius: 18px;
          background: #fff;
          border: 1.5px solid var(--gray-200, #e5e7eb);
          text-decoration: none;
          transition: all 0.18s ease;
        }
        .signup-choice:hover {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }
        .signup-choice--family:hover { border-color: #f4a261; }
        .signup-choice--helper:hover { border-color: #006a62; }
        .signup-choice__icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 14px;
          margin-bottom: 16px;
        }
        .signup-choice h2 {
          font-size: 20px;
          font-weight: 700;
          color: var(--gray-900, #111827);
          margin: 0 0 8px;
        }
        .signup-choice p {
          font-size: 15px;
          line-height: 1.5;
          color: var(--gray-500, #6b7280);
          margin: 0 0 18px;
          flex: 1;
        }
        .signup-choice__cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          font-weight: 600;
        }
      `}</style>
    </>
  );
}
