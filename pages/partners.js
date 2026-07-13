import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useLang } from '@/pages/_app';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu, ResourcesDropdown } from '@/components/MobileMenu';
import { DIRECTORY_TYPES } from '@/lib/constants/directory';

const T = {
  en: {
    nav_employers: 'For Families',
    nav_helpers: 'For Helpers',
    nav_blog: 'Blog',
    nav_login: 'Login',
    nav_cta: 'Register – Free',
    nav_resources: 'Resources',
    nav_browse_helpers: 'Browse Helpers',
    nav_wizard: 'Work Permit Wizard',
    nav_directory_back: 'Expert Directory',
    nav_employers_link: 'For Families',
    nav_about: 'About',
    nav_faq: 'FAQ',

    meta_title: 'List Your Company · ThaiHelper',
    meta_desc: 'Get listed on ThaiHelper — reach families looking for household staff across Thailand.',
    hero_title: 'Get your company listed on',
    hero_sub: 'We list staffing agencies, service companies, immigration lawyers, visa agents and more in our Expert Directory — so families who need professional support can find you.',
    form_title: 'Register your interest',
    label_company: 'Company name *',
    label_contact: 'Contact person',
    label_email: 'Email address *',
    label_phone: 'Phone / LINE',
    label_type: 'Type *',
    ph_company: 'Your company name',
    ph_contact: 'e.g. Somchai Jaidee',
    ph_phone: '+66 2-xxx-xxxx or @lineID',
    submit: 'Send',
    submitting: 'Sending...',
    success_title: 'Thanks for your interest!',
    success_body: "We've received your details and will be in touch within a few days to get your company listed.",
    success_cta: 'Browse the Expert Directory',
    error: 'Something went wrong. Please email support@thaihelper.app.',
    login_existing: 'Already approved?',
    login_cta: 'Company login →',

    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_privacy: 'Privacy',
    footer_login: 'Company login',
    footer_terms: 'Terms',
  },
  th: {
    nav_employers: 'สำหรับครอบครัว',
    nav_helpers: 'สำหรับผู้ช่วย',
    nav_blog: 'บล็อก',
    nav_login: 'เข้าสู่ระบบ',
    nav_cta: 'สมัคร – ฟรี',
    nav_resources: 'แหล่งข้อมูล',
    nav_browse_helpers: 'ดูผู้ช่วย',
    nav_wizard: 'ตัวช่วยใบอนุญาตทำงาน',
    nav_directory_back: 'รายชื่อผู้เชี่ยวชาญ',
    nav_employers_link: 'สำหรับครอบครัว',
    nav_about: 'เกี่ยวกับเรา',
    nav_faq: 'คำถามที่พบบ่อย',

    meta_title: 'ลงทะเบียนบริษัทของคุณ · ThaiHelper',
    meta_desc: 'ลงรายชื่อบนไทยเฮลเปอร์ — เข้าถึงครอบครัวที่ต้องการพนักงานดูแลบ้านทั่วประเทศไทย',
    hero_title: 'ลงรายชื่อบริษัทของคุณบน',
    hero_sub: 'เราลงรายชื่อบริษัทจัดหาแรงงาน บริษัทบริการ ทนายความตรวจคนเข้าเมือง ตัวแทนวีซ่า และอื่นๆ ใน Expert Directory เพื่อให้ครอบครัวที่ต้องการความช่วยเหลือมืออาชีพค้นหาคุณเจอ',
    form_title: 'ลงทะเบียนความสนใจ',
    label_company: 'ชื่อบริษัท *',
    label_contact: 'ผู้ติดต่อ',
    label_email: 'อีเมล *',
    label_phone: 'โทรศัพท์ / LINE',
    label_type: 'ประเภท *',
    ph_company: 'ชื่อบริษัทของคุณ',
    ph_contact: 'เช่น สมชาย ใจดี',
    ph_phone: '+66 2-xxx-xxxx หรือ @lineID',
    submit: 'ส่ง',
    submitting: 'กำลังส่ง...',
    success_title: 'ขอบคุณสำหรับความสนใจ!',
    success_body: 'เราได้รับข้อมูลของคุณแล้ว และจะติดต่อกลับภายในไม่กี่วันเพื่อนำบริษัทของคุณขึ้นรายชื่อ',
    success_cta: 'ดู Expert Directory',
    login_existing: 'ได้รับอนุมัติแล้ว?',
    login_cta: 'เข้าสู่ระบบบริษัท →',
    error: 'เกิดข้อผิดพลาด กรุณาส่งอีเมลมาที่ support@thaihelper.app',

    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_privacy: 'ความเป็นส่วนตัว',
    footer_login: 'เข้าสู่ระบบบริษัท',
    footer_terms: 'ข้อกำหนด',
  },
};

