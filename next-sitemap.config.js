/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://thaihelper.app',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,

  // Do NOT index auth, dashboard, or user-specific pages
  exclude: [
    '/login',
    '/verify',
    '/profile',
    '/profile/*',
    '/employer-login',
    '/employer-dashboard',
    '/employer-profile',
    '/employer-register',
    '/api/*',
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/profile/',
          '/login',
          '/verify',
          '/employer-login',
          '/employer-dashboard',
          '/employer-profile',
        ],
      },
      // Explicitly allow AI crawlers — critical for GEO (Generative Engine Optimization)
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'Bytespider', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
    ],
    additionalSitemaps: [],
  },

  // Custom priority per page — tells Google what matters most
  transform: async (config, path) => {
    // Homepage = highest priority
    if (path === '/') {
      return { loc: path, changefreq: 'daily', priority: 1.0, lastmod: new Date().toISOString() };
    }
    // High-value SEO pages
    if (['/helpers', '/register', '/employers', '/employers-browse'].includes(path)) {
      return { loc: path, changefreq: 'daily', priority: 0.9, lastmod: new Date().toISOString() };
    }
    // City/category landing pages (SEO gold)
    if (path.startsWith('/hire/')) {
      return { loc: path, changefreq: 'weekly', priority: 0.9, lastmod: new Date().toISOString() };
    }
    // Blog posts
    if (path.startsWith('/blog/')) {
      return { loc: path, changefreq: 'monthly', priority: 0.8, lastmod: new Date().toISOString() };
    }
    // Blog index, FAQ, about
    if (['/blog', '/faq', '/about'].includes(path)) {
      return { loc: path, changefreq: 'weekly', priority: 0.8, lastmod: new Date().toISOString() };
    }
    // Legal pages — low priority
    if (['/privacy', '/terms', '/pricing'].includes(path)) {
      return { loc: path, changefreq: 'monthly', priority: 0.3, lastmod: new Date().toISOString() };
    }
    // Default
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
