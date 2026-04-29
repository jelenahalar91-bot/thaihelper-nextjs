import { useState, useEffect, useMemo } from 'react';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import Link from 'next/link';
import { useLang } from './_app';
import LangSwitcher from '@/components/LangSwitcher';
import { fetchEmployers } from '@/lib/api/employers';
import { CITIES } from '@/lib/constants/cities';
import { SKILLS_BY_CATEGORY } from '@/lib/constants/categories';
import { SCHEDULE_DAYS, SCHEDULE_TIMES, DURATIONS, CHILD_AGE_GROUPS, formatSlugList } from '@/lib/constants/employer';

// ─── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    nav_helpers:    'For Helpers',
    nav_helpers_q:  'Looking for work?',
    nav_home:       'Home',
    nav_blog:       'Blog',
    nav_login:      'Login',
    nav_cta:        'Register Free',
    hero_badge:     '🇹🇭 Find Families Hiring in Thailand',
    hero_h1:        'Browse Job Listings',
    hero_sub:       'See who is looking for household help — nannies, housekeepers, chefs, drivers and more.',
    filter_title:   'Filters',
    filter_show:    'Filters',
    filter_show_results: 'Show {n} results',
    filter_city_label: 'City',
    filter_city:    'All Cities',
    filter_looking_label: 'Looking For',
    filter_looking_all: 'All Types',
    filter_area_label: 'Area',
    filter_area_ph: 'Search by area...',
    filter_reset:   'Reset filters',
    results:        'employers found',
    no_results:     'No employers found',
    no_results_sub: 'Check back soon — new employers register every day.',
    card_looking:   'Looking for',
    card_arrangement: 'Arrangement',
    card_age_pref:  'Preferred age',
    card_cta:       'Register as Helper to Apply',
    card_signin:    'Sign in to apply',
    card_employer_badge: 'Family',
    card_tasks:     'Tasks',
    live_in:        'Live-in',
    live_out:       'Live-out',
    either:         'Either',
    cta_title:      'Are you a helper looking for work?',
    cta_sub:        'Create your free profile and let families find you.',
    cta_btn:        'Register Now — Free',
    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_product: 'Product', footer_find: 'Benefits', footer_hire: 'Categories', footer_pricing: 'Pricing', footer_employers: 'For Families',
    footer_company: 'Company', footer_contact: 'Contact', footer_line: 'LINE', footer_about: 'About', footer_faq: 'FAQ',
    footer_legal: 'Legal', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
    footer_disclaimer: 'ThaiHelper.app is operated by Planet Bamboo GmbH (Germany). We are not a recruitment agency and do not provide placement services. The platform is currently free to use. All transactions are processed offshore via LemonSqueezy. Compliance with Thai labor and immigration laws is the sole responsibility of the users.',
  },
  th: {
    nav_helpers:    'สำหรับผู้ช่วย',
    nav_helpers_q:  'กำลังหางาน?',
    nav_home:       'หน้าแรก',
    nav_blog:       'บล็อก',
    nav_login:      'เข้าสู่ระบบ',
    nav_cta:        'ลงทะเบียนฟรี',
    hero_badge:     '🇹🇭 หาครอบครัวที่กำลังจ้างงานในไทย',
    hero_h1:        'ค้นหาประกาศงาน',
    hero_sub:       'ดูว่าใครกำลังหาผู้ช่วย — พี่เลี้ยง แม่บ้าน พ่อครัว คนขับรถ และอื่นๆ',
    filter_title:   'ตัวกรอง',
    filter_show:    'ตัวกรอง',
    filter_show_results: 'แสดง {n} รายการ',
    filter_city_label: 'จังหวัด',
    filter_city:    'ทุกจังหวัด',
    filter_looking_label: 'กำลังหา',
    filter_looking_all: 'ทุกประเภท',
    filter_area_label: 'ย่าน',
    filter_area_ph: 'ค้นหาตามย่าน...',
    filter_reset:   'ล้างตัวกรอง',
    results:        'นายจ้างที่พบ',
    no_results:     'ไม่พบนายจ้าง',
    no_results_sub: 'กลับมาดูอีกครั้ง — มีนายจ้างใหม่ลงทะเบียนทุกวัน',
    card_looking:   'กำลังหา',
    card_arrangement: 'รูปแบบ',
    card_age_pref:  'อายุที่ต้องการ',
    card_cta:       'ลงทะเบียนเป็นผู้ช่วยเพื่อสมัคร',
    card_signin:    'เข้าสู่ระบบเพื่อสมัคร',
    card_employer_badge: 'ครอบครัว',
    card_tasks:     'งาน',
    live_in:        'อยู่ประจำ',
    live_out:       'ไป-กลับ',
    either:         'ทั้งสองแบบ',
    cta_title:      'คุณเป็นผู้ช่วยที่กำลังหางานอยู่หรือเปล่า?',
    cta_sub:        'สร้างโปรไฟล์ฟรีเพื่อให้ครอบครัวค้นหาคุณ',
    cta_btn:        'ลงทะเบียนฟรี',
    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_product: 'ผลิตภัณฑ์', footer_find: 'ประโยชน์', footer_hire: 'หมวดหมู่', footer_pricing: 'ราคา', footer_employers: 'สำหรับครอบครัว',
    footer_company: 'บริษัท', footer_contact: 'ติดต่อ', footer_line: 'LINE', footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย',
    footer_legal: 'กฎหมาย', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'ข้อกำหนดการใช้งาน',
    footer_disclaimer: 'ThaiHelper.app ดำเนินการโดย Planet Bamboo GmbH (ประเทศเยอรมนี) เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางาน แพลตฟอร์มให้บริการฟรีในปัจจุบัน ธุรกรรมทั้งหมดดำเนินการผ่าน LemonSqueezy การปฏิบัติตามกฎหมายแรงงานและกฎหมายตรวจคนเข้าเมืองของไทยเป็นความรับผิดชอบของผู้ใช้แต่เพียงผู้เดียว',
  },
};

