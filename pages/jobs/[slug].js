import Link from 'next/link';
import SEOHead, { getBreadcrumbSchema } from '@/components/SEOHead';
import SEOFooter from '@/components/SEOFooter';
import LangSwitcher from '@/components/LangSwitcher';
import { useLang } from '@/pages/_app';
import {
  getAllJobPages,
  getJobPageBySlug,
  salaryBand,
  MIN_FAMILIES,
} from '@/lib/seo/job-pages';

// ─── Static generation ──────────────────────────────────────────────────────

// Every searching family that is publicly listable, as /api/employers
// defines both. Shared by getStaticPaths and getStaticProps so the set of
// pages we build and the set we are willing to render cannot drift apart.
async function loadSearchingFamilies(dbCity) {
  const { getServiceSupabase, selectAll } = await import('@/lib/supabase');
  const {
    isPubliclyListable,
    hiddenForMissingJobText,
    hiddenForInactivity,
  } = await import('@/lib/access');
  const supabase = getServiceSupabase();

  let { data } = await selectAll(() => {
    let q = supabase
      .from('employer_accounts')
      .select(
        'employer_ref, first_name, city, area, area_slugs, looking_for, ' +
          'job_description, job_description_en, job_details, schedule_days, ' +
          'duration, start_timing, search_status, status, created_at, ' +
          'last_login_at, phone_verified_at',
      )
      .order('created_at', { ascending: false });
    if (dbCity) q = q.eq('city', dbCity);
    return q;
  });

  return (data || []).filter(
    (row) =>
      row.search_status !== 'hidden' &&
      row.search_status !== 'paused' &&
      isPubliclyListable(row) &&
      !hiddenForMissingJobText(row) &&
      !hiddenForInactivity(row),
  );
}

function wantsCategory(row, category) {
  if (!category) return true;
  return String(row.looking_for || '')
    .split(',')
    .map((s) => s.trim())
    .includes(category);
}

