const SITE_URL = 'https://thaihelper.app';

const PAGES = [
  { path: '/',          changefreq: 'weekly',  priority: '1.0' },
  { path: '/employers', changefreq: 'weekly',  priority: '0.9' },
  { path: '/register',  changefreq: 'monthly', priority: '0.8' },
  { path: '/helpers',   changefreq: 'weekly',  priority: '0.7' },
  { path: '/privacy',   changefreq: 'yearly',  priority: '0.3' },
  { path: '/terms',     changefreq: 'yearly',  priority: '0.3' },
];

export default function handler(req, res) {
  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${PAGES.map(
  ({ path, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}${path}" />
    <xhtml:link rel="alternate" hreflang="th" href="${SITE_URL}${path}" />
    <xhtml:link rel="alternate" hreflang="ru" href="${SITE_URL}${path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${path}" />
  </url>`
).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200');
  res.status(200).send(xml);
}
