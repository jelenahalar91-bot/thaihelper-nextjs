const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Security & caching headers
  async headers() {
    return [
      {
        source: '/(.*)',
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

    const shortlinks = [...helperLinks, ...familyLinks];

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
