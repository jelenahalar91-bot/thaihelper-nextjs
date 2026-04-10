/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://thaihelper.app',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/profile/'],
      },
    ],
  },
  exclude: ['/api/*', '/profile/*'],
};
