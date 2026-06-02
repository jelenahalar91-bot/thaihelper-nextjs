const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Bilingual: English at the root (/), Thai under /th/. localeDetection
  // is disabled so visitors aren't auto-redirected based on browser
  // Accept-Language — the LangSwitcher gives explicit control instead.
  i18n: {
    locales: ['en', 'th'],
    defaultLocale: 'en',
    localeDetection: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Supabase Storage public URLs — running them through Next.js
        // Image lets Vercel's CDN absorb the bandwidth (free 100 GB/mo)
        // instead of hammering Supabase egress (free 5 GB/mo). Bots
        // scraping /helpers now hit Vercel for compressed WebPs, not
        // 2-5 MB originals on Supabase.
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Cache optimised images on Vercel's CDN for 30 days — once the
    // first user hits an (image, size) combo, every subsequent fetch
    // for the next 30 days bypasses both Supabase AND our function.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  // Security & caching headers
  async headers() {
    return [
      {
        // `locale: false` is required when i18n is configured — otherwise
        // Next auto-prefixes the source with each locale (so `/(.*)` becomes
        // `/en/(.*)` and `/th/(.*)`), and the bare root URL `/` (which
        // internally rewrites to `/en`) stops matching. Without this flag,
        // /login, /th/login, /api/* all kept their security headers but
        // the homepage `/` dropped X-Frame-Options, nosniff, etc. after
        // the Next 16 upgrade.
        source: '/:path*',
        locale: false,
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Static assets: long-lived cache
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Fonts
        source: '/fonts/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    // Short links for marketing channels — keep them <= 5 chars after the slash
    // so they're easy to type into a Facebook comment. Each one preserves UTM
    // attribution via the destination query string, so analytics still work.
    const helperLinks = [
      { src: '/fb',  campaign: 'jobseekers' },
      { src: '/bk',  campaign: 'bangkok-jobs' },
      { src: '/cm',  campaign: 'chiangmai-jobs' },
      { src: '/pt',  campaign: 'pattaya-jobs' },
      { src: '/ph',  campaign: 'phuket-jobs' },
      { src: '/ks',  campaign: 'samui-jobs' },
      { src: '/bm',  campaign: 'burmese-jobs' },
      { src: '/cg',  campaign: 'caregiver-jobs' },
    ].map(({ src, campaign }) => ({
      source: src,
      destination: `/register?utm_source=facebook&utm_medium=comment&utm_campaign=${campaign}`,
      permanent: false,
    }));

    const familyLinks = [
      { src: '/fam',    campaign: 'family-search' },
      { src: '/fam-nn', campaign: 'family-nanny' },
      { src: '/fam-hk', campaign: 'family-housekeeper' },
      { src: '/fam-cg', campaign: 'family-caregiver' },
    ].map(({ src, campaign }) => ({
      source: src,
      destination: `/employers?utm_source=facebook&utm_medium=comment&utm_campaign=${campaign}`,
      permanent: false,
    }));

    // Group-post shortlinks — land on the homepage so both helpers and
    // families can self-select. utm_medium=group-post distinguishes these
    // from the comment shortlinks above.
    const groupPostLinks = [
      { src: '/fbg', campaign: 'bangkok-may-2026' },
    ].map(({ src, campaign }) => ({
      source: src,
      destination: `/?utm_source=facebook&utm_medium=group-post&utm_campaign=${campaign}`,
      permanent: false,
    }));

    // Expat-group posts targeting families → land directly on /employers.
    // Two variants so we can A/B which post wording converts better.
    const expatGroupEmployerLinks = [
      { src: '/fbe1', campaign: 'expat-2026-05-p1' }, // empathy hook variant
      { src: '/fbe2', campaign: 'expat-2026-05-p2' }, // direct-value variant
    ].map(({ src, campaign }) => ({
      source: src,
      destination: `/employers?utm_source=facebook&utm_medium=group-post&utm_campaign=${campaign}`,
      permanent: false,
    }));

    // Family group-posts that invite browsing → land directly on /helpers
    // (the public profile grid) so the "browse without signing up" promise
    // in the post is one click away.
    const familyBrowseGroupLinks = [
      { src: '/fbp', campaign: 'phuket-nanny-2026-05' }, // Phuket nanny/housekeeping group
    ].map(({ src, campaign }) => ({
      source: src,
      destination: `/helpers?utm_source=facebook&utm_medium=group-post&utm_campaign=${campaign}`,
      permanent: false,
    }));

    const shortlinks = [...helperLinks, ...familyLinks, ...groupPostLinks, ...expatGroupEmployerLinks, ...familyBrowseGroupLinks];

    return [
      {
        // Old confirmation emails linked to /inbox, but messaging lives in /profile (tab "Messages").
        // Keeps old email links working and removes the GSC 404.
        source: '/inbox',
        destination: '/profile',
        permanent: true,
      },
      ...shortlinks,
    ];
  },

  // Compress output
  compress: true,

  // Optimize production builds
  poweredByHeader: false,
}

module.exports = withSentryConfig(nextConfig, {
  // Suppress source map upload warnings when SENTRY_AUTH_TOKEN is not set
  silent: true,
  // Don't widen the Next.js bundle with Sentry webpack plugin in dev
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
})
