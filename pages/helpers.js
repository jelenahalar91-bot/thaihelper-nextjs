import { useState, useEffect, useMemo } from 'react';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import Link from 'next/link';
import { useLang } from './_app';
import LangSwitcher from '@/components/LangSwitcher';
import HelperCard from '@/components/HelperCard';
import { fetchHelpers as fetchHelpersApi } from '@/lib/api/helpers';
import { CITIES } from '@/lib/constants/cities';
import { CATEGORIES, CAT_EMOJI } from '@/lib/constants/categories';

// ─── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    nav_employers:  'For Families',
    nav_employers_q:'Looking to hire a helper?',
    nav_home:       'Home',
    nav_login:      'Login',
    nav_cta:        'Register Free',
    hero_badge:     '🇹🇭 Find Help in Thailand',
    hero_h1:        'Browse Trusted Helpers',
    hero_sub:       'Find nannies, housekeepers, chefs, drivers and more — directly, no middleman.',
    filter_title:   'Filters',
    filter_show_filters: 'Filters',
    filter_show_results: 'Show {n} results',
    filter_city_label:  'City',
    filter_cat_label:   'Category',
    filter_area_label:  'Area',
    filter_age_label:   'Age',
    filter_exp_label:   'Experience (years)',
    filter_lang_label:  'Languages',
    filter_city:    'All Cities',
    filter_cat:     'All Categories',
    filter_area_ph: 'Search by area...',
    filter_reset:   'Reset filters',
    results:        'helpers found',
    no_results:     'No helpers found',
    no_results_sub: 'Try adjusting your filters or check back soon — new helpers register every day.',
    card_exp:       'yrs experience',
    card_signin:    'Sign in to message',
    card_signin_btn:'Login / Register',
    cta_title:      'Are you a helper looking for work?',
    cta_sub:        'Create your free profile and let families find you.',
    cta_btn:        'Register Now — Free →',
    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_product: 'Product', footer_find: 'Benefits', footer_hire: 'Categories', footer_pricing: 'Pricing', footer_employers: 'For Families',
    footer_company: 'Company', footer_contact: 'Contact', footer_about: 'About', footer_faq: 'FAQ',
    footer_legal: 'Legal', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
    footer_disclaimer: 'ThaiHelper.app is a community connection platform, operated from Germany. We are not a recruitment agency and do not provide placement services. The platform is currently 100% free to use. All arrangements are private agreements between users. Compliance with Thai labor and immigration laws is the sole responsibility of the users.',
  },
  th: {
    nav_employers:  'สำหรับครอบครัว',
    nav_employers_q:'กำลังหาผู้ช่วย?',
    nav_home:       'หน้าแรก',
    nav_login:      'เข้าสู่ระบบ',
    nav_cta:        'ลงทะเบียนฟรี',
    hero_badge:     '🇹🇭 หาผู้ช่วยในประเทศไทย',
    hero_h1:        'ค้นหาผู้ช่วยที่ไว้ใจได้',
    hero_sub:       'หาพี่เลี้ยง แม่บ้าน พ่อครัว คนขับรถ และอื่นๆ — โดยตรง ไม่มีคนกลาง',
    filter_title:   'ตัวกรอง',
    filter_show_filters: 'ตัวกรอง',
    filter_show_results: 'แสดง {n} รายการ',
    filter_city_label:  'จังหวัด',
    filter_cat_label:   'ประเภท',
    filter_area_label:  'ย่าน',
    filter_age_label:   'อายุ',
    filter_exp_label:   'ประสบการณ์ (ปี)',
    filter_lang_label:  'ภาษา',
    filter_city:    'ทุกจังหวัด',
    filter_cat:     'ทุกประเภท',
    filter_area_ph: 'ค้นหาตามย่าน...',
    filter_reset:   'ล้างตัวกรอง',
    results:        'ผู้ช่วยที่พบ',
    no_results:     'ไม่พบผู้ช่วย',
    no_results_sub: 'ลองปรับตัวกรอง หรือกลับมาดูอีกครั้ง — มีผู้ช่วยใหม่ลงทะเบียนทุกวัน',
    card_exp:       'ปีประสบการณ์',
    card_signin:    'เข้าสู่ระบบเพื่อส่งข้อความ',
    card_signin_btn:'เข้าสู่ระบบ / ลงทะเบียน',
    cta_title:      'คุณเป็นผู้ช่วยที่กำลังหางานอยู่หรือเปล่า?',
    cta_sub:        'สร้างโปรไฟล์ฟรีเพื่อให้ครอบครัวค้นหาคุณ',
    cta_btn:        'ลงทะเบียนฟรี →',
    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_product: 'ผลิตภัณฑ์', footer_find: 'ประโยชน์', footer_hire: 'หมวดหมู่', footer_pricing: 'ราคา', footer_employers: 'สำหรับครอบครัว',
    footer_company: 'บริษัท', footer_contact: 'ติดต่อ', footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย',
    footer_legal: 'กฎหมาย', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'ข้อกำหนดการใช้งาน',
    footer_disclaimer: 'ThaiHelper.app เป็นแพลตฟอร์มเชื่อมต่อชุมชน ดำเนินการจากประเทศเยอรมนี เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางาน แพลตฟอร์มให้บริการฟรี 100% ในปัจจุบัน ข้อตกลงทั้งหมดเป็นข้อตกลงส่วนตัวระหว่างผู้ใช้ การปฏิบัติตามกฎหมายแรงงานและกฎหมายตรวจคนเข้าเมืองของไทยเป็นความรับผิดชอบของผู้ใช้แต่เพียงผู้เดียว',
  },
};

