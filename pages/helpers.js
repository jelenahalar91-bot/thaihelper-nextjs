import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import Link from 'next/link';
import { useLang } from './_app';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu, ResourcesDropdown } from '@/components/MobileMenu';
import HelperCard from '@/components/HelperCard';
import HelperProfileModal from '@/components/messaging/HelperProfileModal';
import { fetchHelpers as fetchHelpersApi } from '@/lib/api/helpers';
import { CITIES, parseAdditionalCities } from '@/lib/constants/cities';
import { CATEGORIES, CAT_EMOJI } from '@/lib/constants/categories';
import { WP_FILTER_OPTIONS } from '@/lib/constants/work-permit';
import { NATIONALITY_FILTER_OPTIONS } from '@/lib/constants/nationalities';

// ─── TRANSLATIONS ──────────────────────────────────────────────────────────────
const T = {
  en: {
    nav_employers:  'For Families',
    nav_employers_q:'Looking to hire a helper?',
    nav_resources:  'Resources',
    nav_wizard:     'Work Permit Wizard',
    nav_directory:  'Expert Directory',
    nav_about:      'About',
    nav_faq:        'FAQ',
    nav_home:       'Home',
    nav_blog:       'Blog',
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
    filter_nat_label:   'Nationality',
    filter_wp_label:    'Work Permit',
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
    fav_add:        'Save to favorites',
    fav_remove:     'Remove from favorites',
    fav_login:      'Login as employer to save favorites',
    cta_title:      'Are you a helper looking for work?',
    cta_sub:        'Create your free profile and let families find you.',
    cta_btn:        'Register Now — Free →',
    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_product: 'Product', footer_find: 'Benefits', footer_hire: 'Categories', footer_pricing: 'Pricing', footer_employers: 'For Families',
    footer_company: 'Company', footer_contact: 'Contact', footer_line: 'LINE', footer_about: 'About', footer_faq: 'FAQ',
    footer_legal: 'Legal', footer_privacy: 'Privacy Policy', footer_terms: 'Terms of Service',
    footer_disclaimer: 'ThaiHelper.app is free to use. We are not a recruitment agency and do not provide placement services. Compliance with Thai labor and immigration laws is the sole responsibility of the users.',
  },
  th: {
    nav_employers:  'สำหรับครอบครัว',
    nav_employers_q:'กำลังหาผู้ช่วย?',
    nav_resources:  'แหล่งข้อมูล',
    nav_wizard:     'ตัวช่วยใบอนุญาตทำงาน',
    nav_directory:  'รายชื่อผู้เชี่ยวชาญ',
    nav_about:      'เกี่ยวกับเรา',
    nav_faq:        'คำถามที่พบบ่อย',
    nav_home:       'หน้าแรก',
    nav_blog:       'บล็อก',
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
    filter_nat_label:   'สัญชาติ',
    filter_wp_label:    'ใบอนุญาตทำงาน',
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
    fav_add:        'บันทึกในรายการโปรด',
    fav_remove:     'ลบออกจากรายการโปรด',
    fav_login:      'เข้าสู่ระบบในฐานะนายจ้างเพื่อบันทึกรายการโปรด',
    cta_title:      'คุณเป็นผู้ช่วยที่กำลังหางานอยู่หรือเปล่า?',
    cta_sub:        'สร้างโปรไฟล์ฟรีเพื่อให้ครอบครัวค้นหาคุณ',
    cta_btn:        'ลงทะเบียนฟรี →',
    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_product: 'ผลิตภัณฑ์', footer_find: 'ประโยชน์', footer_hire: 'หมวดหมู่', footer_pricing: 'ราคา', footer_employers: 'สำหรับครอบครัว',
    footer_company: 'บริษัท', footer_contact: 'ติดต่อ', footer_line: 'LINE', footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย',
    footer_legal: 'กฎหมาย', footer_privacy: 'นโยบายความเป็นส่วนตัว', footer_terms: 'ข้อกำหนดการใช้งาน',
    footer_disclaimer: 'ThaiHelper.app ใช้งานฟรี เราไม่ใช่บริษัทจัดหางานและไม่ได้ให้บริการจัดหางาน การปฏิบัติตามกฎหมายแรงงานและกฎหมายตรวจคนเข้าเมืองของไทยเป็นความรับผิดชอบของผู้ใช้แต่เพียงผู้เดียว',
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
  // New helpers store multiple categories as "nanny, housekeeper". Render
  // each one with its own emoji + label so cards show the full picture.
  const parts = String(cat).split(/[,]+/).map(p => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts.map(p => categoryWithEmoji(p)).join(' · ');
  }
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
  { value: 'english',    label: 'English',     flag: '🇬🇧' },
  { value: 'thai',       label: 'ไทย',          flag: '🇹🇭' },
  { value: 'burmese',    label: 'မြန်မာ',         flag: '🇲🇲' },
  { value: 'khmer',      label: 'ខ្មែរ',         flag: '🇰🇭' },
  { value: 'lao',        label: 'ລາວ',          flag: '🇱🇦' },
  { value: 'vietnamese', label: 'Tiếng Việt',  flag: '🇻🇳' },
  { value: 'tagalog',    label: 'Tagalog',     flag: '🇵🇭' },
  { value: 'chinese',    label: '中文',         flag: '🇨🇳' },
  { value: 'russian',    label: 'Русский',     flag: '🇷🇺' },
  { value: 'german',     label: 'Deutsch',     flag: '🇩🇪' },
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

// ─── Server-side data fetch — fixes Soft 404 for Googlebot ──────────────────
export async function getServerSideProps() {
  try {
    const { getServiceSupabase } = await import('@/lib/supabase');
    const { getDisplayAge } = await import('@/lib/age');
    const { maskWpStatusForPublic } = await import('@/lib/constants/work-permit');
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('helper_profiles')
      .select(
        'helper_ref, first_name, last_name, email, whatsapp, has_whatsapp, ' +
        'age, date_of_birth, category, skills, city, area, area_en, additional_cities, ' +
        'experience, languages, rate, education, certificates, bio, bio_en, ' +
        'photo_url, created_at, status, availability_status, work_permit_status, nationality'
      )
      .or('status.eq.active,status.is.null')
      .eq('email_verified', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const helpers = (data || []).map((row) => ({
      ref: row.helper_ref,
      firstName: row.first_name,
      lastName: row.last_name ? row.last_name.charAt(0) + '.' : '',
      age: getDisplayAge(row) || null,
      category: row.category || '',
      skills: row.skills || '',
      city: row.city || '',
      area: row.area || '',
      areaEn: row.area_en || '',
      availabilityStatus: row.availability_status || 'available',
      additionalCities: row.additional_cities || '',
      experience: row.experience || '',
      languages: row.languages || '',
      rate: row.rate || '',
      education: row.education || '',
      certificates: row.certificates || '',
      bio: row.bio || '',
      bioEn: row.bio_en || '',
      photo: row.photo_url || '',
      createdAt: row.created_at || null,
      hasWhatsApp: !!row.whatsapp,
      hasEmail: !!row.email,
      // Mirror the public masking from /api/helpers so the URL filter
      // and the SSR-rendered page agree on what's visible.
      wpStatus: maskWpStatusForPublic(row.work_permit_status),
      nationality: row.nationality === 'prefer_not_say' ? null : (row.nationality || null),
    }));

    return {
      props: {
        initialHelpers: helpers,
      },
    };
  } catch (err) {
    console.error('SSR helpers fetch failed:', err);
    return { props: { initialHelpers: [] } };
  }
}

export default function Helpers({ initialHelpers = [] }) {
  const { lang, setLang: changeLang } = useLang();
  const router = useRouter();
  const [helpers, setHelpers] = useState(initialHelpers);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterCity, setFilterCity] = useState('');
  const [filterCat, setFilterCat] = useState(''); // slug
  const [filterArea, setFilterArea] = useState('');
  const [filterAgeRange, setFilterAgeRange] = useState('');
  const [filterMinExp, setFilterMinExp] = useState('');
  const [filterLanguages, setFilterLanguages] = useState([]);
  const [filterWp, setFilterWp] = useState('');
  const [filterNationality, setFilterNationality] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Only fetch client-side if SSR didn't provide data (fallback)
  useEffect(() => {
    if (initialHelpers.length > 0) return;
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
  }, [initialHelpers]);

  // ─── Favorites (employer-only) ────────────────────────────────────────
  // `favorites` is a Set of helper_ref strings. `isEmployer` is null while
  // unknown, false when the /api/favorites call returns 401 (not logged in
  // as employer), and true when favorites were successfully loaded.
  const [favorites, setFavorites] = useState(new Set());
  const [isEmployer, setIsEmployer] = useState(null);
  const [viewingHelper, setViewingHelper] = useState(null);

  // Pre-fill the WP filter from `?wp=` so the wizard's recommendation
  // CTAs (e.g. /helpers?wp=thai_national) land directly on a filtered
  // list. Only positive, public values are accepted — never a negative
  // filter via URL manipulation.
  useEffect(() => {
    if (!router.isReady) return;
    const raw = router.query.wp;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) return;
    if (WP_FILTER_OPTIONS.some(o => o.value && o.value === value)) {
      setFilterWp(value);
    }
  }, [router.isReady, router.query.wp]);

  // Same shape for the nationality filter — wizard CTA can deep-link to
  // /helpers?nationality=thai once the field is widely populated.
  useEffect(() => {
    if (!router.isReady) return;
    const raw = router.query.nationality;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) return;
    if (NATIONALITY_FILTER_OPTIONS.some(o => o.value && o.value === value)) {
      setFilterNationality(value);
    }
  }, [router.isReady, router.query.nationality]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/favorites');
        if (cancelled) return;
        if (r.status === 401) {
          setIsEmployer(false);
          return;
        }
        const data = await r.json();
        if (cancelled) return;
        setIsEmployer(true);
        setFavorites(new Set(data.favorites || []));
      } catch {
        if (!cancelled) setIsEmployer(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleFavorite = async (helperRef, nextValue) => {
    if (!isEmployer) {
      // Not logged in as employer — redirect to employer login with intent
      if (typeof window !== 'undefined') {
        window.location.href = '/employer-login?next=/helpers';
      }
      return;
    }
    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      if (nextValue) next.add(helperRef); else next.delete(helperRef);
      return next;
    });
    try {
      if (nextValue) {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ helper_ref: helperRef }),
        });
      } else {
        await fetch(`/api/favorites?helper_ref=${encodeURIComponent(helperRef)}`, {
          method: 'DELETE',
        });
      }
    } catch (err) {
      console.error('Favorite toggle failed:', err);
      // Roll back on error
      setFavorites(prev => {
        const next = new Set(prev);
        if (nextValue) next.delete(helperRef); else next.add(helperRef);
        return next;
      });
    }
  };

  const t = T[lang] || T.en;

  const filtered = useMemo(() => helpers.filter(h => {
    if (filterCity) {
      // A helper matches if their primary city OR any of their additional
      // cities equals the selected filter — so an Andaman helper appears
      // under each island they listed.
      const primary = (h.city || '').toLowerCase();
      const extras = parseAdditionalCities(h.additionalCities);
      const target = filterCity.toLowerCase();
      if (primary !== target && !extras.includes(target)) return false;
    }
    if (filterCat) {
      // A helper may store multiple categories ("nanny, housekeeper"); they
      // match the filter if ANY of their slugs equals the selected one.
      const helperSlugs = String(h.category || '')
        .split(/[,]+/)
        .map(s => categoryToSlug(s.trim()))
        .filter(Boolean);
      if (!helperSlugs.includes(filterCat)) return false;
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

    // Positive WP filter only — empty string means "All".
    if (filterWp && h.wpStatus !== filterWp) return false;

    // Nationality filter — match exactly. Helpers without nationality
    // set are excluded when a specific value is selected.
    if (filterNationality && h.nationality !== filterNationality) return false;

    return true;
  }), [helpers, filterCity, filterCat, filterArea, filterAgeRange, filterMinExp, filterLanguages, filterWp, filterNationality]);

  const resetFilters = () => {
    setFilterCity('');
    setFilterCat('');
    setFilterArea('');
    setFilterAgeRange('');
    setFilterMinExp('');
    setFilterLanguages([]);
    setFilterWp('');
    setFilterNationality('');
  };

  const toggleLanguage = (lng) => {
    setFilterLanguages(prev =>
      prev.includes(lng) ? prev.filter(l => l !== lng) : [...prev, lng]
    );
  };

  const activeFilterCount =
    (filterCity ? 1 : 0) + (filterCat ? 1 : 0) + (filterArea ? 1 : 0) +
    (filterAgeRange ? 1 : 0) + (filterMinExp ? 1 : 0) + filterLanguages.length +
    (filterWp ? 1 : 0) + (filterNationality ? 1 : 0);

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
            {(() => {
              const navItems = [
                { href: '/employers',           label: t.nav_employers },
                { href: '/work-permit-wizard',  label: t.nav_wizard },
                { href: '/directory',           label: t.nav_directory },
                { href: '/about',               label: t.nav_about },
                { href: '/faq',                 label: t.nav_faq },
                { href: '/blog',                label: t.nav_blog },
              ];
              return (
                <>
                  <div className="hidden lg:flex items-center gap-4">
                    <ResourcesDropdown label={t.nav_resources} items={navItems} />
                    <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-[#006a62] transition-colors">
                      {t.nav_login}
                    </Link>
                    <LangSwitcher languages={['en', 'th']} />
                    <Link
                      href="/register"
                      className="px-5 py-2.5 rounded-full bg-gradient-to-br from-[#006a62] to-[#004d47] text-white text-sm font-semibold hover:shadow-lg transition-all whitespace-nowrap"
                    >
                      {t.nav_cta}
                    </Link>
                  </div>
                  <div className="lg:hidden">
                    <MobileMenu
                      items={navItems}
                      secondaryCta={{ href: '/login', label: t.nav_login }}
                      primaryCta={{ href: '/register', label: t.nav_cta }}
                    />
                  </div>
                </>
              );
            })()}
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
                lang={lang}
                filterCity={filterCity} setFilterCity={setFilterCity}
                filterCat={filterCat} setFilterCat={setFilterCat}
                filterArea={filterArea} setFilterArea={setFilterArea}
                filterAgeRange={filterAgeRange} setFilterAgeRange={setFilterAgeRange}
                filterMinExp={filterMinExp} setFilterMinExp={setFilterMinExp}
                filterLanguages={filterLanguages} toggleLanguage={toggleLanguage}
                filterWp={filterWp} setFilterWp={setFilterWp}
                filterNationality={filterNationality} setFilterNationality={setFilterNationality}
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
                      isFavorite={favorites.has(h.ref)}
                      onToggleFavorite={toggleFavorite}
                      favoriteHint={isEmployer === false ? t.fav_login : undefined}
                      onViewProfile={setViewingHelper}
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
                    lang={lang}
                    filterCity={filterCity} setFilterCity={setFilterCity}
                    filterCat={filterCat} setFilterCat={setFilterCat}
                    filterArea={filterArea} setFilterArea={setFilterArea}
                    filterAgeRange={filterAgeRange} setFilterAgeRange={setFilterAgeRange}
                    filterMinExp={filterMinExp} setFilterMinExp={setFilterMinExp}
                    filterLanguages={filterLanguages} toggleLanguage={toggleLanguage}
                    filterWp={filterWp} setFilterWp={setFilterWp}
                    filterNationality={filterNationality} setFilterNationality={setFilterNationality}
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
                  <a aria-label="LINE Official Account" className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center text-white hover:opacity-80 transition-all" href="https://lin.ee/U7B1KX6" target="_blank" rel="noopener noreferrer">                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>                 </a>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
                <div>
                  <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-widest font-headline whitespace-nowrap">{t.footer_product}</h4>
                  <ul className="space-y-3">
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/#benefits">{t.footer_find}</Link></li>
                    <li><Link className="text-slate-500 hover:text-teal-500 text-sm whitespace-nowrap" href="/#categories">{t.footer_hire}</Link></li>
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

      {viewingHelper && (
        <HelperProfileModal
          helper={viewingHelper}
          onClose={() => setViewingHelper(null)}
          t={t}
          lang={lang}
          footerCta={
            isEmployer ? null : (
              <Link
                href="/login"
                className="block w-full text-center px-4 py-3 rounded-lg bg-[#006a62] text-white text-sm font-bold hover:bg-[#004d47] transition-colors"
              >
                🔒 {t.card_signin_btn}
              </Link>
            )
          }
        />
      )}
    </>
  );
}