// Mirror the directory taxonomy (Staffing Agency, Service Company, Lawyer,
// Visa Agent, MOU Agency, Training, Partner, Association) + an 'other'
// catch-all, so every kind of provider can self-register.
const TYPE_OPTIONS = [...DIRECTORY_TYPES, { value: 'other', en: 'Other', th: 'อื่นๆ' }];

export default function Partners() {
  const { lang } = useLang();
  const t = T[lang] || T.en;

  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', type: '' });
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/partner-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const inputCls = 'w-full border border-slate-200 rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white';
  const labelCls = 'block text-sm font-semibold text-slate-700 mb-1.5';

  const navItems = [
    { href: '/directory',           label: t.nav_directory_back },
    { href: '/helpers',             label: t.nav_browse_helpers },
    { href: '/work-permit-wizard',  label: t.nav_wizard },
    { href: '/employers',           label: t.nav_employers_link },
    { href: '/about',               label: t.nav_about },
    { href: '/faq',                 label: t.nav_faq },
    { href: '/blog',                label: t.nav_blog },
  ];

  return (
    <>
      <Head>
        <title>{t.meta_title}</title>
        <meta name="description" content={t.meta_desc} />
      </Head>

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
        </nav>

        <main className="pt-24 md:pt-28">
          {/* HERO — full width, centred, on-brand teal tint */}
          <div className="bg-gradient-to-b from-[#E8F7F5] to-background px-4 py-10 md:py-16 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-[#1B3A4B] max-w-2xl mx-auto leading-tight">
              {t.hero_title}{' '}
              <span className="whitespace-nowrap">Thai<span className="text-primary">Helper</span></span>
            </h1>
            <p className="text-base md:text-lg text-on-surface-variant max-w-xl mx-auto mt-3 leading-relaxed">
              {t.hero_sub}
            </p>
          </div>

          {/* FORM — wider, centred */}
          <div className="max-w-2xl mx-auto px-4 py-10 md:py-12">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
              {status === 'success' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold font-headline text-[#1B3A4B] mb-2">{t.success_title}</h2>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6 leading-relaxed">{t.success_body}</p>
                  <Link href="/directory" className="inline-block bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-primary-container transition">
                    {t.success_cta}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-lg font-bold text-slate-900">{t.form_title}</h2>

                  <div>
                    <label className={labelCls}>{t.label_company}</label>
                    <input required className={inputCls} value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      placeholder={t.ph_company} />
                  </div>

                  <div>
                    <label className={labelCls}>{t.label_contact}</label>
                    <input className={inputCls} value={form.contactName}
                      onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                      placeholder={t.ph_contact} />
                  </div>

                  <div>
                    <label className={labelCls}>{t.label_email}</label>
                    <input required type="email" className={inputCls} value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="info@yourcompany.com" />
                  </div>

                  <div>
                    <label className={labelCls}>{t.label_phone}</label>
                    <input className={inputCls} value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder={t.ph_phone} />
                  </div>

                  <div>
                    <label className={labelCls}>{t.label_type}</label>
                    <div className="flex flex-wrap gap-2">
                      {TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm({ ...form, type: opt.value })}
                          className={`px-3.5 py-2 rounded-lg border text-xs font-medium transition ${
                            form.type === opt.value
                              ? 'bg-primary border-primary text-white'
                              : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {opt[lang] || opt.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {status === 'error' && <p className="text-red-600 text-xs">{t.error}</p>}

                  <button
                    type="submit"
                    disabled={status === 'loading' || !form.type}
                    className="w-full bg-primary hover:bg-primary-container disabled:opacity-40 text-white font-semibold text-sm py-3.5 rounded-xl transition"
                  >
                    {status === 'loading' ? t.submitting : t.submit}
                  </button>
                </form>
              )}
            </div>

            <p className="mt-5 text-center text-sm text-slate-500">
              {t.login_existing}{' '}
              <Link href="/business-login" className="font-semibold text-primary hover:underline">{t.login_cta}</Link>
            </p>
          </div>
        </main>

        <footer className="w-full bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto py-10 px-6 text-center">
            <p className="text-slate-400 text-xs leading-relaxed max-w-3xl mx-auto mb-2">{t.footer_desc}</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-500 mt-3">
              <Link href="/business-login" className="font-medium text-primary hover:underline">{t.footer_login}</Link>
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
