import Link from 'next/link';

/**
 * Site-wide SEO footer with internal links to top /hire/ city + category pages.
 *
 * Why this exists:
 * - GSC shows 105/158 pages "Discovered – currently not indexed" — Google
 *   considers many /hire/* pages low-value because they're poorly cross-linked.
 * - Putting the top 10 cities + 7 categories in the footer means *every* page
 *   sitewide passes link juice to them, which signals importance to Google
 *   and helps the long-tail combo pages get indexed too.
 *
 * Lists are intentionally curated (not all 30 cities) — Google penalises
 * footer link spam. Top-10-by-demand keeps it natural.
 */

const TOP_CITIES = [
  { slug: 'bangkok',     en: 'Bangkok',     th: 'กรุงเทพฯ' },
  { slug: 'phuket',      en: 'Phuket',      th: 'ภูเก็ต' },
  { slug: 'chiang-mai',  en: 'Chiang Mai',  th: 'เชียงใหม่' },
  { slug: 'pattaya',     en: 'Pattaya',     th: 'พัทยา' },
  { slug: 'koh-samui',   en: 'Koh Samui',   th: 'เกาะสมุย' },
  { slug: 'hua-hin',     en: 'Hua Hin',     th: 'หัวหิน' },
  { slug: 'krabi',       en: 'Krabi',       th: 'กระบี่' },
  { slug: 'koh-phangan', en: 'Koh Phangan', th: 'เกาะพะงัน' },
  { slug: 'chonburi',    en: 'Chonburi',    th: 'ชลบุรี' },
  { slug: 'ao-nang',     en: 'Ao Nang',     th: 'อ่าวนาง' },
];

const CATEGORIES = [
  { slug: 'nanny',       en: 'Nannies',       th: 'พี่เลี้ยงเด็ก' },
  { slug: 'housekeeper', en: 'Housekeepers',  th: 'แม่บ้าน' },
  { slug: 'chef',        en: 'Private Chefs', th: 'พ่อครัวส่วนตัว' },
  { slug: 'driver',      en: 'Drivers',       th: 'คนขับรถ' },
  { slug: 'caregiver',   en: 'Elder Care',    th: 'ผู้ดูแลผู้สูงอายุ' },
  { slug: 'gardener',    en: 'Gardeners',     th: 'คนสวน' },
  { slug: 'tutor',       en: 'Tutors',        th: 'ติวเตอร์' },
  { slug: 'petsitter',   en: 'Pet Sitters',   th: 'ผู้ดูแลสัตว์เลี้ยง' },
];

export default function SEOFooter({ lang = 'en' }) {
  const isEn = lang === 'en';

  return (
    <footer className="bg-[#001b3d] text-white/70 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Cities */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              {isEn ? 'Find Helpers by City' : 'หาผู้ช่วยตามเมือง'}
            </h3>
            <ul className="space-y-2 text-sm">
              {TOP_CITIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/hire/${c.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {isEn ? `Helpers in ${c.en}` : `ผู้ช่วยใน${c.th}`}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              {isEn ? 'Find by Role' : 'หาตามประเภท'}
            </h3>
            <ul className="space-y-2 text-sm">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/hire/${c.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {isEn ? `${c.en} in Thailand` : `${c.th}ในประเทศไทย`}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About / Platform */}
          <div>
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              {isEn ? 'ThaiHelper' : 'ไทยเฮลเปอร์'}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  {isEn ? 'About Us' : 'เกี่ยวกับเรา'}
                </Link>
              </li>
              <li>
                <Link href="/employers" className="hover:text-white transition-colors">
                  {isEn ? 'For Families' : 'สำหรับครอบครัว'}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  {isEn ? 'Register as Helper (Free)' : 'สมัครเป็นผู้ช่วย (ฟรี)'}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  {isEn ? 'Blog & Guides' : 'บล็อกและคู่มือ'}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  {isEn ? 'FAQ' : 'คำถามที่พบบ่อย'}
                </Link>
              </li>
              <li>
                <Link href="/work-permit-wizard" className="hover:text-white transition-colors">
                  {isEn ? 'Work Permit Wizard' : 'ตัวช่วยใบอนุญาตทำงาน'}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>
            &copy; {new Date().getFullYear()} ThaiHelper.app —{' '}
            {isEn
              ? 'Direct connections between families and household helpers in Thailand. No middleman.'
              : 'เชื่อมต่อครอบครัวกับผู้ช่วยงานบ้านในประเทศไทยโดยตรง ไม่มีคนกลาง'}
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">
              {isEn ? 'Privacy' : 'ความเป็นส่วนตัว'}
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              {isEn ? 'Terms' : 'ข้อกำหนด'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
