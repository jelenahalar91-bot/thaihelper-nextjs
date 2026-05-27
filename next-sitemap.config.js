/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://thaihelper.app',
  // robots.txt is managed manually in public/robots.txt (see commit
  // 413204b — bot-blocking strategy from the May 2026 Egress overage).
  // next-sitemap was silently overwriting the manual file on every
  // build, undoing the deliberate blocks. Keeping this false so the
  // manual file is the single source of truth.
  generateRobotsTxt: false,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,

  // Bilingual: Next.js i18n adds /th/ URLs automatically. We add
  // hreflang alternates so search engines know the relationship.
  alternateRefs: [
    { href: 'https://thaihelper.app',       hreflang: 'en' },
    { href: 'https://thaihelper.app/th',    hreflang: 'th' },
    { href: 'https://thaihelper.app',       hreflang: 'x-default' },
  ],

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

  // Custom priority per page — tells Google what matters most.
  // alternateRefs must be passed through manually: next-sitemap drops
  // the top-level alternateRefs when a custom transform is provided.
  transform: async (config, path) => {
    const lastmod = new Date().toISOString();
    const alternateRefs = config.alternateRefs;
    // Homepage = highest priority
    if (path === '/') {
      return { loc: path, changefreq: 'daily', priority: 1.0, lastmod, alternateRefs };
    }
    // High-value SEO pages
    if (['/helpers', '/register', '/employers', '/employers-browse'].includes(path)) {
      return { loc: path, changefreq: 'daily', priority: 0.9, lastmod, alternateRefs };
    }
    // City/category landing pages (SEO gold)
    if (path.startsWith('/hire/')) {
      return { loc: path, changefreq: 'weekly', priority: 0.9, lastmod, alternateRefs };
    }
    // Blog posts
    if (path.startsWith('/blog/')) {
      return { loc: path, changefreq: 'monthly', priority: 0.8, lastmod, alternateRefs };
    }
    // Blog index, FAQ, about
    if (['/blog', '/faq', '/about'].includes(path)) {
      return { loc: path, changefreq: 'weekly', priority: 0.8, lastmod, alternateRefs };
    }
    // Legal pages — low priority
    if (['/privacy', '/terms', '/pricing'].includes(path)) {
      return { loc: path, changefreq: 'monthly', priority: 0.3, lastmod, alternateRefs };
    }
    // Default
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod,
      alternateRefs,
    };
  },
};
