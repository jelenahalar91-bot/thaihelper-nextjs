import { useState, useEffect, useMemo } from 'react';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import Link from 'next/link';
import { useLang } from './_app';
import LangSwitcher from '@/components/LangSwitcher';
import HelperCard from '@/components/HelperCard';
import { fetchHelpers as fetchHelpersApi } from '@/lib/api/helpers';
import { CITIES } from '@/lib/constants/cities';
import { CATEGORY_NAMES, CAT_EMOJI } from '@/lib/constants/categories';

// ─── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    nav_home:       'Home',
    nav_login:      'Login',
    nav_cta:        'Register Free',
    hero_badge:     '🇹🇭 Find Help in Thailand',
    hero_h1:        'Browse Trusted Helpers',
    hero_sub:       'Find nannies, housekeepers, chefs, drivers, and more — directly, without agencies.',
    filter_city:    'All Cities',
    filter_cat:     'All Categories',
    filter_area_ph: 'Search by area...',
    filter_reset:   'Reset filters',
    results:        'helpers found',
    no_results:     'No helpers found',
    no_results_sub: 'Try adjusting your filters or check back soon — new helpers register every day.',
    card_exp:       'yrs experience',
    card_signin:    'Sign in as employer to message',
    card_signin_btn:'Log in / Register',
    cta_title:      'Are you a helper looking for work?',
    cta_sub:        'Create your free profile and let families find you.',
    cta_btn:        'Register Now — Free →',
    footer_privacy: 'Privacy Policy',
    footer_terms:   'Terms of Service',
  },
  th: {
    nav_home:       'หน้าแรก',
    nav_login:      'เข้าสู่ระบบ',
    nav_cta:        'ลงทะเบียนฟรี',
    hero_badge:     '🇹🇭 หาผู้ช่วยในประเทศไทย',
    hero_h1:        'ค้นหาผู้ช่วยที่ไว้ใจได้',
    hero_sub:       'หาพี่เลี้ยง แม่บ้าน พ่อครัว คนขับรถ และอื่นๆ — โดยตรง ไม่ผ่านเอเจนซี่',
    filter_city:    'ทุกจังหวัด',
    filter_cat:     'ทุกประเภท',
    filter_area_ph: 'ค้นหาตามย่าน...',
    filter_reset:   'ล้างตัวกรอง',
    results:        'ผู้ช่วยที่พบ',
    no_results:     'ไม่พบผู้ช่วย',
    no_results_sub: 'ลองปรับตัวกรอง หรือกลับมาดูอีกครั้ง — มีผู้ช่วยใหม่ลงทะเบียนทุกวัน',
    card_exp:       'ปีประสบการณ์',
    card_signin:    'เข้าสู่ระบบในฐานะนายจ้างเพื่อส่งข้อความ',
    card_signin_btn:'เข้าสู่ระบบ / ลงทะเบียน',
    cta_title:      'คุณเป็นผู้ช่วยที่กำลังหางานอยู่หรือเปล่า?',
    cta_sub:        'สร้างโปรไฟล์ฟรีเพื่อให้ครอบครัวค้นหาคุณ',
    cta_btn:        'ลงทะเบียนฟรี →',
    footer_privacy: 'นโยบายความเป็นส่วนตัว',
    footer_terms:   'ข้อกำหนดการใช้งาน',
  },
};

// Map category string → emoji + clean label
function categoryLabel(cat) {
  if (!cat) return '';
  const found = Object.entries(CAT_EMOJI).find(([k]) =>
    cat.toLowerCase().includes(k.toLowerCase().split(' ')[0])
  );
  return found ? `${found[1]} ${cat}` : cat;
}

export default function Helpers() {
  const { lang, setLang: changeLang } = useLang();
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCity, setFilterCity] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterArea, setFilterArea] = useState('');

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
    if (filterCat && !h.category?.toLowerCase().includes(filterCat.toLowerCase())) return false;
    if (filterArea && !h.area?.toLowerCase().includes(filterArea.toLowerCase())) return false;
    return true;
  }), [helpers, filterCity, filterCat, filterArea]);

  const resetFilters = () => {
    setFilterCity('');
    setFilterCat('');
    setFilterArea('');
  };

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

        {/* ── FILTERS ──────────────────────────────────────────────────── */}
        <section className="border-b border-gray-200 bg-white sticky top-[60px] z-40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            <div className="flex flex-wrap gap-2 md:gap-3 items-center">
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium min-w-[140px] focus:outline-none focus:ring-2 focus:ring-[#006a62]/30"
              >
                <option value="">{t.filter_city}</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={filterCat}
                onChange={e => setFilterCat(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium min-w-[180px] focus:outline-none focus:ring-2 focus:ring-[#006a62]/30"
              >
                <option value="">{t.filter_cat}</option>
                {CATEGORY_NAMES.map(c => (
                  <option key={c} value={c}>{categoryLabel(c)}</option>
                ))}
              </select>

              <input
                type="text"
                value={filterArea}
                onChange={e => setFilterArea(e.target.value)}
                placeholder={t.filter_area_ph}
                className="flex-1 min-w-[160px] px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006a62]/30"
              />

              {(filterCity || filterCat || filterArea) && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {t.filter_reset}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── HELPER LIST ──────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <div className="text-sm text-gray-600 mb-4">
            <strong className="text-gray-900">{filtered.length}</strong> {t.results}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-[#006a62] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t.no_results}</h3>
              <p className="text-sm text-gray-600 mb-4">{t.no_results_sub}</p>
              {(filterCity || filterCat || filterArea) && (
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
                  helper={{ ...h, categoryLabel: categoryLabel(h.category) }}
                  t={t}
                />
              ))}
            </div>
          )}
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

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer className="bg-gray-100 border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6 text-center text-sm text-gray-600">
            <p>© 2026 ThaiHelper · <a className="hover:text-[#006a62]" href="mailto:support@thaihelper.app">support@thaihelper.app</a></p>
            <p className="mt-2">
              <Link className="hover:text-[#006a62]" href="/privacy">{t.footer_privacy}</Link>
              {' · '}
              <Link className="hover:text-[#006a62]" href="/terms">{t.footer_terms}</Link>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}