export default function EmployersBrowse() {
  const { lang } = useLang();
  const t = T[lang] || T.en;
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterCity, setFilterCity] = useState('');
  const [filterLooking, setFilterLooking] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchEmployers();
        setEmployers(data.employers || []);
      } catch (err) {
        console.error('Failed to load employers:', err);
        setEmployers([]);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => employers.filter(e => {
    if (filterCity && e.city?.toLowerCase() !== filterCity.toLowerCase()) return false;
    if (filterLooking && !e.lookingFor?.toLowerCase().includes(filterLooking.toLowerCase())) return false;
    if (filterArea && !e.area?.toLowerCase().includes(filterArea.toLowerCase())) return false;
    return true;
  }), [employers, filterCity, filterLooking, filterArea]);

  const activeFilterCount =
    (filterCity ? 1 : 0) + (filterLooking ? 1 : 0) + (filterArea ? 1 : 0);

  const resetFilters = () => {
    setFilterCity('');
    setFilterLooking('');
    setFilterArea('');
  };

  const lookingForOptions = [...new Set(
    employers
      .flatMap(e => (e.lookingFor || '').split(/,\s*/))
      .filter(Boolean)
      .map(s => s.trim())
  )].sort();

  const arrangementLabel = (val) => {
    if (val === 'live_in') return t.live_in;
    if (val === 'live_out') return t.live_out;
    if (val === 'either') return t.either;
    return val || '';
  };

  return (
    <>
      <SEOHead
        title="Browse Employers – Find Families Looking for Help"
        description="Browse employer listings in Thailand. See who is looking for nannies, housekeepers, chefs, drivers, gardeners and more."
        path="/employers-browse"
        lang={lang}
        jsonLd={getBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Browse Employers', path: '/employers-browse' }])}
      />

      <div className={`min-h-screen bg-gray-50 ${lang === 'th' ? 'lang-th' : ''}`}>

        {/* ── UTILITY TOP BAR ── */}
        <div className="w-full bg-[#001b3d] text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-2.5 flex justify-center md:justify-end items-center text-xs md:text-sm">
            <Link href="/helpers" className="font-medium hover:text-gold transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <span className="opacity-80 hidden sm:inline">{t.nav_helpers_q}</span>
              <span className="font-bold">{t.nav_helpers} &rarr;</span>
            </Link>
          </div>
        </div>

        {/* ── NAV ── */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between w-full">
            <Link href="/" className="text-xl md:text-2xl font-bold">
              Thai<span style={{color:'#006a62'}}>Helper</span>
            </Link>
            <div className="flex items-center gap-2 md:gap-3">
              <Link href="/" className="hidden sm:inline text-sm font-semibold text-gray-700 hover:text-[#006a62] transition-colors">
                {t.nav_home}
              </Link>
              <Link href="/blog" className="hidden sm:inline text-sm font-semibold text-gray-700 hover:text-[#006a62] transition-colors">
                {t.nav_blog}
              </Link>
              <Link href="/login" className="hidden sm:inline text-sm font-semibold text-gray-700 hover:text-[#006a62] transition-colors">
                {t.nav_login}
              </Link>
              <LangSwitcher languages={['en', 'th', 'ru']} />
              <Link
                href="/register"
                className="px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-gradient-to-br from-[#006a62] to-[#004d47] text-white text-xs md:text-sm font-semibold hover:shadow-lg transition-all"
              >
                {t.nav_cta}
              </Link>
            </div>
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14 text-center">
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-[#e6f5f3] text-[#006a62] text-xs md:text-sm font-bold">
              {t.hero_badge}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3">
              {t.hero_h1}
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              {t.hero_sub}
            </p>
          </div>
        </section>

        {/* ── BROWSE (sidebar + results) ── */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Desktop sidebar */}
            <aside
              className="empb-sidebar-desktop"
              style={{ width: '260px', flexShrink: 0, position: 'sticky', top: '80px' }}
            >
              <EmpBrowseSidebar
                t={t}
                filterCity={filterCity} setFilterCity={setFilterCity}
                filterLooking={filterLooking} setFilterLooking={setFilterLooking}
                filterArea={filterArea} setFilterArea={setFilterArea}
                activeFilterCount={activeFilterCount}
                resetFilters={resetFilters}
                lookingForOptions={lookingForOptions}
              />
            </aside>

            {/* Main results */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '12px', marginBottom: '14px', flexWrap: 'wrap',
              }}>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <strong style={{ color: '#1a1a1a', fontSize: '15px' }}>{filtered.length}</strong>{' '}
                  {t.results}
                </div>

                <button
                  className="empb-mobile-btn"
                  onClick={() => setMobileFiltersOpen(true)}
                  style={{
                    display: 'none',
                    alignItems: 'center', gap: '8px',
                    padding: '9px 16px', borderRadius: '10px',
                    border: '1px solid #006a62', background: 'white',
                    color: '#006a62', fontSize: '14px', fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  {t.filter_show}
                  {activeFilterCount > 0 && (
                    <span style={{
                      background: '#006a62', color: 'white',
                      borderRadius: '999px', padding: '1px 8px',
                      fontSize: '12px', fontWeight: 800,
                    }}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-[#006a62] rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t.no_results}</h3>
                  <p className="text-sm text-gray-600 mb-4">{t.no_results_sub}</p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="px-5 py-2.5 rounded-lg border border-[#006a62] text-[#006a62] text-sm font-semibold hover:bg-[#006a62] hover:text-white transition-colors"
                    >
                      {t.filter_reset}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filtered.map((emp, i) => (
                    <PublicEmployerCard
                      key={emp.ref || `reg-${i}`}
                      employer={emp}
                      t={t}
                      lang={lang}
                      arrangementLabel={arrangementLabel}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Mobile filter sheet */}
            {mobileFiltersOpen && (
              <div
                onClick={() => setMobileFiltersOpen(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 900,
                  background: 'rgba(15,23,42,0.5)',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                }}
              >
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    background: 'white', width: '100%', maxWidth: '480px',
                    maxHeight: '85vh', borderRadius: '20px 20px 0 0',
                    padding: '20px', overflowY: 'auto',
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                      {t.filter_title}
                    </h3>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      style={{
                        background: '#f3f4f6', border: 'none',
                        width: '32px', height: '32px', borderRadius: '50%',
                        cursor: 'pointer', fontSize: '16px', color: '#666',
                      }}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                  <EmpBrowseSidebar
                    t={t}
                    filterCity={filterCity} setFilterCity={setFilterCity}
                    filterLooking={filterLooking} setFilterLooking={setFilterLooking}
                    filterArea={filterArea} setFilterArea={setFilterArea}
                    activeFilterCount={activeFilterCount}
                    resetFilters={resetFilters}
                    lookingForOptions={lookingForOptions}
                  />
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    style={{
                      width: '100%', marginTop: '16px',
                      padding: '13px 20px', borderRadius: '12px', border: 'none',
                      background: '#006a62', color: 'white',
                      fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {t.filter_show_results.replace('{n}', filtered.length)}
                  </button>
                </div>
              </div>
            )}
          </div>

          <style jsx>{`
            @media (max-width: 900px) {
              :global(.empb-sidebar-desktop) { display: none !important; }
              :global(.empb-mobile-btn) { display: inline-flex !important; }
            }
          `}</style>
        </section>

        {/* ── CTA FOR HELPERS ── */}
        <section className="bg-gradient-to-br from-[#006a62] to-[#004d47] text-white py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{t.cta_title}</h2>
            <p className="text-base md:text-lg opacity-90 mb-6">{t.cta_sub}</p>
            <Link
              href="/register"
              className="inline-block px-7 py-3.5 rounded-full bg-white text-[#006a62] text-base font-bold hover:shadow-2xl transition-all"
            >
              {t.cta_btn} &rarr;
            </Link>
          </div>
        </section>

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
                  <a aria-label="LINE Official Account" className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center text-white hover:opacity-80 transition-all" href="https://lin.ee/U7B1KX6" target="_blank" rel="noopener noreferrer">                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>                 </a>
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
                    <li><a className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="https://lin.ee/U7B1KX6" target="_blank" rel="noopener noreferrer">{t.footer_line}</a></li>
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

// ─── Sub-components ──────────────────────────────────────────────────────────

// Mirrors HelperCard layout (components/HelperCard.jsx) so /helpers and
// /employers-browse feel like two views of the same product. Falls back
// to a coloured initial tile when no photo is present.
function PublicEmployerCard({ employer, t, arrangementLabel, lang }) {
  const e = employer;
  const initial = (e.firstName || '?').charAt(0).toUpperCase();
  const displayName = [e.firstName, e.lastName].filter(Boolean).join(' ');

  // Build a flattened skill pool covering every category the employer is
  // looking for, then translate the selected `needed_skills` slugs.
  const skillsLabel = (() => {
    if (!e.neededSkills) return '';
    const cats = String(e.lookingFor || '').split(/[,]+/).map(c => c.trim()).filter(Boolean);
    const pool = cats.flatMap(c => SKILLS_BY_CATEGORY[c] || []);
    return formatSlugList(e.neededSkills, pool, lang);
  })();
  const daysLabel     = formatSlugList(e.scheduleDays, SCHEDULE_DAYS, lang);
  const timeLabel     = formatSlugList(e.scheduleTime, SCHEDULE_TIMES, lang);
  const durationLabel = e.duration ? formatSlugList(e.duration, DURATIONS, lang) : '';
  const childLabel    = formatSlugList(e.childAgeGroups, CHILD_AGE_GROUPS, lang);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col sm:flex-row">
      {/* Photo slot — real photo if uploaded, else coloured initial */}
      <div className="relative bg-[#e6f5f3] flex-shrink-0 sm:w-56 aspect-[16/9] sm:aspect-square flex items-center justify-center overflow-hidden">
        {e.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.photo} alt={displayName} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-6xl font-bold text-[#006a62]">{initial}</span>
        )}
        <span className="absolute top-2 left-2 inline-flex items-center px-2 py-1 rounded-full bg-white/95 text-[#006a62] text-[10px] font-bold shadow-sm">
          🏠 {t.card_employer_badge || 'Family'}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6 flex flex-col flex-1 min-w-0 gap-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900 leading-tight">
            {displayName}
          </h3>
          {e.lookingFor && (
            <div className="text-sm text-gray-700 mt-1 font-medium">
              {t.card_looking}: {e.lookingFor}
            </div>
          )}
          {e.city && (
            <div className="text-sm text-gray-500 mt-1">
              📍 {e.city}{e.area ? ` · ${e.area}` : ''}
            </div>
          )}
        </div>

        {skillsLabel && (
          <div className="text-sm text-gray-600">
            <span className="text-gray-400">🛠 {t.card_tasks || 'Tasks'}:</span> {skillsLabel}
          </div>
        )}

        {e.jobDescription && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {e.jobDescription}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 text-sm">
          {e.arrangementPreference && (
            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">
              🏡 {arrangementLabel(e.arrangementPreference)}
            </span>
          )}
          {durationLabel && (
            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">
              ⏳ {durationLabel}
            </span>
          )}
          {daysLabel && (
            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">
              📅 {daysLabel}
            </span>
          )}
          {timeLabel && (
            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">
              🕓 {timeLabel}
            </span>
          )}
          {childLabel && (
            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">
              👶 {childLabel}
            </span>
          )}
          {e.preferredAgeRange && (
            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">
              🎂 {e.preferredAgeRange}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-500 text-center mb-2">
            🔒 {t.card_signin || 'Sign in to apply'}
          </div>
          <Link
            href="/register"
            className="block w-full text-center px-4 py-2.5 rounded-lg bg-[#006a62] text-white text-sm font-bold hover:bg-[#004d47] transition-colors"
          >
            {t.card_cta}
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmpBrowseSidebar({
  t,
  filterCity, setFilterCity,
  filterLooking, setFilterLooking,
  filterArea, setFilterArea,
  activeFilterCount, resetFilters,
  lookingForOptions,
}) {
  const selectStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid #e5e7eb', fontSize: '14px',
    background: 'white', color: '#1a1a1a', cursor: 'pointer',
  };
  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid #e5e7eb', fontSize: '14px',
    background: 'white', color: '#1a1a1a', fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      border: '1px solid #e5e7eb', padding: '18px 18px 8px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '18px', paddingBottom: '14px',
        borderBottom: '1px solid #f3f4f6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#006a62" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#1a1a1a' }}>
            {t.filter_title}
          </h3>
          {activeFilterCount > 0 && (
            <span style={{
              background: '#006a62', color: 'white',
              borderRadius: '999px', padding: '1px 8px',
              fontSize: '11px', fontWeight: 800,
            }}>
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            style={{
              background: 'none', border: 'none',
              color: '#006a62', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', padding: 0, textDecoration: 'underline',
            }}
          >
            {t.filter_reset}
          </button>
        )}
      </div>

      <FG label={t.filter_city_label}>
        <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={selectStyle}>
          <option value="">{t.filter_city}</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </FG>

      <FG label={t.filter_looking_label}>
        <select value={filterLooking} onChange={e => setFilterLooking(e.target.value)} style={selectStyle}>
          <option value="">{t.filter_looking_all}</option>
          {lookingForOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </FG>

      <FG label={t.filter_area_label}>
        <input
          type="text"
          value={filterArea}
          onChange={e => setFilterArea(e.target.value)}
          placeholder={t.filter_area_ph}
          style={inputStyle}
        />
      </FG>
    </div>
  );
}

function FG({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '11px', fontWeight: 800, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: '0.5px',
        marginBottom: '8px',
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}
