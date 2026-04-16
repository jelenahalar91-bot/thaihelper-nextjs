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

      {/* Bing-specific meta tags — Bing powers ChatGPT search */}
      <meta name="msnbot" content="index, follow" />
      <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large" />

      {/* hreflang omitted — language is client-side (localStorage), not URL-based.
         All languages share the same URL so hreflang would be misleading to crawlers.
         Re-add when locale-based routing (/th/, /ru/) is implemented. */}

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
    alternateName: 'Thai Helper',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description: 'ThaiHelper is Thailand\'s free marketplace for household staff. Families find verified nannies, housekeepers, chefs, drivers, gardeners, elder caregivers, and tutors. Helpers create free profiles and connect directly with families — no agency fees, no middleman.',
    foundingDate: '2024',
    founder: {
      '@type': 'Person',
      name: 'Jelena Hermann',
      jobTitle: 'Founder',
    },
    parentOrganization: {
      '@type': 'Organization',
      name: 'Planet Bamboo GmbH',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'DE',
      },
    },
    areaServed: {
      '@type': 'Country',
      name: 'Thailand',
    },
    knowsLanguage: ['en', 'th', 'ru'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['English', 'Thai', 'Russian'],
      url: `${SITE_URL}/about`,
    },
    sameAs: [
      'https://line.me/R/ti/p/@097ymfte',
    ],
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
 * LocalBusiness schema for city landing pages — boosts GEO for location-specific queries
 */
export function getLocalBusinessSchema(city) {
  const cities = {
    bangkok: { name: 'Bangkok', lat: 13.7563, lng: 100.5018, region: 'Bangkok' },
    'chiang-mai': { name: 'Chiang Mai', lat: 18.7061, lng: 98.9817, region: 'Chiang Mai' },
    phuket: { name: 'Phuket', lat: 7.8804, lng: 98.3923, region: 'Phuket' },
    pattaya: { name: 'Pattaya', lat: 12.9236, lng: 100.8825, region: 'Chonburi' },
    'koh-samui': { name: 'Koh Samui', lat: 9.5120, lng: 100.0136, region: 'Surat Thani' },
    'hua-hin': { name: 'Hua Hin', lat: 12.5684, lng: 99.9577, region: 'Prachuap Khiri Khan' },
  };
  const c = cities[city] || cities.bangkok;
  return {
    '@context': 'https://schema.org',
    '@type': 'EmploymentAgency',
    name: `ThaiHelper ${c.name}`,
    description: `Find verified nannies, housekeepers, chefs, drivers and household staff in ${c.name}, Thailand. Free for helpers — no agency fees.`,
    url: `${SITE_URL}/helpers?city=${city}`,
    telephone: '',
    address: {
      '@type': 'PostalAddress',
      addressLocality: c.name,
      addressRegion: c.region,
      addressCountry: 'TH',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: c.lat,
      longitude: c.lng,
    },
    areaServed: {
      '@type': 'City',
      name: c.name,
    },
    priceRange: 'Free for helpers',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
  };
}

/**
 * Speakable schema — tells AI voice assistants which parts to read aloud
 */
export function getSpeakableSchema(path, cssSelectors = ['h1', '.hero-description', '.faq-answer']) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: `${SITE_URL}${path}`,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: cssSelectors,
    },
  };
}

/**
 * ItemList schema for helper listings — helps AI understand the marketplace structure
 */
export function getItemListSchema(items, listName = 'Household Staff in Thailand') {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 10).map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Person',
        name: item.name || item.first_name,
        jobTitle: item.category || item.service,
        url: `${SITE_URL}/helpers`,
      },
    })),
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