// `categoryToSlug` accepts either a slug or a display name and returns the
// canonical slug, or null if unknown.
function categoryToSlug(cat) {
  if (!cat) return null;
  const raw = String(cat).trim().toLowerCase();
  if (!raw) return null;
  const bySlug = CATEGORIES.find(c => c.value.toLowerCase() === raw);
  if (bySlug) return bySlug.value;
  const stripped = raw.replace(/[^a-z&\s]/g, '').trim();
  const byName = CATEGORIES.find(c => {
    const en = c.en.toLowerCase().replace(/[^a-z&\s]/g, '').trim();
    return en === stripped || en.startsWith(stripped) || stripped.startsWith(en);
  });
  if (byName) return byName.value;
  const firstWord = stripped.split(/[\s&/,]+/)[0];
  const byFirst = CATEGORIES.find(c =>
    c.value.startsWith(firstWord) || c.en.toLowerCase().includes(firstWord)
  );
  return byFirst ? byFirst.value : null;
}

function categoryWithEmoji(cat) {
  if (!cat) return '';
  const slug = categoryToSlug(cat);
  if (slug) {
    const def = CATEGORIES.find(c => c.value === slug);
    if (def) return def.en;
  }
  const found = Object.entries(CAT_EMOJI).find(([k]) =>
    String(cat).toLowerCase().includes(k.toLowerCase().split(' ')[0])
  );
  return found ? `${found[1]} ${cat}` : String(cat);
}

const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English', flag: '🇬🇧' },
  { value: 'thai',    label: 'ไทย',     flag: '🇹🇭' },
  { value: 'russian', label: 'Русский', flag: '🇷🇺' },
  { value: 'chinese', label: '中文',     flag: '🇨🇳' },
  { value: 'german',  label: 'Deutsch', flag: '🇩🇪' },
];

const AGE_OPTIONS = [
  { value: '18-25', label: '18–25' },
  { value: '25-35', label: '25–35' },
  { value: '35-45', label: '35–45' },
  { value: '45-55', label: '45–55' },
  { value: '55+',   label: '55+' },
];

const EXP_OPTIONS = [
  { value: '1',  label: '1+' },
  { value: '3',  label: '3+' },
  { value: '5',  label: '5+' },
  { value: '10', label: '10+' },
];

