import Head from 'next/head';

const SITE_URL = 'https://thaihelper.app';
const SITE_NAME = 'ThaiHelper';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

const LANG_MAP = {
  en: { hreflang: 'en', label: 'English' },
  th: { hreflang: 'th', label: 'Thai' },
  ru: { hreflang: 'ru', label: 'Russian' },
};

/**
 * Reusable SEO head component with:
 * - Meta tags (title, description, canonical)
 * - Open Graph + Twitter Card
 * - hreflang tags for multilingual
 * - JSON-LD structured data
 */
export default function SEOHead({
  title,
  description,
  path = '/',
  lang = 'en',
  jsonLd,
  noindex = false,
}) {
  const canonicalUrl = `${SITE_URL}${path}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="canonical" href={canonicalUrl} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* hreflang for each supported language */}
      {Object.entries(LANG_MAP).map(([code, { hreflang }]) => (
        <link
          key={code}
          rel="alternate"
          hrefLang={hreflang}
          href={canonicalUrl}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={lang === 'th' ? 'th_TH' : lang === 'ru' ? 'ru_RU' : 'en_US'} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </Head>
  );
}

/**
 * Organization schema — use on every page via _app.js
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ThaiHelper',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description: 'Free platform connecting families in Thailand with trusted household staff — nannies, housekeepers, chefs, drivers, and more.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['English', 'Thai', 'Russian'],
    },
    sameAs: [],
  };
}

/**
 * WebSite schema with SearchAction for sitelinks search box
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ThaiHelper',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/helpers?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Service schema for homepage
 */
export function getServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Household Staff Placement',
    provider: {
      '@type': 'Organization',
      name: 'ThaiHelper',
      url: SITE_URL,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Thailand',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Household Services',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Nanny & Babysitter' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Housekeeper & Cleaner' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Private Chef & Cook' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Driver & Chauffeur' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Gardener & Pool Care' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Elder Care & Caregiver' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Tutor & Teacher' } },
      ],
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'THB',
      description: 'Free for helpers. Employers pay for verified access.',
    },
  };
}

/**
 * FAQ schema — pass an array of { question, answer }
 */
export function getFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

/**
 * BlogPosting schema for blog articles
 */
export function getBlogPostingSchema({ title, description, slug, date, readTime }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: `${SITE_URL}/blog/${slug}`,
    datePublished: date,
    dateModified: date,
    author: {
      '@type': 'Organization',
      name: 'ThaiHelper',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ThaiHelper',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
    wordCount: readTime * 200,
    timeRequired: `PT${readTime}M`,
  };
}

/**
 * BreadcrumbList schema
 */
export function getBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
