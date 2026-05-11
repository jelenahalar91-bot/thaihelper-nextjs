import Link from 'next/link';
import SEOHead, { getBreadcrumbSchema, getLocalBusinessSchema, getSpeakableSchema } from '@/components/SEOHead';
import SEOFooter from '@/components/SEOFooter';
import { useLang } from '@/pages/_app';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu, ResourcesDropdown } from '@/components/MobileMenu';
import { getAllHirePages, getHirePageBySlug } from '@/lib/seo/hire-pages';
import { CATEGORIES, CATEGORIES_DATA } from '@/lib/constants/categories';
import { CITIES_DATA } from '@/lib/constants/cities';

// ─── Static generation ──────────────────────────────────────────────────────

export async function getStaticPaths() {
  const pages = getAllHirePages();
  return {
    paths: pages.map((p) => ({ params: { slug: p.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const page = getHirePageBySlug(params.slug);
  if (!page) return { notFound: true };

  // Fetch real helpers matching this page's city/category
  let matchingHelpers = [];
  try {
    const { getServiceSupabase } = await import('@/lib/supabase');
    const supabase = getServiceSupabase();
    let query = supabase
      .from('helper_profiles')
      .select('first_name, last_name, age, date_of_birth, category, city, area, experience, languages, photo_url, bio, bio_en')
      .or('status.eq.active,status.is.null')
      .eq('email_verified', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (page.cityEn) {
      query = query.ilike('city', page.cityEn);
    }
    if (page.category) {
      query = query.ilike('category', `%${page.category}%`);
    }

    const { data } = await query;
    const { getDisplayAge } = await import('@/lib/age');
    matchingHelpers = (data || []).map((row) => ({
      firstName: row.first_name,
      lastInitial: row.last_name ? row.last_name.charAt(0) + '.' : '',
      age: getDisplayAge(row) || null,
      category: row.category || '',
      city: row.city || '',
      area: row.area || '',
      experience: row.experience || '',
      languages: row.languages || '',
      photo: row.photo_url || '',
      bio: row.bio ? row.bio.slice(0, 120) : '',
      bioEn: row.bio_en ? row.bio_en.slice(0, 120) : '',
    }));
  } catch (err) {
    console.error('Failed to fetch helpers for hire page:', err);
  }

  return {
    props: { page, matchingHelpers },
    revalidate: 3600, // Re-generate every hour with fresh data
  };
}

// ─── FAQ data per category ──────────────────────────────────────────────────

function getFaqs(page) {
  const cat = page.categoryEn || 'helper';
  const city = page.cityEn || 'Thailand';
  const catLower = cat.toLowerCase();

  return [
    {
      question: `How much does a ${catLower} cost in ${city}?`,
      answer: `${cat} rates in ${city} vary based on experience, hours, and duties. On ThaiHelper you can browse profiles with transparent pricing — typically ranging from 10,000–35,000 THB/month for full-time positions, or 150–500 THB/hour for part-time work.`,
    },
    {
      question: `How do I find a trusted ${catLower} in ${city}?`,
      answer: `On ThaiHelper, every ${catLower} verifies their email before their profile goes live. Browse profiles, contact them directly, and conduct your own interview and reference checks — no agency middleman, no hidden fees.`,
    },
    {
      question: `Is ThaiHelper free for ${catLower}s?`,
      answer: `Yes! Creating a profile on ThaiHelper is 100% free for helpers. Only employers pay a small fee to access contact details of verified helpers.`,
    },
    {
      question: `Can I hire a ${catLower} without an agency in ${city}?`,
      answer: `Absolutely. ThaiHelper is designed for direct connections. You find the ${catLower}, contact them directly, and agree on terms — no agency fees, no middleman.`,
    },
    {
      question: `What areas in ${city} does ThaiHelper cover?`,
      answer: `ThaiHelper covers all areas in ${city}. Helpers specify their preferred working areas in their profile so you can find someone near you.`,
    },
  ];
}

// ─── Related pages for internal linking ─────────────────────────────────────

function getRelatedPages(page) {
  const all = getAllHirePages();
  const related = [];

  // If this is a city+category page, link to the city page and category page
  if (page.city && page.category) {
    const cityPage = all.find((p) => p.city === page.city && !p.category);
    const catPage = all.find((p) => p.category === page.category && !p.city);
    if (cityPage) related.push(cityPage);
    if (catPage) related.push(catPage);
  }

  // Link to other categories in the same city
  if (page.city) {
    const sameCityPages = all.filter(
      (p) => p.city === page.city && p.category && p.slug !== page.slug
    );
    related.push(...sameCityPages.slice(0, 4));
  }

  // Link to same category in other cities
  if (page.category) {
    const sameCatPages = all.filter(
      (p) => p.category === page.category && p.city && p.slug !== page.slug
    );
    related.push(...sameCatPages.slice(0, 4));
  }

  // Deduplicate
  const seen = new Set();
  return related.filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  }).slice(0, 8);
}

// ─── Page component ─────────────────────────────────────────────────────────

export default function HirePage({ page, matchingHelpers = [] }) {
  const { lang } = useLang();
  const faqs = getFaqs(page);
  const related = getRelatedPages(page);
  const isEn = lang === 'en';

  const title = isEn ? page.title : (page.titleTh || page.title_th || page.title);
  const description = isEn
    ? page.description
    : (page.descriptionTh || page.description_th || page.description);
  // Fallback chain ensures h1 is never empty (critical for SEO)
  const h1En = page.h1
    || (page.categoryEn && page.cityEn ? `Find a Trusted ${page.categoryEn} in ${page.cityEn}` : null)
    || (page.categoryEn ? `Find a Trusted ${page.categoryEn} in Thailand` : null)
    || (page.cityEn ? `Find Trusted Household Staff in ${page.cityEn}` : 'Find Household Staff in Thailand');
  const h1Th = page.h1Th
    || (page.categoryTh && page.cityTh ? `หา${page.categoryTh}ใน${page.cityTh}` : null)
    || (page.categoryTh ? `หา${page.categoryTh}ในประเทศไทย` : null)
    || (page.cityTh ? `หาผู้ช่วยงานบ้านใน${page.cityTh}` : 'หาผู้ช่วยงานบ้านในประเทศไทย');
  const h1 = isEn ? h1En : h1Th;

  // Critical: use computed h1En / h1Th (never undefined) — not raw page.h1.
  // GSC flagged BreadcrumbList items with empty `name` on pages where
  // page.h1 was missing, causing "Entweder 'name' oder 'item.name' müssen
  // angegeben werden" rich-result errors that block Rich Snippets.
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: isEn ? 'Browse Helpers' : 'ดูผู้ช่วย', path: '/helpers' },
    { name: isEn ? h1En : h1Th, path: `/hire/${page.slug}` },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: page.categoryEn ? `${page.categoryEn} Services` : 'Household Staff',
    provider: { '@type': 'Organization', name: 'ThaiHelper', url: 'https://thaihelper.app' },
    areaServed: page.cityEn
      ? { '@type': 'City', name: page.cityEn, containedInPlace: { '@type': 'Country', name: 'Thailand' } }
      : { '@type': 'Country', name: 'Thailand' },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'THB', description: 'Free for helpers.' },
  };

  // ItemList schema — exposes the matched helpers on this page as a list
  // of Person items. Google can render this as a richer search result
  // and AI crawlers (Perplexity, ChatGPT) ingest it more reliably.
  // Each helper is anonymised (first name + initial only) to match the
  // visible card content.
  const itemListSchema = matchingHelpers.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        numberOfItems: matchingHelpers.length,
        name: page.categoryEn && page.cityEn
          ? `${page.categoryEn} profiles in ${page.cityEn}`
          : page.categoryEn
          ? `${page.categoryEn} profiles in Thailand`
          : page.cityEn
          ? `Household helper profiles in ${page.cityEn}`
          : 'Household helper profiles in Thailand',
        itemListElement: matchingHelpers.map((h, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Person',
            name: `${h.firstName || ''} ${h.lastInitial || ''}`.trim() || 'Verified helper',
            jobTitle: page.categoryEn || h.category || 'Household helper',
            address: {
              '@type': 'PostalAddress',
              addressLocality: h.city || page.cityEn || 'Thailand',
              addressCountry: 'TH',
            },
            knowsLanguage: h.languages
              ? h.languages.split(',').map((l) => l.trim()).filter(Boolean)
              : undefined,
            description: (h.bioEn || h.bio || '').slice(0, 200) || undefined,
            image: h.photo || undefined,
          },
        })),
      }
    : null;

  return (
    <>
      <SEOHead
        title={title}
        description={description}
        path={`/hire/${page.slug}`}
        lang={lang}
        jsonLd={[
          faqSchema,
          serviceSchema,
          getBreadcrumbSchema(breadcrumbs),
          getSpeakableSchema(`/hire/${page.slug}`),
          ...(itemListSchema ? [itemListSchema] : []),
          ...(page.city ? [getLocalBusinessSchema(page.city)] : []),
        ]}
      />

      <div className="bg-surface text-on-background font-body min-h-screen">
        {/* Nav */}
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm px-4 md:px-6 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold font-headline">
            <span>Thai</span><span style={{ color: '#006a62' }}>Helper</span>
          </Link>
          {(() => {
            const navItems = [
              { href: '/helpers',             label: isEn ? 'Browse Helpers' : 'ดูผู้ช่วย' },
              { href: '/employers',           label: isEn ? 'For Families' : 'สำหรับครอบครัว' },
              { href: '/work-permit-wizard',  label: isEn ? 'Work Permit Wizard' : 'ตัวช่วยใบอนุญาตทำงาน' },
              { href: '/directory',           label: isEn ? 'Expert Directory' : 'รายชื่อผู้เชี่ยวชาญ' },
              { href: '/about',               label: isEn ? 'About' : 'เกี่ยวกับเรา' },
              { href: '/faq',                 label: isEn ? 'FAQ' : 'คำถามที่พบบ่อย' },
              { href: '/blog',                label: isEn ? 'Blog' : 'บล็อก' },
            ];
            return (
              <>
                <div className="hidden lg:flex items-center gap-3">
                  <ResourcesDropdown label={isEn ? 'Resources' : 'แหล่งข้อมูล'} items={navItems} />
                  <Link href="/register" className="text-sm font-bold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 transition-colors whitespace-nowrap">
                    {isEn ? 'Register Free' : 'สมัครฟรี'}
                  </Link>
                  <LangSwitcher />
                </div>
                <div className="lg:hidden">
                  <MobileMenu
                    items={navItems}
                    secondaryCta={{ href: '/login', label: isEn ? 'Login' : 'เข้าสู่ระบบ' }}
                    primaryCta={{ href: '/register', label: isEn ? 'Register Free' : 'สมัครฟรี' }}
                  />
                </div>
              </>
            );
          })()}
        </nav>

        {/* Breadcrumbs */}
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path}>
                {i > 0 && <span className="mx-1">/</span>}
                {i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.path} className="hover:text-primary transition-colors">{crumb.name}</Link>
                ) : (
                  <span className="text-gray-800 font-medium">{crumb.name}</span>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 pt-8 pb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-[#001b3d] mb-4">
            {h1}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mb-4">
            {description}
          </p>

          {/* Synonyms — visible long-tail keyword anchor for SEO.
              Targets GSC queries with impressions but 0 clicks
              (e.g. "babysitter bangkok", "live-in maid"). */}
          {isEn && page.synonyms && (
            <p className="text-sm text-gray-500 max-w-2xl mb-8">
              <span className="font-medium">Also searched as:</span> {page.synonyms}
              {page.cityEn ? ` in ${page.cityEn}` : ' in Thailand'}.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href={page.category ? `/helpers?category=${encodeURIComponent(CATEGORIES.find(c => c.value === page.category)?.en || '')}${page.city ? `&city=${encodeURIComponent(page.city)}` : ''}` : page.city ? `/helpers?city=${encodeURIComponent(page.city)}` : '/helpers'}
              className="bg-primary text-white font-bold px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
            >
              {isEn ? `Browse ${page.categoryEn || ''} Profiles${page.cityEn ? ` in ${page.cityEn}` : ''}` : `ดูโปรไฟล์${page.categoryTh || ''}${page.cityTh ? `ใน${page.cityTh}` : ''}`}
            </Link>
            <Link
              href="/register"
              className="border-2 border-primary text-primary font-bold px-6 py-3 rounded-full hover:bg-primary/5 transition-colors"
            >
              {isEn ? 'Register as Helper — Free' : 'สมัครเป็นผู้ช่วย — ฟรี'}
            </Link>
          </div>
        </section>

        {/* Real helpers from database — unique content per page for SEO */}
        {matchingHelpers.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pb-12">
            <h2 className="text-2xl font-bold font-headline text-[#001b3d] mb-6">
              {isEn
                ? `${page.categoryEn || 'Helper'} Profiles${page.cityEn ? ` in ${page.cityEn}` : ''}`
                : `โปรไฟล์${page.categoryTh || page.category_th || 'ผู้ช่วย'}${page.cityTh || page.city_th ? `ใน${page.cityTh || page.city_th}` : ''}`}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchingHelpers.map((h, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    {h.photo ? (
                      <img src={h.photo} alt={`${h.firstName} — ${h.category}`} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-lg font-bold">{h.firstName?.charAt(0)}</div>
                    )}
                    <div>
                      <p className="font-semibold text-[#001b3d]">{h.firstName} {h.lastInitial}</p>
                      <p className="text-xs text-gray-500">{h.city}{h.area ? `, ${h.area}` : ''}</p>
                    </div>
                  </div>
                  {(() => {
                    const bio = lang === 'th' ? h.bio : (h.bioEn || h.bio);
                    return bio && <p className="text-sm text-gray-600 mb-2">{bio}{bio.length >= 120 ? '...' : ''}</p>;
                  })()}
                  <div className="flex flex-wrap gap-1.5 text-xs text-gray-500">
                    {h.experience && <span className="bg-gray-100 px-2 py-0.5 rounded">{h.experience}</span>}
                    {h.languages && <span className="bg-gray-100 px-2 py-0.5 rounded">{h.languages}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link
                href={page.category ? `/helpers?category=${encodeURIComponent(page.categoryEn || '')}${page.cityEn ? `&city=${encodeURIComponent(page.cityEn)}` : ''}` : `/helpers${page.cityEn ? `?city=${encodeURIComponent(page.cityEn)}` : ''}`}
                className="text-primary font-semibold hover:underline"
              >
                {isEn ? `View all profiles →` : 'ดูโปรไฟล์ทั้งหมด →'}
              </Link>
            </div>
          </section>
        )}

        {/* How it works — brief */}
        <section className="bg-gray-50 py-12">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold font-headline text-center mb-8">
              {isEn ? 'How It Works' : 'วิธีการทำงาน'}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: '1', h: isEn ? 'Browse Profiles' : 'ดูโปรไฟล์', p: isEn ? 'Search helpers by city, category, and experience. Every profile uses an email-verified account.' : 'ค้นหาผู้ช่วยตามเมือง ประเภท และประสบการณ์ ทุกโปรไฟล์ใช้บัญชีที่ยืนยันอีเมลแล้ว' },
                { icon: '2', h: isEn ? 'Connect Directly' : 'ติดต่อโดยตรง', p: isEn ? 'Contact helpers directly. No middleman, no agency fees. Agree on terms together.' : 'ติดต่อโดยตรง ไม่ผ่านเอเจนซี่ ตกลงเงื่อนไขร่วมกัน' },
                { icon: '3', h: isEn ? 'Hire with Confidence' : 'จ้างอย่างมั่นใจ', p: isEn ? 'Structured profiles and direct messaging help you compare candidates and make the right choice.' : 'โปรไฟล์ที่มีโครงสร้างและการส่งข้อความโดยตรงช่วยให้คุณเปรียบเทียบและเลือกได้อย่างมั่นใจ' },
              ].map((step) => (
                <div key={step.icon} className="bg-white rounded-xl p-6 shadow-sm text-center">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">{step.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{step.h}</h3>
                  <p className="text-gray-600 text-sm">{step.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section — critical for SEO */}
        <section className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold font-headline text-center mb-8">
            {isEn ? 'Frequently Asked Questions' : 'คำถามที่พบบ่อย'}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-[#001b3d] hover:bg-gray-50 transition-colors">
                  {faq.question}
                </summary>
                <p className="px-6 pb-4 text-gray-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Internal links — critical for SEO link juice */}
        {related.length > 0 && (
          <section className="bg-gray-50 py-12">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-2xl font-bold font-headline text-center mb-8">
                {isEn ? 'Related Searches' : 'การค้นหาที่เกี่ยวข้อง'}
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {related.map((rp) => (
                  <Link
                    key={rp.slug}
                    href={`/hire/${rp.slug}`}
                    className="bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-medium text-[#001b3d] hover:border-primary hover:text-primary transition-colors shadow-sm"
                  >
                    {isEn ? rp.h1 : (rp.cityTh && rp.categoryTh ? `${rp.categoryTh} ${rp.cityTh}` : rp.categoryTh || rp.cityTh)}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-[#001b3d] text-white py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold font-headline mb-4">
              {isEn
                ? `Are you a ${page.categoryEn?.toLowerCase() || 'helper'}${page.cityEn ? ` in ${page.cityEn}` : ''}?`
                : `คุณเป็น${page.categoryTh || 'ผู้ช่วย'}${page.cityTh ? `ใน${page.cityTh}` : ''}หรือไม่?`}
            </h2>
            <p className="text-lg opacity-80 mb-8">
              {isEn
                ? 'Create your free profile today and let families find you. No fees, no middleman.'
                : 'สร้างโปรไฟล์ฟรีวันนี้ ให้ครอบครัวค้นพบคุณ ไม่มีค่าธรรมเนียม'}
            </p>
            <Link
              href="/register"
              className="inline-block bg-[#c8a951] text-[#001b3d] font-bold px-8 py-4 rounded-full text-lg hover:bg-[#d4b962] transition-colors"
            >
              {isEn ? 'Register Now — Free' : 'สมัครเลย — ฟรี'}
            </Link>
          </div>
        </section>

        {/* SEO Footer — internal links to top cities + categories so every
            /hire/* page passes link juice to the others. Helps Google index
            the long-tail combo pages that are currently flagged
            "Discovered – currently not indexed". */}
        <SEOFooter lang={lang} />
      </div>
    </>
  );
}
