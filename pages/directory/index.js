/**
 * /directory
 *
 * Public directory of immigration lawyers, visa agents, MOU agencies
 * and licensed staffing agencies. Filterable by city, type, specialty.
 *
 * Listings are fetched at build time via getStaticProps (ISR every
 * hour) so the page is instant; filters run client-side. The dataset
 * is small enough (<200 entries planned) that this is the right
 * tradeoff vs. a per-request server fetch.
 *
 * Tier ranking (featured > premium > free) is decided in the API
 * response order, not re-sorted here.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu, ResourcesDropdown } from '@/components/MobileMenu';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import { useLang } from '../_app';
import { getServiceSupabase } from '@/lib/supabase';
import { CITY_OPTIONS, formatCity } from '@/lib/constants/cities';
import {
  DIRECTORY_TYPES,
  SPECIALTIES,
  DIRECTORY_LANGUAGES,
  NATIONALITIES_PLACED,
  formatDirectoryType,
  formatCsvList,
} from '@/lib/constants/directory';

const T = {
  en: {
    page_title: 'Immigration Experts Directory – ThaiHelper',
    meta_desc: 'Find immigration lawyers, visa agents and MOU agencies across Thailand. Verified expert directory for families needing work permits or visas for their household helpers.',
    nav_employers: 'For Families',
    nav_helpers: 'For Helpers',
    nav_blog: 'Blog',
    nav_login: 'Login',
    nav_cta: 'Register – Free',
    nav_resources: 'Resources',
    nav_browse_helpers: 'Browse Helpers',
    nav_wizard: 'Work Permit Wizard',
    nav_employers_link: 'For Families',
    nav_about: 'About',
    nav_faq: 'FAQ',

    hero_eyebrow: 'Expert Directory',
    // Per-tab hero copy. The default ('all') is also the SEO title users land
    // on; tab-specific copy makes the page feel responsive to the filter.
    hero_h1_all:                 'Everything you need to hire household help in Thailand',
    hero_sub_all:                'Vetted agencies, cleaning & nanny companies, immigration lawyers, visa agents, MOU specialists, trainers and service partners — all in one directory. No commissions, you contact them directly.',
    hero_h1_agency:              'Find a domestic helper agency near you',
    hero_sub_agency:             'Staffing agencies that place nannies, housekeepers, caregivers and drivers with families across Thailand. Curated shortlist, you choose.',
    hero_h1_service_company:     'Find a cleaning, nanny or driver company near you',
    hero_sub_service_company:    'Local companies that send their own teams of cleaners, nannies or drivers to your home on a recurring schedule — staff stay employed by the company.',
    hero_h1_lawyer:              'Find an immigration lawyer in Thailand',
    hero_sub_lawyer:             'Specialists in work permits, visas, Thai labor law and dispute resolution. Reach out directly — we don\'t take a cut.',
    hero_h1_visa_agent:          'Find a visa agent near you',
    hero_sub_visa_agent:         'Tourist, retirement, education and long-stay visa specialists across Thailand. No commissions — you handle the engagement directly.',
    hero_h1_mou_agency:          'Find an MOU agency in Thailand',
    hero_sub_mou_agency:         'Foreign-worker paperwork done right: CI (nationality verification), PJ passports, MOU process and work-permit renewals for Myanmar, Lao and Cambodian staff.',
    hero_h1_training:            'Domestic helper training and classes near you',
    hero_sub_training:           'Childcare courses, first-aid certification, Thai language, English for helpers and household-management classes. Coming soon — we\'re inviting providers now.',
    hero_h1_partner:             'Useful services for domestic helpers near you',
    hero_sub_partner:            'Health insurance, payroll administration, salary-transfer services and transport partners that support household-staff arrangements. Coming soon.',
    hero_h1_association:         'Domestic helper associations and NGOs in Thailand',
    hero_sub_association:        'Embassies, expat networks, worker-rights NGOs and community support groups for household staff across Thailand. Coming soon.',

    tab_all: 'All',
    tab_all_desc: 'Browse everything',
    tab_agency_desc: 'Nanny, housekeeper, driver placements',
    tab_service_company_desc: 'Cleaning, nanny & driver companies',
    tab_lawyer_desc: 'Work permits, visas, labor law',
    tab_visa_agent_desc: 'Tourist, retirement & long-stay visas',
    tab_mou_agency_desc: 'Foreign-worker paperwork (CI, PJ, MOU)',
    tab_training_desc: 'Helper courses, first aid, languages',
    tab_partner_desc: 'Insurance, payroll, transport',
    tab_association_desc: 'Embassies, expat networks, NGOs',
    tab_coming_soon: 'Coming soon',

    filter_title: 'Filters',
    filter_city: 'All cities',
    filter_type: 'All types',
    filter_specialty: 'All specialties',
    filter_reset: 'Reset',

    no_results: 'No experts match these filters yet. Try fewer filters, or check back soon — we add new listings every week.',
    n_results_one: '1 expert found',
    n_results_other: '{n} experts found',

    badge_featured: 'Featured',
    badge_premium: 'Premium',
    badge_unverified: 'Unverified',
    badge_verified: 'Verified',

    label_specialties: 'Specialties',
    label_languages: 'Languages',
    label_serves: 'Also serves',

    cta_website: 'Visit website',
    cta_phone: 'Call',
    cta_email: 'Email',
    cta_view_details: 'View details →',

    listing_disclaimer: 'Listing provided for informational purposes. ThaiHelper does not endorse this provider.',

    footer_about: 'About', footer_faq: 'FAQ', footer_privacy: 'Privacy', footer_terms: 'Terms',
    footer_login: 'Company login',
    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
    footer_list_cta: 'Become a partner →',
    partner_cta_eyebrow: 'For agencies, companies & service providers',
    partner_cta_title: 'Run an agency or service company?',
    partner_cta_sub: 'Get your company listed in this directory — free while we grow. Reach families across Thailand who are looking for professional help.',
    partner_cta_btn: 'Become a partner →',
  },
  th: {
    page_title: 'รายชื่อผู้เชี่ยวชาญด้านตรวจคนเข้าเมือง – ThaiHelper',
    meta_desc: 'ค้นหาทนายความตรวจคนเข้าเมือง ตัวแทนวีซ่า และหน่วยงาน MOU ทั่วประเทศไทย รายชื่อผู้เชี่ยวชาญที่ได้รับการยืนยันสำหรับครอบครัวที่ต้องการใบอนุญาตทำงานหรือวีซ่า',
    nav_employers: 'สำหรับครอบครัว',
    nav_helpers: 'สำหรับผู้ช่วย',
    nav_blog: 'บล็อก',
    nav_login: 'เข้าสู่ระบบ',
    nav_cta: 'สมัคร – ฟรี',
    nav_resources: 'แหล่งข้อมูล',
    nav_browse_helpers: 'ดูผู้ช่วย',
    nav_wizard: 'ตัวช่วยใบอนุญาตทำงาน',
    nav_employers_link: 'สำหรับครอบครัว',
    nav_about: 'เกี่ยวกับเรา',
    nav_faq: 'คำถามที่พบบ่อย',

    hero_eyebrow: 'รายชื่อผู้เชี่ยวชาญ',
    hero_h1_all:                 'ทุกสิ่งที่คุณต้องการเพื่อจ้างแม่บ้านในประเทศไทย',
    hero_sub_all:                'บริษัทจัดหางาน บริษัทบริการทำความสะอาดและพี่เลี้ยงเด็ก ทนายความตรวจคนเข้าเมือง ตัวแทนวีซ่า ผู้เชี่ยวชาญ MOU ผู้ฝึกอบรม และพันธมิตรบริการ — รวมไว้ในที่เดียว ไม่มีค่าคอมมิชชั่น คุณติดต่อโดยตรง',
    hero_h1_agency:              'ค้นหาบริษัทจัดหาแม่บ้านใกล้คุณ',
    hero_sub_agency:             'บริษัทจัดหางานที่จัดส่งพี่เลี้ยงเด็ก แม่บ้าน ผู้ดูแล และคนขับรถให้กับครอบครัวทั่วประเทศไทย รายชื่อคัดสรร คุณเป็นผู้เลือก',
    hero_h1_service_company:     'ค้นหาบริษัททำความสะอาด พี่เลี้ยง หรือคนขับรถใกล้คุณ',
    hero_sub_service_company:    'บริษัทท้องถิ่นที่ส่งทีมพนักงานทำความสะอาด พี่เลี้ยง หรือคนขับรถมาที่บ้านคุณตามตารางประจำ — พนักงานเป็นลูกจ้างของบริษัท',
    hero_h1_lawyer:              'ค้นหาทนายความตรวจคนเข้าเมืองในประเทศไทย',
    hero_sub_lawyer:             'ผู้เชี่ยวชาญด้านใบอนุญาตทำงาน วีซ่า กฎหมายแรงงานไทย และการแก้ไขข้อพิพาท ติดต่อโดยตรง — เราไม่หักค่าธรรมเนียม',
    hero_h1_visa_agent:          'ค้นหาตัวแทนวีซ่าใกล้คุณ',
    hero_sub_visa_agent:         'ผู้เชี่ยวชาญด้านวีซ่าท่องเที่ยว เกษียณ การศึกษา และระยะยาว ทั่วประเทศไทย ไม่มีค่าคอมมิชชั่น — คุณดำเนินการโดยตรง',
    hero_h1_mou_agency:          'ค้นหาหน่วยงาน MOU ในประเทศไทย',
    hero_sub_mou_agency:         'งานเอกสารแรงงานต่างด้าวอย่างถูกต้อง: CI (พิสูจน์สัญชาติ) PJ พาสปอร์ต กระบวนการ MOU และต่อใบอนุญาตทำงานสำหรับคนงานจากเมียนมา ลาว และกัมพูชา',
    hero_h1_training:            'หลักสูตรและการฝึกอบรมแม่บ้านใกล้คุณ',
    hero_sub_training:           'หลักสูตรดูแลเด็ก ใบรับรองปฐมพยาบาล ภาษาไทย ภาษาอังกฤษสำหรับแม่บ้าน และการจัดการบ้าน เร็วๆ นี้ — เรากำลังเชิญผู้ให้บริการ',
    hero_h1_partner:             'บริการที่เป็นประโยชน์สำหรับแม่บ้านใกล้คุณ',
    hero_sub_partner:            'ประกันสุขภาพ การจัดการเงินเดือน การโอนเงินเดือน และการขนส่งที่รองรับการจัดการแม่บ้าน เร็วๆ นี้',
    hero_h1_association:         'สมาคมและ NGO สำหรับแม่บ้านในประเทศไทย',
    hero_sub_association:        'สถานทูต เครือข่ายชาวต่างชาติ NGO ด้านสิทธิแรงงาน และกลุ่มสนับสนุนชุมชนสำหรับแม่บ้านทั่วประเทศไทย เร็วๆ นี้',

    tab_all: 'ทั้งหมด',
    tab_all_desc: 'ดูทั้งหมด',
    tab_agency_desc: 'จัดส่งพี่เลี้ยง แม่บ้าน คนขับรถ',
    tab_service_company_desc: 'บริษัททำความสะอาด พี่เลี้ยง คนขับรถ',
    tab_lawyer_desc: 'ใบอนุญาตทำงาน วีซ่า กฎหมายแรงงาน',
    tab_visa_agent_desc: 'วีซ่าท่องเที่ยว เกษียณ และระยะยาว',
    tab_mou_agency_desc: 'เอกสารแรงงานต่างด้าว (CI, PJ, MOU)',
    tab_training_desc: 'หลักสูตรแม่บ้าน ปฐมพยาบาล ภาษา',
    tab_partner_desc: 'ประกัน เงินเดือน การขนส่ง',
    tab_association_desc: 'สถานทูต เครือข่ายชาวต่างชาติ NGO',
    tab_coming_soon: 'เร็วๆ นี้',

    filter_title: 'ตัวกรอง',
    filter_city: 'ทุกเมือง',
    filter_type: 'ทุกประเภท',
    filter_specialty: 'ความเชี่ยวชาญทั้งหมด',
    filter_reset: 'รีเซ็ต',

    no_results: 'ไม่พบผู้เชี่ยวชาญที่ตรงกับตัวกรองเหล่านี้ ลองใช้ตัวกรองน้อยลง หรือกลับมาดูใหม่เร็วๆ นี้',
    n_results_one: 'พบผู้เชี่ยวชาญ 1 ราย',
    n_results_other: 'พบผู้เชี่ยวชาญ {n} ราย',

    badge_featured: 'แนะนำ',
    badge_premium: 'พรีเมียม',
    badge_unverified: 'ยังไม่ได้ยืนยัน',
    badge_verified: 'ยืนยันแล้ว',

    label_specialties: 'ความเชี่ยวชาญ',
    label_languages: 'ภาษา',
    label_serves: 'ให้บริการเพิ่มเติม',

    cta_website: 'เยี่ยมชมเว็บไซต์',
    cta_phone: 'โทร',
    cta_email: 'อีเมล',
    cta_view_details: 'ดูรายละเอียด →',

    listing_disclaimer: 'รายชื่อจัดทำเพื่อเป็นข้อมูลเท่านั้น ThaiHelper ไม่ได้รับรองผู้ให้บริการรายนี้',

    footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย', footer_privacy: 'ความเป็นส่วนตัว', footer_terms: 'ข้อกำหนด',
    footer_login: 'เข้าสู่ระบบบริษัท',
    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
    footer_list_cta: 'เป็นพันธมิตรกับเรา →',
    partner_cta_eyebrow: 'สำหรับบริษัทจัดหางาน บริษัทบริการ และผู้ให้บริการ',
    partner_cta_title: 'เปิดบริษัทจัดหางานหรือบริษัทบริการ?',
    partner_cta_sub: 'ลงรายชื่อบริษัทของคุณในไดเรกทอรีนี้ — ฟรีในช่วงที่เรากำลังเติบโต เข้าถึงครอบครัวทั่วประเทศไทยที่กำลังมองหาความช่วยเหลือมืออาชีพ',
    partner_cta_btn: 'เป็นพันธมิตรกับเรา →',
  },
};

const TIER_RANK = { featured: 3, premium: 2, free: 1 };

// Map a snake_case row to the camelCase shape pages expect. Mirrors
// toPublicListing in /api/directory.js — duplicated rather than imported
// because Next.js getStaticProps can't pull from API routes cleanly at
// build time (would create a recursive call to ourselves).
function toPublicListing(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameTh: row.name_th || '',
    type: row.type,
    city: row.city,
    citiesServed: row.cities_served || '',
    address: row.address || '',
    phone: row.phone || '',
    email: row.email || '',
    website: row.website || '',
    whatsapp: row.whatsapp || '',
    lineId: row.line_id || '',
    googleMapsUrl: row.google_maps_url || '',
    description: row.description || '',
    descriptionTh: row.description_th || '',
    specialties: row.specialties || '',
    languagesSpoken: row.languages_spoken || '',
    nationalitiesPlaced: row.nationalities_placed || '',
    licenseNumber: row.license_number || '',
    openingHours: row.opening_hours || '',
    logoUrl: row.logo_url || '',
    tier: row.tier || 'free',
    verified: row.verified === true,
  };
}

export async function getStaticProps() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('directory_listings')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('Directory SSG fetch error:', error);
      return { props: { initialListings: [] }, revalidate: 60 };
    }

    const listings = (data || [])
      .map(toPublicListing)
      .sort((a, b) => {
        const t = (TIER_RANK[b.tier] || 0) - (TIER_RANK[a.tier] || 0);
        if (t !== 0) return t;
        return a.name.localeCompare(b.name);
      });

    return {
      props: { initialListings: listings },
      // Revalidate hourly — directory data changes rarely.
      revalidate: 3600,
    };
  } catch (err) {
    console.error('Directory SSG threw:', err);
    return { props: { initialListings: [] }, revalidate: 60 };
  }
}

const VALID_SOURCES = ['wizard', 'direct', 'hire_page', 'search', 'internal'];

function trackClick(listingId, ctaName, source) {
  // Fire-and-forget. We don't await so the user's click feels instant.
  fetch(`/api/directory/${listingId}/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cta: ctaName, source: source || 'direct' }),
  }).catch(() => {});
}

export default function DirectoryIndex({ initialListings = [] }) {
  const { lang } = useLang();
  const t = T[lang] || T.en;
  const router = useRouter();

  const [filterCity, setFilterCity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [clickSource, setClickSource] = useState('direct');

  // Pre-fill city and source from query params so the wizard's CTAs deep-link.
  useEffect(() => {
    if (!router.isReady) return;
    const raw = router.query.city;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value && CITY_OPTIONS.some(c => c.slug === value)) {
      setFilterCity(value);
    }
    const src = Array.isArray(router.query.source) ? router.query.source[0] : router.query.source;
    if (src && VALID_SOURCES.includes(src)) setClickSource(src);
  }, [router.isReady, router.query.city, router.query.source]);

  const filtered = useMemo(() => {
    return initialListings.filter(l => {
      if (filterCity) {
        const primary = (l.city || '').toLowerCase();
        const served = (l.citiesServed || '').toLowerCase();
        if (primary !== filterCity && !served.split(',').map(s => s.trim()).includes(filterCity)) {
          return false;
        }
      }
      if (filterType && l.type !== filterType) return false;
      if (filterSpecialty) {
        const have = (l.specialties || '').toLowerCase().split(',').map(s => s.trim());
        if (!have.includes(filterSpecialty)) return false;
      }
      return true;
    });
  }, [initialListings, filterCity, filterType, filterSpecialty]);

  const resetFilters = () => {
    setFilterCity(''); setFilterType(''); setFilterSpecialty('');
  };

  const resultLabel = filtered.length === 1
    ? t.n_results_one
    : t.n_results_other.replace('{n}', String(filtered.length));

  return (
    <>
      <SEOHead
        title={t.page_title}
        description={t.meta_desc}
        path="/directory"
        lang={lang}
        jsonLd={getBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Expert Directory', path: '/directory' },
        ])}
      />

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
          {(() => {
            const navItems = [
              { href: '/helpers',             label: t.nav_browse_helpers },
              { href: '/work-permit-wizard',  label: t.nav_wizard },
              { href: '/employers',           label: t.nav_employers_link },
              { href: '/about',               label: t.nav_about },
              { href: '/faq',                 label: t.nav_faq },
              { href: '/blog',                label: t.nav_blog },
            ];
            return (
              <>
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
              </>
            );
          })()}
        </nav>

        <main className="pt-24 md:pt-28">
          <section className="px-6 pt-8 pb-6 md:pt-12 md:pb-8">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                {t.hero_eyebrow}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-on-background mb-3 leading-tight">
                {t[`hero_h1_${filterType || 'all'}`] || t.hero_h1_all}
              </h1>
              <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                {t[`hero_sub_${filterType || 'all'}`] || t.hero_sub_all}
              </p>
            </div>
          </section>

          <section className="px-4 md:px-6 pb-16">
            <div className="max-w-5xl mx-auto">
              {/* Category tabs — Helperplace-style row directly under the hero so a
                  tab switch visibly updates the headline above. */}
              <div className="mb-5 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto">
                <div className="flex gap-2 md:gap-3 min-w-max md:min-w-0 md:flex-wrap">
                  {[
                    { value: '', label: t.tab_all, desc: t.tab_all_desc, count: initialListings.length },
                    ...DIRECTORY_TYPES.map(o => ({
                      value: o.value,
                      label: lang === 'th' ? o.th : o.en,
                      desc: t[`tab_${o.value}_desc`] || '',
                      count: initialListings.filter(l => l.type === o.value).length,
                    })),
                  ].map(tab => {
                    const isActive = filterType === tab.value;
                    const isEmpty = tab.count === 0 && tab.value !== '';
                    return (
                      <button
                        key={tab.value || 'all'}
                        onClick={() => setFilterType(tab.value)}
                        className={`flex-1 md:flex-initial min-w-[160px] text-left px-4 py-3 rounded-xl border-2 transition-all ${
                          isActive
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : isEmpty
                              ? 'border-slate-200 bg-slate-50 hover:border-slate-300'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`text-sm font-bold leading-tight flex items-center gap-1.5 flex-wrap ${
                          isActive ? 'text-primary' : isEmpty ? 'text-slate-500' : 'text-on-background'
                        }`}>
                          <span>{tab.label}</span>
                          {isEmpty && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              {t.tab_coming_soon}
                            </span>
                          )}
                        </div>
                        {tab.desc && (
                          <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                            {tab.desc}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secondary filters — city + specialty */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 mb-5 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px]">
                  <select
                    value={filterCity}
                    onChange={e => setFilterCity(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="">{t.filter_city}</option>
                    {CITY_OPTIONS.map(c => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[180px]">
                  <select
                    value={filterSpecialty}
                    onChange={e => setFilterSpecialty(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="">{t.filter_specialty}</option>
                    {SPECIALTIES.map(o => (
                      <option key={o.value} value={o.value}>
                        {lang === 'th' ? o.th : o.en}
                      </option>
                    ))}
                  </select>
                </div>

                {(filterCity || filterType || filterSpecialty) && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    {t.filter_reset}
                  </button>
                )}
              </div>

              <div className="text-sm text-slate-500 mb-3">{resultLabel}</div>

              {/* List */}
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  {t.no_results}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filtered.map(l => (
                    <ListingCard key={l.id} listing={l} t={t} lang={lang} source={clickSource} />
                  ))}
                </div>
              )}

              {/* Provider-acquisition CTA — funnels agencies/companies to
                  /partners. After the listings so it doesn't disrupt the
                  family browse flow. */}
              <div className="mt-8 rounded-2xl bg-gradient-to-br from-primary to-[#00897f] text-white p-6 md:p-8 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-white/70 mb-2">{t.partner_cta_eyebrow}</div>
                <h2 className="text-xl md:text-2xl font-extrabold font-headline mb-2">{t.partner_cta_title}</h2>
                <p className="text-sm md:text-base text-white/90 max-w-xl mx-auto mb-5 leading-relaxed">{t.partner_cta_sub}</p>
                <Link href="/partners" className="inline-block bg-white text-primary font-bold text-sm px-6 py-3 rounded-full hover:bg-white/90 transition-colors">
                  {t.partner_cta_btn}
                </Link>
              </div>

              <LegalDisclaimer lang={lang} />
            </div>
          </section>
        </main>

        <footer className="w-full bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto py-10 px-6 text-center">
            <p className="text-slate-400 text-xs leading-relaxed max-w-3xl mx-auto mb-2">
              {t.footer_desc}
            </p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-500 mt-3">
              <Link href="/about" className="hover:text-primary">{t.footer_about}</Link>
              <Link href="/faq" className="hover:text-primary">{t.footer_faq}</Link>
              <Link href="/privacy" className="hover:text-primary">{t.footer_privacy}</Link>
              <Link href="/terms" className="hover:text-primary">{t.footer_terms}</Link>
              <Link href="/partners" className="hover:text-primary font-medium text-primary">{t.footer_list_cta}</Link>
              <Link href="/business-login" className="hover:text-primary font-medium text-primary">{t.footer_login}</Link>
            </div>
            <p className="text-slate-400 text-xs mt-4">© 2026 ThaiHelper.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

function ListingCard({ listing, t, lang, source = 'direct' }) {
  const clickSource = source;
  const isFeatured = listing.tier === 'featured';
  const isPremium = listing.tier === 'premium';

  const cardClass = isFeatured
    ? 'rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-5'
    : isPremium
      ? 'rounded-2xl border-2 border-primary/40 bg-white p-5'
      : 'rounded-2xl border border-slate-200 bg-white p-5';

  const displayName = lang === 'th' && listing.nameTh ? listing.nameTh : listing.name;
  const displayDescription = lang === 'th' && listing.descriptionTh ? listing.descriptionTh : listing.description;
  const cityLabel = formatCity(listing.city);
  const typeLabel = formatDirectoryType(listing.type, lang);

  const specialtyList = listing.specialties
    ? listing.specialties.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const nationalityList = listing.nationalitiesPlaced
    ? listing.nationalitiesPlaced.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className={cardClass}>
      {/* Logo + header */}
      <div className="flex items-start gap-3 mb-3">
        {listing.logoUrl ? (
          <img src={listing.logoUrl} alt={listing.name}
            className="w-12 h-12 rounded-xl object-contain border border-slate-100 bg-white flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary text-lg font-extrabold">
            {listing.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1 text-xs">
            {isFeatured && (
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">⭐ {t.badge_featured}</span>
            )}
            {isPremium && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{t.badge_premium}</span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">{typeLabel}</span>
          </div>
          <h3 className="text-lg font-extrabold font-headline leading-snug">{displayName}</h3>
          <div className="text-xs text-slate-500 mt-0.5">
            📍 {cityLabel}
            {listing.citiesServed && (
              <span> · {formatCsvList(listing.citiesServed, CITY_OPTIONS.map(c => ({ value: c.slug, en: c.name, th: c.name })), lang)}</span>
            )}
          </div>
        </div>
      </div>

      {displayDescription && (
        <p className="text-sm text-on-surface-variant mb-3 leading-relaxed line-clamp-2">
          {displayDescription}
        </p>
      )}

      {/* Specialty pills */}
      {specialtyList.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {specialtyList.map(slug => {
            const opt = SPECIALTIES.find(o => o.value === slug);
            return opt ? (
              <span key={slug} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                {opt[lang] || opt.en}
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* Nationality flags */}
      {nationalityList.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {nationalityList.map(slug => {
            const nat = NATIONALITIES_PLACED.find(o => o.value === slug);
            return nat ? (
              <span key={slug} title={nat[lang] || nat.en}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                {nat.flag} {nat[lang] || nat.en}
              </span>
            ) : null;
          })}
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap gap-2 mt-1">
        {listing.website && (
          <a href={listing.website} target="_blank" rel="nofollow noopener noreferrer"
            onClick={() => trackClick(listing.id, 'website', clickSource)}
            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-container transition-colors">
            {t.cta_website}
          </a>
        )}
        {listing.phone && (
          <a href={`tel:${listing.phone}`}
            onClick={() => trackClick(listing.id, 'phone', clickSource)}
            className="px-4 py-2 rounded-full bg-white border border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors">
            {t.cta_phone}
          </a>
        )}
        {listing.email && (
          <a href={`mailto:${listing.email}`}
            onClick={() => trackClick(listing.id, 'email', clickSource)}
            className="px-4 py-2 rounded-full bg-white border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors">
            {t.cta_email}
          </a>
        )}
        <Link
          href={`/directory/${listing.slug}${clickSource !== 'direct' ? `?source=${clickSource}` : ''}`}
          onClick={() => trackClick(listing.id, 'details', clickSource)}
          className="px-4 py-2 rounded-full text-sm font-semibold text-slate-600 hover:text-primary self-center">
          {t.cta_view_details}
        </Link>
      </div>

      <p className="text-[11px] text-slate-400 mt-3 leading-snug">{t.listing_disclaimer}</p>
    </div>
  );
}
