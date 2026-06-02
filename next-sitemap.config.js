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
  //
  // CRITICAL: next-sitemap auto-discovers BOTH /foo and /th/foo from the
  // Next.js i18n build output and emits each as a <loc>. Combined with
  // these alternateRefs that prepend `/th` to every path, the /th/foo
  // entries get hreflang alternates pointing at /th/th/foo — a duplicate
  // URL that Google indexed and ranked (GSC showed /th/th/hire/X with
  // real clicks on 2026-06-02). Fix: emit only EN paths as <loc>, with
  // hreflang alternates linking each to its /th/ pendant. Done by
  // excluding /th/* paths below and returning null for them in transform.
  alternateRefs: [
    { href: 'https://thaihelper.app',       hreflang: 'en' },
    { href: 'https://thaihelper.app/th',    hreflang: 'th' },
    { href: 'https://thaihelper.app',       hreflang: 'x-default' },
  ],

  // Do NOT index auth, dashboard, or user-specific pages.
  // /th and /th/* are excluded too — they're referenced as hreflang
  // alternates on the EN <loc> entries instead (see alternateRefs).
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
    '/th',
    '/th/*',
  ],

  // Custom priority per page — tells Google what matters most.
  // alternateRefs must be passed through manually: next-sitemap drops
  // the top-level alternateRefs when a custom transform is provided.
  transform: async (config, path) => {
    // Belt-and-suspenders: even with /th/* in exclude, return null here
    // for any /th-prefixed path that slips through. Prevents the
    // /th/th/ alternateRef bug from ever recurring.
    if (path === '/th' || path.startsWith('/th/')) {
      return null;
    }
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