// ─── Filter sidebar ─────────────────────────────────────────────────────
function FilterSidebar({
  t,
  lang = 'en',
  filterCity, setFilterCity,
  filterCat, setFilterCat,
  filterArea, setFilterArea,
  filterAgeRange, setFilterAgeRange,
  filterMinExp, setFilterMinExp,
  filterLanguages, toggleLanguage,
  filterWp, setFilterWp,
  filterNationality, setFilterNationality,
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

      {/* Nationality */}
      <FilterGroup label={t.filter_nat_label}>
        <select
          value={filterNationality}
          onChange={e => setFilterNationality(e.target.value)}
          style={filterSelectStyle}
        >
          {NATIONALITY_FILTER_OPTIONS.map(o => (
            <option key={o.value || 'all'} value={o.value}>
              {o.flag ? `${o.flag} ` : ''}{lang === 'th' ? o.th : o.en}
            </option>
          ))}
        </select>
      </FilterGroup>

      {/* Work permit — positive filter only ("Has WP" / "Thai national") */}
      <FilterGroup label={t.filter_wp_label}>
        <select
          value={filterWp}
          onChange={e => setFilterWp(e.target.value)}
          style={filterSelectStyle}
        >
          {WP_FILTER_OPTIONS.map(o => (
            <option key={o.value || 'all'} value={o.value}>
              {lang === 'th' ? o.th : o.en}
            </option>
          ))}
        </select>
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