export default function Helpers() {
  const { lang, setLang: changeLang } = useLang();
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCity, setFilterCity] = useState('');
  const [filterCat, setFilterCat] = useState(''); // slug
  const [filterArea, setFilterArea] = useState('');
  const [filterAgeRange, setFilterAgeRange] = useState('');
  const [filterMinExp, setFilterMinExp] = useState('');
  const [filterLanguages, setFilterLanguages] = useState([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchHelpersApi();
        setHelpers(data.helpers || []);
      } catch (err) {
        console.error('Failed to load helpers:', err);
        setHelpers([]);
      }
      setLoading(false);
    })();
  }, []);

  const t = T[lang] || T.en;

  const filtered = useMemo(() => helpers.filter(h => {
    if (filterCity && h.city?.toLowerCase() !== filterCity.toLowerCase()) return false;
    if (filterCat) {
      const helperSlug = categoryToSlug(h.category);
      if (helperSlug !== filterCat) return false;
    }
    if (filterArea && !h.area?.toLowerCase().includes(filterArea.toLowerCase())) return false;

    if (filterAgeRange) {
      const age = parseInt(h.age, 10);
      if (Number.isNaN(age)) return false;
      const rangeOk = (
        (filterAgeRange === '18-25' && age >= 18 && age < 25) ||
        (filterAgeRange === '25-35' && age >= 25 && age < 35) ||
        (filterAgeRange === '35-45' && age >= 35 && age < 45) ||
        (filterAgeRange === '45-55' && age >= 45 && age < 55) ||
        (filterAgeRange === '55+'   && age >= 55)
      );
      if (!rangeOk) return false;
    }

    if (filterMinExp) {
      const min = parseInt(filterMinExp, 10);
      const match = (h.experience || '').match(/\d+/);
      const years = match ? parseInt(match[0], 10) : 0;
      if (years < min) return false;
    }

    if (filterLanguages.length > 0) {
      const langsLower = (h.languages || '').toLowerCase();
      for (const lng of filterLanguages) {
        if (!langsLower.includes(lng.toLowerCase())) return false;
      }
    }

    return true;
  }), [helpers, filterCity, filterCat, filterArea, filterAgeRange, filterMinExp, filterLanguages]);

  const resetFilters = () => {
    setFilterCity('');
    setFilterCat('');
    setFilterArea('');
    setFilterAgeRange('');
    setFilterMinExp('');
    setFilterLanguages([]);
  };

  const toggleLanguage = (lng) => {
    setFilterLanguages(prev =>
      prev.includes(lng) ? prev.filter(l => l !== lng) : [...prev, lng]
    );
  };

  const activeFilterCount =
    (filterCity ? 1 : 0) + (filterCat ? 1 : 0) + (filterArea ? 1 : 0) +
    (filterAgeRange ? 1 : 0) + (filterMinExp ? 1 : 0) + filterLanguages.length;

  return (
    <>
      <SEOHead
        title="Browse Helpers – Find Nannies, Chefs, Drivers & More"
        description="Browse verified household staff profiles in Thailand. Find nannies, housekeepers, private chefs, drivers, gardeners, caregivers and tutors."
        path="/helpers"
        lang={lang}
        jsonLd={getBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Browse Helpers', path: '/helpers' }])}
      />

      <div className={`min-h-screen bg-gray-50 ${lang === 'th' ? 'lang-th' : ''}`}>

        {/* ── UTILITY TOP BAR — audience switch to employer landing ── */}
        <div className="w-full bg-[#001b3d] text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-2.5 flex justify-center md:justify-end items-center text-xs md:text-sm">
            <Link href="/employers" className="font-medium hover:text-gold transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <span className="opacity-80 hidden sm:inline">{t.nav_employers_q}</span>
              <span className="font-bold">{t.nav_employers} →</span>
            </Link>
          </div>
        </div>

        {/* ── NAV ──────────────────────────────────────────────────────── */}
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

        {/* ── HERO ─────────────────────────────────────────────────────── */}
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

        {/* ── BROWSE (sidebar + results) ───────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {/* Desktop sidebar */}
            <aside
              className="browse-sidebar-desktop"
              style={{ width: '280px', flexShrink: 0, position: 'sticky', top: '80px' }}
            >
              <FilterSidebar
                t={t}
                filterCity={filterCity} setFilterCity={setFilterCity}
                filterCat={filterCat} setFilterCat={setFilterCat}
                filterArea={filterArea} setFilterArea={setFilterArea}
                filterAgeRange={filterAgeRange} setFilterAgeRange={setFilterAgeRange}
                filterMinExp={filterMinExp} setFilterMinExp={setFilterMinExp}
                filterLanguages={filterLanguages} toggleLanguage={toggleLanguage}
                activeFilterCount={activeFilterCount}
                onResetFilters={resetFilters}
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
                  className="browse-sidebar-mobile-btn"
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
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                  {t.filter_show_filters}
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
                  {filtered.map(h => (
                    <HelperCard
                      key={h.ref}
                      helper={{ ...h, categoryLabel: categoryWithEmoji(h.category) }}
                      t={t}
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
                    background: 'white',
                    width: '100%',
                    maxWidth: '480px',
                    maxHeight: '85vh',
                    borderRadius: '20px 20px 0 0',
                    padding: '20px',
                    overflowY: 'auto',
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
                  <FilterSidebar
                    t={t}
                    filterCity={filterCity} setFilterCity={setFilterCity}
                    filterCat={filterCat} setFilterCat={setFilterCat}
                    filterArea={filterArea} setFilterArea={setFilterArea}
                    filterAgeRange={filterAgeRange} setFilterAgeRange={setFilterAgeRange}
                    filterMinExp={filterMinExp} setFilterMinExp={setFilterMinExp}
                    filterLanguages={filterLanguages} toggleLanguage={toggleLanguage}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={resetFilters}
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
              :global(.browse-sidebar-desktop) { display: none !important; }
              :global(.browse-sidebar-mobile-btn) { display: inline-flex !important; }
            }
          `}</style>
        </section>

        {/* ── CTA FOR HELPERS ──────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-[#006a62] to-[#004d47] text-white py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{t.cta_title}</h2>
            <p className="text-base md:text-lg opacity-90 mb-6">{t.cta_sub}</p>
            <Link
              href="/register"
              className="inline-block px-7 py-3.5 rounded-full bg-white text-[#006a62] text-base font-bold hover:shadow-2xl transition-all"
            >
              {t.cta_btn}
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

// ─── Filter sidebar ─────────────────────────────────────────────────────
function FilterSidebar({
  t,
  filterCity, setFilterCity,
  filterCat, setFilterCat,
  filterArea, setFilterArea,
  filterAgeRange, setFilterAgeRange,
  filterMinExp, setFilterMinExp,
  filterLanguages, toggleLanguage,
  activeFilterCount, onResetFilters,
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      padding: '18px 18px 8px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
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
            onClick={onResetFilters}
            style={{
              background: 'none', border: 'none',
              color: '#006a62', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', padding: 0,
              textDecoration: 'underline',
            }}
          >
            {t.filter_reset}
          </button>
        )}
      </div>

      {/* Category */}
      <FilterGroup label={t.filter_cat_label}>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="">{t.filter_cat}</option>
          {CATEGORIES.filter(c => c.value !== 'multiple').map(c => (
            <option key={c.value} value={c.value}>{c.en}</option>
          ))}
        </select>
      </FilterGroup>

      {/* City */}
      <FilterGroup label={t.filter_city_label}>
        <select
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
          style={filterSelectStyle}
        >
          <option value="">{t.filter_city}</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </FilterGroup>

      {/* Area */}
      <FilterGroup label={t.filter_area_label}>
        <input
          type="text"
          value={filterArea}
          onChange={e => setFilterArea(e.target.value)}
          placeholder={t.filter_area_ph}
          style={filterInputStyle}
        />
      </FilterGroup>

      {/* Age range */}
      <FilterGroup label={t.filter_age_label}>
        <div style={chipRowStyle}>
          {AGE_OPTIONS.map(opt => (
            <ChipButton
              key={opt.value}
              active={filterAgeRange === opt.value}
              onClick={() => setFilterAgeRange(filterAgeRange === opt.value ? '' : opt.value)}
            >
              {opt.label}
            </ChipButton>
          ))}
        </div>
      </FilterGroup>

      {/* Experience */}
      <FilterGroup label={t.filter_exp_label}>
        <div style={chipRowStyle}>
          {EXP_OPTIONS.map(opt => (
            <ChipButton
              key={opt.value}
              active={filterMinExp === opt.value}
              onClick={() => setFilterMinExp(filterMinExp === opt.value ? '' : opt.value)}
            >
              {opt.label}
            </ChipButton>
          ))}
        </div>
      </FilterGroup>

      {/* Languages */}
      <FilterGroup label={t.filter_lang_label}>
        <div style={chipRowStyle}>
          {LANGUAGE_OPTIONS.map(opt => (
            <ChipButton
              key={opt.value}
              active={filterLanguages.includes(opt.value)}
              onClick={() => toggleLanguage(opt.value)}
            >
              <span style={{ marginRight: '4px' }}>{opt.flag}</span>
              {opt.label}
            </ChipButton>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ label, children }) {
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

function ChipButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '6px 12px',
        borderRadius: '999px',
        border: `1px solid ${active ? '#006a62' : '#e5e7eb'}`,
        background: active ? '#006a62' : 'white',
        color: active ? 'white' : '#374151',
        fontSize: '13px', fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

const filterSelectStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  fontSize: '14px',
  background: 'white',
  color: '#1a1a1a',
  cursor: 'pointer',
};

const filterInputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  fontSize: '14px',
  background: 'white',
  color: '#1a1a1a',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const chipRowStyle = {
  display: 'flex', flexWrap: 'wrap', gap: '6px',
};