export async function getStaticPaths() {
  // Only the combinations somebody is actually hiring for get built. A
  // combination with nobody behind it would be an empty page, and 56 of
  // those across seven cities is the definition of a doorway set — the one
  // thing that could cost this domain the rankings the /hire pages already
  // hold. City pages are always built; they have the whole city behind them.
  //
  // The count has to be computed here rather than in getStaticProps because
  // getStaticProps may not return a redirect for a path that was prerendered.
  let live = new Set();
  try {
    const rows = await loadSearchingFamilies(null);
    const counts = new Map();
    for (const row of rows) {
      for (const cat of String(row.looking_for || '').split(',').map((s) => s.trim())) {
        if (!cat) continue;
        const key = `${cat}-${String(row.city || '').replace(/_/g, '-')}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    for (const [key, n] of counts) if (n >= MIN_FAMILIES) live.add(key);
  } catch (err) {
    // A database that is down at build time must not take the city pages
    // with it: they need no count. The combinations come back on the next
    // revalidation, through fallback: 'blocking'.
    console.error('getStaticPaths (jobs) could not read demand:', err);
  }

  const wanted = getAllJobPages().filter((p) => p.kind === 'city' || live.has(p.slug));

  // One path per locale, explicitly: with Next i18n a path without `locale`
  // is assigned to the default locale only and /th/jobs/* would 404. Same
  // reason as pages/hire/[slug].js.
  const locales = ['en', 'th'];
  return {
    paths: wanted.flatMap((p) =>
      locales.map((locale) => ({ params: { slug: p.slug }, locale })),
    ),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const page = getJobPageBySlug(params.slug);
  if (!page) {
    return { redirect: { destination: '/register', permanent: true } };
  }

  let families = [];
  try {
    const { areaFieldsLatin } = await import('@/lib/constants/areas');
    families = (await loadSearchingFamilies(page.dbCity))
      .filter((row) => wantsCategory(row, page.category))
      .map((row) => {
        // The job text for this category when the family wrote one per job
        // (job_details), otherwise the single description. English first
        // where we have it — a Burmese or Thai reader gets the browser's
        // translation of English far more reliably than of Thai.
        let text = row.job_description_en || row.job_description || '';
        const details =
          row.job_details && typeof row.job_details === 'object' ? row.job_details : null;
        if (details && page.category && details[page.category]?.text) {
          text = details[page.category].text;
        }
        return {
          ref: row.employer_ref || null,
          firstName: row.first_name || '',
          area: areaFieldsLatin(row).areaEn || '',
          text: text ? String(text).replace(/\s+/g, ' ').slice(0, 180) : '',
        };
      });
  } catch (err) {
    console.error('Failed to load families for job page:', err);
  }

  // A combination nobody is hiring for is not a page. Send it to the city,
  // where the other roles are — rather than leaving an empty shell that
  // reads as a doorway page and gives a visitor nothing.
  // Zero, not MIN_FAMILIES: getStaticPaths built this path at two or more,
  // and a path that was prerendered may not answer with a redirect. Only a
  // slug that was never built — one Google still has from a week when the
  // demand was there — reaches this, and it belongs on the city page.
  if (page.kind === 'combo' && families.length === 0) {
    return { redirect: { destination: `/jobs/${page.city}`, permanent: false } };
  }

  const siblings = getAllJobPages()
    .filter((p) => p.kind === 'combo' && p.city === page.city && p.slug !== page.slug)
    .map((p) => ({ slug: p.slug, en: p.categoryEn, th: p.categoryTh }));

  return {
    props: {
      page,
      families: families.slice(0, 24),
      total: families.length,
      siblings,
      band: salaryBand(page),
    },
    revalidate: 3600,
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

const T = {
  en: {
    nav: 'Create free profile',
    lookingNow: 'Families looking right now',
    salary: 'Typical monthly salary',
    baht: 'THB / month',
    cta: 'Create a free profile and families looking for a helper will contact you',
    ctaBtn: 'Create free profile',
    noFee: 'No registration fee',
    otherRoles: 'Other roles in',
    allIn: 'All household jobs in',
    howTitle: 'How it works',
    how: [
      'Create a profile — about 3 minutes, free.',
      'Families searching in your city see it and message you directly.',
      'You decide which family you talk to.',
    ],
    anonNote:
      'Families are shown as they appear on the public board. You need a free profile to message them.',
    more: (n) => `and ${n} more`,
  },
  th: {
    nav: 'สร้างโปรไฟล์ฟรี',
    lookingNow: 'ครอบครัวที่กำลังมองหาตอนนี้',
    salary: 'ช่วงเงินเดือนโดยทั่วไป',
    baht: 'บาท / เดือน',
    cta: 'สร้างโปรไฟล์ฟรี แล้วครอบครัวที่กำลังหาผู้ช่วยจะติดต่อคุณ',
    ctaBtn: 'สร้างโปรไฟล์ฟรี',
    noFee: 'ไม่มีค่าสมัคร',
    otherRoles: 'งานอื่นใน',
    allIn: 'งานผู้ช่วยในบ้านทั้งหมดใน',
    howTitle: 'ขั้นตอน',
    how: [
      'สร้างโปรไฟล์ฟรี ใช้เวลาประมาณ 3 นาที',
      'ครอบครัวที่กำลังหาผู้ช่วยในเมืองของคุณจะเห็นโปรไฟล์ และทักหาคุณโดยตรง',
      'คุณเลือกเองว่าจะคุยกับครอบครัวไหน',
    ],
    anonNote: 'ข้อมูลครอบครัวแสดงเหมือนในหน้ารวมประกาศ ต้องมีโปรไฟล์ฟรีจึงจะส่งข้อความได้',
    more: (n) => `และอีก ${n} ครอบครัว`,
  },
};

export default function JobsPage({ page, families = [], total = 0, siblings = [], band }) {
  const { lang } = useLang();
  const isTh = lang === 'th';
  const t = T[isTh ? 'th' : 'en'];

  const title = isTh ? page.titleTh : page.titleEn;
  const cityName = isTh ? page.cityTh : page.cityEn;
  const roleName = isTh ? page.categoryTh : page.categoryEn;

  const headline = isTh
    ? `ขณะนี้มี ${total} ครอบครัวใน${page.cityTh}กำลังมองหา${roleName || 'ผู้ช่วยในบ้าน'}`
    : `${total} ${total === 1 ? 'family is' : 'families are'} looking for ${
        roleName ? `a ${roleName.toLowerCase()}` : 'household help'
      } in ${page.cityEn} right now`;

  const description = isTh
    ? `${headline} ดูรายละเอียดงานและสมัครฟรีที่ ThaiHelper ไม่มีค่าสมัคร`
    : `${headline}. See what each family is looking for and create a free ThaiHelper profile — no registration fee.`;

  return (
    <>
      <SEOHead
        title={`${title} | ThaiHelper`}
        description={description.slice(0, 300)}
        path={`/jobs/${page.slug}`}
        lang={lang}
        jsonLd={getBreadcrumbSchema([
          { name: 'ThaiHelper', path: '/' },
          { name: isTh ? 'งาน' : 'Jobs', path: `/jobs/${page.city}` },
          { name: title, path: `/jobs/${page.slug}` },
        ])}
      />

      <div className="min-h-screen bg-background">
        <header className="bg-white border-b border-black/5">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-extrabold text-navy">
              Thai<span className="text-primary">Helper</span>
            </Link>
            <div className="flex items-center gap-3">
              <LangSwitcher />
              <Link
                href="/register"
                className="hidden sm:inline-block px-4 py-2 rounded-full bg-primary text-white text-sm font-bold"
              >
                {t.nav}
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy leading-tight">{title}</h1>
          <p className="mt-3 text-lg text-on-background/75">{headline}</p>

          {band && (
            <div className="mt-6 inline-flex items-baseline gap-2 rounded-xl bg-gold/15 px-4 py-3">
              <span className="text-sm font-semibold text-on-background/70">{t.salary}</span>
              <span className="text-lg font-extrabold text-navy">
                {/* Explicit locale: toLocaleString() with none follows the
                    reader's browser, which prints 10.000 for a German one.
                    Thai and English both group with commas. */}
                {band.min.toLocaleString('en-US')}–{band.max.toLocaleString('en-US')}
              </span>
              <span className="text-sm text-on-background/70">{t.baht}</span>
            </div>
          )}

          <section className="mt-10">
            <h2 className="text-xl font-bold text-navy mb-1">{t.lookingNow}</h2>
            <p className="text-sm text-on-background/60 mb-4">{t.anonNote}</p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {families.map((f, i) => (
                <li key={f.ref || i} className="rounded-xl border border-black/10 bg-white p-4">
                  <div className="font-bold text-navy">
                    {f.firstName || (isTh ? 'ครอบครัว' : 'A family')}
                    {f.area ? <span className="font-normal text-on-background/60"> · {f.area}</span> : null}
                  </div>
                  {f.text && (
                    <p className="mt-2 text-sm text-on-background/75 leading-relaxed">{f.text}</p>
                  )}
                </li>
              ))}
            </ul>
            {total > families.length && (
              <p className="mt-3 text-sm text-on-background/60">{t.more(total - families.length)}</p>
            )}
          </section>

          <section className="mt-12 rounded-2xl bg-navy text-white p-8">
            <h2 className="text-xl font-bold mb-4">{t.howTitle}</h2>
            <ol className="space-y-3">
              {t.how.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-none w-7 h-7 rounded-full bg-gold text-navy font-extrabold text-sm flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-white/90">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-white/80">{t.cta}</p>
            <Link
              href="/register"
              className="mt-4 inline-block px-7 py-3 rounded-full bg-gold text-navy font-extrabold"
            >
              {t.ctaBtn}
            </Link>
            <p className="mt-2 text-sm text-white/60">{t.noFee}</p>
          </section>

          {siblings.length > 0 && (
            <section className="mt-12">
              <h2 className="text-lg font-bold text-navy mb-3">
                {t.otherRoles} {cityName}
              </h2>
              <div className="flex flex-wrap gap-2">
                {siblings.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/jobs/${s.slug}`}
                    className="px-3 py-2 rounded-full bg-white border border-black/10 text-sm font-semibold text-navy"
                  >
                    {isTh ? s.th : s.en}
                  </Link>
                ))}
                {page.kind === 'combo' && (
                  <Link
                    href={`/jobs/${page.city}`}
                    className="px-3 py-2 rounded-full bg-white border border-black/10 text-sm font-semibold text-primary"
                  >
                    {t.allIn} {cityName}
                  </Link>
                )}
              </div>
            </section>
          )}
        </main>

        <SEOFooter lang={lang} />
      </div>
    </>
  );
}
