/**
 * IndexNow — pings Bing, Yandex, and other search engines after each deploy.
 * Run: node scripts/indexnow.mjs
 *
 * This tells search engines (including ChatGPT via Bing) about new/updated pages
 * within minutes instead of waiting days for a crawl.
 */

const KEY = '92d33bbcb88db1827197d1245bc3a2ba';
const HOST = 'https://thaihelper.app';

const URLS = [
  '/',
  '/helpers',
  '/blog',
  '/faq',
  '/about',
  '/employers',
  '/pricing',
  '/register',
  '/hire/bangkok',
  '/hire/chiang-mai',
  '/hire/phuket',
  '/hire/pattaya',
  '/hire/koh-samui',
  '/hire/hua-hin',
  '/hire/nanny',
  '/hire/housekeeper',
  '/hire/chef',
  '/hire/driver',
  '/hire/gardener',
  '/hire/caregiver',
  '/hire/tutor',
  '/hire/nanny-bangkok',
  '/hire/nanny-chiang-mai',
  '/hire/nanny-phuket',
  '/hire/housekeeper-bangkok',
  '/hire/housekeeper-phuket',
  '/hire/chef-bangkok',
  '/hire/chef-phuket',
  '/hire/driver-bangkok',
  '/hire/caregiver-pattaya',
  '/blog/how-to-hire-a-maid-in-thailand',
  '/blog/nanny-costs-thailand',
  '/blog/hiring-helper-without-agency-thailand',
  '/blog/expat-guide-domestic-help-bangkok',
  '/blog/helper-rights-thailand-what-you-need-to-know',
  '/blog/thailand-helper-salary-calculator',
  '/blog/work-permits-foreign-helpers-thailand',
  '/blog/employment-contract-template-thailand',
  '/blog/best-ways-to-find-household-help-thailand-compared',
  '/blog/how-to-create-helper-profile-that-gets-hired',
  '/blog/how-to-negotiate-salary-as-helper-thailand',
  '/blog/build-your-reputation-as-helper-thailand',
  '/blog/nanny-skills-that-families-look-for',
  '/blog/questions-to-ask-when-hiring-helper-thailand',
];

async function ping() {
  const fullUrls = URLS.map((u) => `${HOST}${u}`);

  const body = JSON.stringify({
    host: 'thaihelper.app',
    key: KEY,
    keyLocation: `${HOST}/${KEY}.txt`,
    urlList: fullUrls,
  });

  // Ping Bing (primary — powers ChatGPT)
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body,
    });
    console.log(`IndexNow (Bing): ${res.status} ${res.statusText}`);
  } catch (e) {
    console.error('IndexNow (Bing) failed:', e.message);
  }

  // Ping Yandex
  try {
    const res = await fetch('https://yandex.com/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body,
    });
    console.log(`IndexNow (Yandex): ${res.status} ${res.statusText}`);
  } catch (e) {
    console.error('IndexNow (Yandex) failed:', e.message);
  }

  console.log(`\nSubmitted ${fullUrls.length} URLs to IndexNow.`);
}

ping();
