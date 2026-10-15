/**
 * /directory/[slug]
 *
 * Detail page for a single directory listing. Server-rendered via ISR
 * so the page is fully prerendered for crawlers (Schema.org JSON-LD).
 *
 * Falls back to 404 for unknown slugs. Sidebar shows up to four other
 * experts in the same city to keep the user inside the directory.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
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
import {
  formatPackagePrice,
  packageName,
  packageIncludes,
  paymentFlowLong,
  formatCheckedDate,
  normalizePricing,
} from '@/lib/directory-pricing';

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

    crumb_dir: 'Expert Directory',
    back_link: '← Back to directory',

    section_about: 'About',
    section_contact: 'Contact',
    section_specialties: 'Specialties',
    section_languages: 'Languages',
    section_nationalities: 'Nationalities placed',
    section_hours: 'Opening hours',
    section_license: 'License',
    section_pricing: 'Fees, as published by the agency',
    pricing_col_package: 'Package',
    pricing_col_price: 'Price',
    pricing_col_includes: 'What you get',
    pricing_guarantee: '{n}-day replacement',
    pricing_min: 'min. {n} months',
    pricing_pays_label: 'Who you pay',
    pricing_source: 'Taken from the agency’s own price page on {date}. Fees change — confirm before you sign anything, and ask whether the helper’s salary is included.',
    pricing_source_nodate: 'Taken from the agency’s own price page. Fees change — confirm before you sign anything, and ask whether the helper’s salary is included.',
    pricing_source_link: 'See their price page →',
    section_address: 'Address',
    section_serves: 'Cities served',
    section_others: 'Other experts in {city}',
    cta_whatsapp: 'WhatsApp',
    cta_line: 'LINE',

    section_help: 'How we can help you',
    col_speak: 'We speak',
    col_hire: 'We help to hire',
    col_expert: "We're expert in",
    section_contact_detail: 'Contact details',
    label_phone: 'Phone',
    label_email: 'Email',

    badge_featured: 'Featured',
    badge_premium: 'Premium',
    badge_unverified: 'Unverified',
    badge_verified: 'Verified',

    cta_website: 'Visit website',
    cta_phone: 'Call',
    cta_email: 'Email',
    cta_directions: 'Open in Google Maps →',

    listing_disclaimer: 'Listing provided for informational purposes. ThaiHelper does not endorse this provider — please verify their credentials before engaging.',

    footer_about: 'About', footer_faq: 'FAQ', footer_privacy: 'Privacy', footer_terms: 'Terms',
    footer_desc: 'ThaiHelper connects families and expats in Thailand with trusted household staff.',
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

    crumb_dir: 'รายชื่อผู้เชี่ยวชาญ',
    back_link: '← กลับไปหน้ารายชื่อ',

    section_about: 'เกี่ยวกับ',
    section_contact: 'ติดต่อ',
    section_specialties: 'ความเชี่ยวชาญ',
    section_languages: 'ภาษา',
    section_nationalities: 'สัญชาติที่รับสมัคร',
    section_hours: 'เวลาทำการ',
    section_license: 'ใบอนุญาต',
    section_pricing: 'ค่าบริการ ตามที่เอเจนซี่ประกาศ',
    pricing_col_package: 'แพ็กเกจ',
    pricing_col_price: 'ราคา',
    pricing_col_includes: 'สิ่งที่ได้รับ',
    pricing_guarantee: 'เปลี่ยนคนได้ภายใน {n} วัน',
    pricing_min: 'สัญญาขั้นต่ำ {n} เดือน',
    pricing_pays_label: 'คุณจ่ายให้ใคร',
    pricing_source: 'อ้างอิงจากหน้าราคาของเอเจนซี่เมื่อ {date} ราคาอาจเปลี่ยนแปลง — โปรดยืนยันก่อนเซ็นสัญญา และสอบถามว่ารวมเงินเดือนผู้ช่วยหรือไม่',
    pricing_source_nodate: 'อ้างอิงจากหน้าราคาของเอเจนซี่ ราคาอาจเปลี่ยนแปลง — โปรดยืนยันก่อนเซ็นสัญญา และสอบถามว่ารวมเงินเดือนผู้ช่วยหรือไม่',
    pricing_source_link: 'ดูหน้าราคาของเอเจนซี่ →',
    section_address: 'ที่อยู่',
    section_serves: 'เมืองที่ให้บริการ',
    section_others: 'ผู้เชี่ยวชาญอื่นๆ ใน {city}',
    cta_whatsapp: 'WhatsApp',
    cta_line: 'LINE',

    section_help: 'เราช่วยคุณได้อย่างไร',
    col_speak: 'เราพูด',
    col_hire: 'เราช่วยจัดหา',
    col_expert: 'เราเชี่ยวชาญด้าน',
    section_contact_detail: 'รายละเอียดการติดต่อ',
    label_phone: 'โทรศัพท์',
    label_email: 'อีเมล',

    badge_featured: 'แนะนำ',
    badge_premium: 'พรีเมียม',
    badge_unverified: 'ยังไม่ได้ยืนยัน',
    badge_verified: 'ยืนยันแล้ว',

    cta_website: 'เยี่ยมชมเว็บไซต์',
    cta_phone: 'โทร',
    cta_email: 'อีเมล',
    cta_directions: 'เปิดใน Google Maps →',

    listing_disclaimer: 'รายชื่อจัดทำเพื่อเป็นข้อมูลเท่านั้น ThaiHelper ไม่ได้รับรองผู้ให้บริการรายนี้ กรุณาตรวจสอบคุณสมบัติก่อนใช้บริการ',

    footer_about: 'เกี่ยวกับเรา', footer_faq: 'คำถามที่พบบ่อย', footer_privacy: 'ความเป็นส่วนตัว', footer_terms: 'ข้อกำหนด',
    footer_desc: 'ThaiHelper เชื่อมโยงครอบครัวและชาวต่างชาติในประเทศไทยกับพนักงานในบ้านที่ไว้ใจได้',
  },
};

// Map type → schema.org @type. Lawyers get LegalService; everyone else
// is a generic ProfessionalService which crawlers handle gracefully.
const SCHEMA_TYPE_MAP = {
  lawyer:     'LegalService',
  visa_agent: 'ProfessionalService',
  mou_agency: 'ProfessionalService',
  agency:     'EmploymentAgency',
};

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
    // Agency fees as published on their own site — see lib/directory-pricing.js.
    pricing: normalizePricing(row.pricing),
    paymentFlow: row.payment_flow || '',
    pricingUrl: row.pricing_url || '',
    pricingCheckedAt: row.pricing_checked_at || '',
    pricingNote: row.pricing_note || '',
    pricingNoteTh: row.pricing_note_th || '',
  };
}

export async function getStaticPaths() {
  // Render the most-visited slugs at build time, fall back to on-demand
  // ISR for the long tail. Saves build time without sacrificing SEO.
  try {
    const supabase = getServiceSupabase();
    const { data } = await supabase
      .from('directory_listings')
      .select('slug')
      .eq('status', 'active')
      .in('tier', ['featured', 'premium'])
      .limit(50);
    return {
      paths: (data || []).map(d => ({ params: { slug: d.slug } })),
      fallback: 'blocking',
    };
  } catch {
    return { paths: [], fallback: 'blocking' };
  }
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  try {
    const supabase = getServiceSupabase();

    // 1. The listing itself
    const { data: row, error } = await supabase
      .from('directory_listings')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Directory detail SSG error:', error);
      return { notFound: true, revalidate: 60 };
    }
    if (!row) {
      // 308 to /directory instead of hard 404 — fixes GSC reporting the
      // literal "/directory/[slug]" template URL that AI crawlers pick up
      // from __NEXT_DATA__. Same approach as /blog/[slug].
      return { redirect: { destination: '/directory', permanent: true } };
    }

    const listing = toPublicListing(row);

    // 2. Up to 4 sibling listings in the same city (excluding this one)
    const { data: others } = await supabase
      .from('directory_listings')
      .select('*')
      .eq('status', 'active')
      .eq('city', listing.city)
      .neq('id', listing.id)
      .limit(4);

    const siblings = (others || []).map(toPublicListing);

    return {
      props: { listing, siblings },
      revalidate: 3600,
    };
  } catch (err) {
    console.error('Directory detail SSG threw:', err);
    return { notFound: true, revalidate: 60 };
  }
}

// 'email' is the agency-suggestion mail (lib/emails/agency-suggestions.js) —
// the clicks we will one day quote back to the agency that got them.
const VALID_SOURCES = ['wizard', 'direct', 'hire_page', 'search', 'internal', 'email'];

function trackClick(listingId, ctaName, source) {
  fetch(`/api/directory/${listingId}/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cta: ctaName, source: source || 'direct' }),
  }).catch(() => {});
}

export default function DirectoryDetail({ listing, siblings = [] }) {
  const { lang } = useLang();
  const t = T[lang] || T.en;
  const router = useRouter();

  // Preserve source from the listing index (?source=wizard etc.)
  const rawSrc = Array.isArray(router.query.source) ? router.query.source[0] : router.query.source;
  const clickSource = VALID_SOURCES.includes(rawSrc) ? rawSrc : 'direct';

  // One view per page open. This is the "X people opened your page" half of
  // what a paying listing will be shown; see pages/api/directory/[id]/view.js.
  const listingId = listing?.id;
  useEffect(() => {
    if (!listingId) return;
    fetch(`/api/directory/${listingId}/view`, { method: 'POST', keepalive: true }).catch(() => {});
  }, [listingId]);

  if (!listing) return null;

  const displayName = lang === 'th' && listing.nameTh ? listing.nameTh : listing.name;
  const displayDescription = lang === 'th' && listing.descriptionTh ? listing.descriptionTh : listing.description;
  const cityLabel = formatCity(listing.city);
  const typeLabel = formatDirectoryType(listing.type, lang);

  // Schema.org for crawlers — LegalService / ProfessionalService /
  // EmploymentAgency depending on listing type.
  const schemaType = SCHEMA_TYPE_MAP[listing.type] || 'ProfessionalService';
  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: listing.name,
    description: listing.description || undefined,
    url: listing.website || undefined,
    telephone: listing.phone || undefined,
    email: listing.email || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: cityLabel,
      addressCountry: 'TH',
      streetAddress: listing.address || undefined,
    },
    areaServed: {
      '@type': 'City',
      name: cityLabel,
    },
  };

  const breadcrumb = getBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Expert Directory', path: '/directory' },
    { name: listing.name, path: `/directory/${listing.slug}` },
  ]);

  return (
    <>
      <SEOHead
        title={`${listing.name} – ${typeLabel} in ${cityLabel} | ThaiHelper`}
        description={(listing.description || `${listing.name} — ${typeLabel} in ${cityLabel}, Thailand.`).slice(0, 160)}
        path={`/directory/${listing.slug}`}
        lang={lang}
        jsonLd={[breadcrumb, businessSchema]}
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
          <div className="max-w-5xl mx-auto px-4 md:px-6 pb-16">
            <Link href="/directory" className="text-sm text-slate-500 hover:text-primary mb-6 inline-block">
              {t.back_link}
            </Link>

            {/* Main card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">

              {/* Banner with overlapping circular logo */}
              <div className="h-24 md:h-32 bg-gradient-to-br from-primary to-[#00897f] relative">
                <div className="absolute -bottom-10 left-6 md:left-10">
                  {listing.logoUrl ? (
                    <img
                      src={listing.logoUrl}
                      alt={listing.name}
                      className="w-24 h-24 rounded-full object-contain border-4 border-white bg-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-white shadow-md flex items-center justify-center text-primary text-4xl font-extrabold">
                      {listing.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 md:p-10 pt-14 md:pt-16">

                {/* Header */}
                <div className="mb-5">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5 text-xs">
                    {listing.tier === 'featured' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">⭐ {t.badge_featured}</span>
                    )}
                    {listing.tier === 'premium' && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{t.badge_premium}</span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">{typeLabel}</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold font-headline leading-tight">
                    {displayName}
                  </h1>
                  <div className="text-sm text-slate-500 mt-1">📍 {cityLabel}</div>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {listing.website && (
                    <a href={listing.website} target="_blank" rel="nofollow noopener noreferrer"
                      onClick={() => trackClick(listing.id, 'website', clickSource)}
                      className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary-container transition-colors">
                      {t.cta_website}
                    </a>
                  )}
                  {listing.phone && (
                    <a href={`tel:${listing.phone}`}
                      onClick={() => trackClick(listing.id, 'phone', clickSource)}
                      className="px-5 py-2.5 rounded-full bg-white border border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors">
                      {t.cta_phone}
                    </a>
                  )}
                  {listing.whatsapp && (
                    <a href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="nofollow noopener noreferrer"
                      onClick={() => trackClick(listing.id, 'whatsapp', clickSource)}
                      className="px-5 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-bold hover:opacity-90 transition-opacity">
                      {t.cta_whatsapp}
                    </a>
                  )}
                  {listing.lineId && (
                    <a href={`https://line.me/R/ti/p/${listing.lineId.replace(/^@/, '')}`} target="_blank" rel="nofollow noopener noreferrer"
                      onClick={() => trackClick(listing.id, 'line', clickSource)}
                      className="px-5 py-2.5 rounded-full bg-[#06C755] text-white text-sm font-bold hover:opacity-90 transition-opacity">
                      {t.cta_line}
                    </a>
                  )}
                  {listing.email && (
                    <a href={`mailto:${listing.email}`}
                      onClick={() => trackClick(listing.id, 'email', clickSource)}
                      className="px-5 py-2.5 rounded-full bg-white border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors">
                      {t.cta_email}
                    </a>
                  )}
                </div>

                {/* About */}
                {displayDescription && (
                  <div className="mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{t.section_about}</h2>
                    <p className="text-base text-on-surface-variant leading-relaxed whitespace-pre-line">{displayDescription}</p>
                  </div>
                )}

                {/* How we can help — capability columns */}
                {(listing.languagesSpoken || listing.nationalitiesPlaced || listing.specialties) && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 md:p-6 mb-6">
                    <h2 className="text-sm font-bold text-on-surface mb-4">{t.section_help}</h2>
                    <div className="grid sm:grid-cols-3 gap-5">

                      {listing.languagesSpoken && (
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{t.col_speak}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {listing.languagesSpoken.split(',').map(s => s.trim()).filter(Boolean).map(slug => {
                              const opt = DIRECTORY_LANGUAGES.find(o => o.value === slug);
                              return opt ? (
                                <span key={slug} className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold">
                                  {opt[lang] || opt.en}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {listing.nationalitiesPlaced && (
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{t.col_hire}</div>
                          <div className="flex flex-wrap gap-2">
                            {listing.nationalitiesPlaced.split(',').map(s => s.trim()).filter(Boolean).map(slug => {
                              const nat = NATIONALITIES_PLACED.find(o => o.value === slug);
                              return nat ? (
                                <span key={slug} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold">
                                  <span>{nat.flag}</span>
                                  <span>{nat[lang] || nat.en}</span>
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {listing.specialties && (
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{t.col_expert}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {listing.specialties.split(',').map(s => s.trim()).filter(Boolean).map(slug => {
                              const opt = SPECIALTIES.find(o => o.value === slug);
                              return opt ? (
                                <span key={slug} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                                  {opt[lang] || opt.en}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fees — what the agency itself publishes. The one thing a
                    family wants before calling: one-off or monthly, who pays
                    the helper, what if it goes wrong. Never shown as our
                    price; the footnote names the source and the date. */}
                {listing.pricing && listing.pricing.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 md:p-6 mb-6">
                    <h2 className="text-sm font-bold text-on-surface mb-4">{t.section_pricing}</h2>
                    <div className="overflow-x-auto -mx-2 px-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                            <th className="pb-2 pr-4 font-bold">{t.pricing_col_package}</th>
                            <th className="pb-2 pr-4 font-bold whitespace-nowrap">{t.pricing_col_price}</th>
                            <th className="pb-2 font-bold">{t.pricing_col_includes}</th>
                          </tr>
                        </thead>
                        <tbody className="align-top">
                          {listing.pricing.map((pkg, i) => (
                            <tr key={i} className="border-t border-amber-100">
                              <td className="py-2.5 pr-4 font-semibold text-on-background">{packageName(pkg, lang)}</td>
                              <td className="py-2.5 pr-4 whitespace-nowrap font-bold text-primary">{formatPackagePrice(pkg, lang)}</td>
                              <td className="py-2.5 text-slate-700">
                                {packageIncludes(pkg, lang)}
                                {(pkg.replacement_days || pkg.min_months) && (
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {pkg.replacement_days ? (
                                      <span className="px-2 py-0.5 rounded-full bg-white border border-amber-200 text-[11px] font-semibold text-amber-800">
                                        {t.pricing_guarantee.replace('{n}', pkg.replacement_days)}
                                      </span>
                                    ) : null}
                                    {pkg.min_months ? (
                                      <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600">
                                        {t.pricing_min.replace('{n}', pkg.min_months)}
                                      </span>
                                    ) : null}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {listing.paymentFlow && (
                      <div className="mt-4 text-sm">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400 mr-2">{t.pricing_pays_label}</span>
                        <span className="text-slate-700">{paymentFlowLong(listing.paymentFlow, lang)}</span>
                      </div>
                    )}
                    {(lang === 'th' ? (listing.pricingNoteTh || listing.pricingNote) : listing.pricingNote) && (
                      <p className="mt-2 text-sm text-slate-700">
                        {lang === 'th' ? (listing.pricingNoteTh || listing.pricingNote) : listing.pricingNote}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-slate-500 leading-snug">
                      {listing.pricingCheckedAt
                        ? t.pricing_source.replace('{date}', formatCheckedDate(listing.pricingCheckedAt, lang))
                        : t.pricing_source_nodate}
                      {listing.pricingUrl && (
                        <>
                          {' '}
                          <a href={listing.pricingUrl} target="_blank" rel="nofollow noopener noreferrer"
                            onClick={() => trackClick(listing.id, 'website', clickSource)}
                            className="text-primary font-semibold hover:underline">
                            {t.pricing_source_link}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Contact details — structured rows */}
                <div className="rounded-2xl border border-slate-200 p-5 md:p-6 mb-6">
                  <h2 className="text-sm font-bold text-on-surface mb-4">{t.section_contact_detail}</h2>
                  <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">

                    {listing.address && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{t.section_address}</dt>
                        <dd className="text-slate-700 whitespace-pre-line">
                          {listing.address}
                          {listing.googleMapsUrl && (
                            <a href={listing.googleMapsUrl} target="_blank" rel="nofollow noopener noreferrer"
                              onClick={() => trackClick(listing.id, 'maps', clickSource)}
                              className="block text-xs text-primary hover:underline mt-1">
                              {t.cta_directions}
                            </a>
                          )}
                        </dd>
                      </div>
                    )}

                    {listing.phone && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{t.label_phone}</dt>
                        <dd><a href={`tel:${listing.phone}`} className="text-slate-700 hover:text-primary">{listing.phone}</a></dd>
                      </div>
                    )}

                    {listing.whatsapp && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{t.cta_whatsapp}</dt>
                        <dd>
                          <a href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="nofollow noopener noreferrer"
                            className="text-slate-700 hover:text-primary">{listing.whatsapp}</a>
                        </dd>
                      </div>
                    )}

                    {listing.lineId && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{t.cta_line}</dt>
                        <dd>
                          <a href={`https://line.me/R/ti/p/${listing.lineId.replace(/^@/, '')}`} target="_blank" rel="nofollow noopener noreferrer"
                            className="text-slate-700 hover:text-primary">{listing.lineId}</a>
                        </dd>
                      </div>
                    )}

                    {listing.email && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{t.label_email}</dt>
                        <dd><a href={`mailto:${listing.email}`} className="text-slate-700 hover:text-primary break-all">{listing.email}</a></dd>
                      </div>
                    )}

                    {listing.openingHours && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{t.section_hours}</dt>
                        <dd className="text-slate-700 whitespace-pre-line">{listing.openingHours}</dd>
                      </div>
                    )}

                    {listing.licenseNumber && (
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{t.section_license}</dt>
                        <dd className="font-mono text-slate-700 font-semibold">{listing.licenseNumber}</dd>
                      </div>
                    )}

                    {listing.citiesServed && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">{t.section_serves}</dt>
                        <dd className="text-slate-700">
                          {formatCsvList(listing.citiesServed, CITY_OPTIONS.map(c => ({ value: c.slug, en: c.name, th: c.name })), lang)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <p className="text-xs text-slate-400 leading-snug">{t.listing_disclaimer}</p>
              </div>
            </div>

            {/* Other experts in this city */}
            {siblings.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3">
                  {t.section_others.replace('{city}', cityLabel)}
                </h2>
                <div className="grid gap-3">
                  {siblings.map(s => (
                    <Link
                      key={s.id}
                      href={`/directory/${s.slug}`}
                      className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-primary/40 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold">
                            {lang === 'th' && s.nameTh ? s.nameTh : s.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {formatDirectoryType(s.type, lang)}
                          </div>
                        </div>
                        <span className="text-primary text-sm">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <LegalDisclaimer lang={lang} />
          </div>
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
            </div>
            <p className="text-slate-400 text-xs mt-4">© 2026 ThaiHelper.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
