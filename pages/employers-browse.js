import { useState, useEffect, useMemo } from 'react';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import Link from 'next/link';
import { useLang } from './_app';
import LangSwitcher from '@/components/LangSwitcher';
import { fetchEmployers } from '@/lib/api/employers';
import { CITIES } from '@/lib/constants/cities';

// ─── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    nav_helpers:    'For Helpers',
    nav_helpers_q:  'Looking for work?',
    nav_home:       'Home',
    nav_login:      'Login',
    nav_cta:        'Register Free',
    hero_badge:     '🇹🇭 Find Employers in Thailand',
    hero_h1:        'Browse Employer Listings',
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
    live_in:        'Live-in',
    live_out:       'Live-out',
    either:         'Either',
    cta_title:      'Are you a helper looking for work?',
    cta_sub:        'Create your free profile and let families find you.',
    cta_btn:        'Register Now — Free',
    footer_privacy: 'Privacy Policy',
    footer_terms:   'Terms of Service',
  },
  th: {
    nav_helpers:    'สำหรับผู้ช่วย',
    nav_helpers_q:  'กำลังหางาน?',
    nav_home:       'หน้าแรก',
    nav_login:      'เข้าสู่ระบบ',
    nav_cta:        'ลงทะเบียนฟรี',
    hero_badge:     '🇹🇭 หานายจ้างในประเทศไทย',
    hero_h1:        'ค้นหาประกาศรับสมัครงาน',
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
    live_in:        'อยู่ประจำ',
    live_out:       'ไป-กลับ',
    either:         'ทั้งสองแบบ',
    cta_title:      'คุณเป็นผู้ช่วยที่กำลังหางานอยู่หรือเปล่า?',
    cta_sub:        'สร้างโปรไฟล์ฟรีเพื่อให้ครอบครัวค้นหาคุณ',
    cta_btn:        'ลงทะเบียนฟรี',
    footer_privacy: 'นโยบายความเป็นส่วนตัว',
    footer_terms:   'ข้อกำหนดการใช้งาน',
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filtered.map((emp, i) => (
                    <PublicEmployerCard
                      key={emp.ref || `reg-${i}`}
                      employer={emp}
                      t={t}
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

        {/* ── FOOTER ── */}
        <footer className="bg-gray-100 border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6 text-center text-sm text-gray-600">
            <p>&copy; 2026 ThaiHelper &middot; <a className="hover:text-[#006a62]" href="mailto:support@thaihelper.app">support@thaihelper.app</a></p>
            <p className="mt-2">
              <Link className="hover:text-[#006a62]" href="/privacy">{t.footer_privacy}</Link>
              {' \u00b7 '}
              <Link className="hover:text-[#006a62]" href="/terms">{t.footer_terms}</Link>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PublicEmployerCard({ employer, t, arrangementLabel }) {
  const e = employer;
  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      padding: '20px', border: '1px solid #e5e7eb',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={ev => { ev.currentTarget.style.transform = 'translateY(-2px)'; ev.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'; }}
      onMouseLeave={ev => { ev.currentTarget.style.transform = 'none'; ev.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: '#e6f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, border: '2px solid #006a62',
        }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#006a62' }}>
            {(e.firstName || '?').charAt(0).toUpperCase()}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a1a' }}>
              {e.firstName} {e.lastName}
            </span>
            {e.city && (
              <span style={{ fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {e.city}{e.area ? `, ${e.area}` : ''}
              </span>
            )}
          </div>

          {e.lookingFor && (
            <div style={{ fontSize: '14px', color: '#374151', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: '#666' }}>{t.card_looking}:</span>{' '}
              {e.lookingFor}
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {e.arrangementPreference && (
              <span style={{ fontSize: '13px', color: '#666' }}>
                {t.card_arrangement}: <strong>{arrangementLabel(e.arrangementPreference)}</strong>
              </span>
            )}
            {e.preferredAgeRange && (
              <span style={{ fontSize: '13px', color: '#666' }}>
                {t.card_age_pref}: <strong>{e.preferredAgeRange}</strong>
              </span>
            )}
          </div>

          {e.jobDescription && (
            <p style={{
              fontSize: '14px', color: '#555', lineHeight: 1.5,
              margin: '0 0 10px',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            }}>
              {e.jobDescription}
            </p>
          )}

          <Link
            href="/register"
            style={{
              display: 'inline-block',
              padding: '10px 20px', borderRadius: '10px',
              background: '#006a62', color: 'white',
              fontSize: '14px', fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {t.card_cta} &rarr;
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
