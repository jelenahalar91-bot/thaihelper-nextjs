import Link from 'next/link';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import SEOHead, {
  getBreadcrumbSchema,
  getSpeakableSchema,
  getFAQSchema,
} from '@/components/SEOHead';
import LangSwitcher from '@/components/LangSwitcher';
import { MobileMenu, ResourcesDropdown } from '@/components/MobileMenu';
import { useLang } from '@/pages/_app';
import { guides, getGuideBySlug, getAllGuideSlugs } from '@/content/guide/guides';

const SITE_URL = 'https://thaihelper.app';

export async function getStaticPaths() {
  return {
    paths: getAllGuideSlugs().map((slug) => ({ params: { slug } })),
    // 'blocking' lets us add new guides to content/guide/guides.js without
    // a new deploy, and redirects unknown slugs to /blog gracefully.
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const guide = getGuideBySlug(params.slug);
  if (!guide) {
    return { redirect: { destination: '/blog', permanent: false } };
  }
  return { props: { guide } };
}

/**
 * Article + HowTo-ish JSON-LD for definitive guides. Article gives us
 * the authoritative content-piece signal that AI engines weight more
 * heavily than BlogPosting; the dateModified is set so re-edits ping
 * the freshness signal.
 */
function getGuideArticleSchema(guide) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    url: `${SITE_URL}/guide/${guide.slug}`,
    datePublished: guide.date,
    dateModified: guide.updated || guide.date,
    author: {
      '@type': 'Organization',
      name: guide.author || 'ThaiHelper Team',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ThaiHelper',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/guide/${guide.slug}` },
    image: guide.image,
    wordCount: guide.readTime * 200,
    timeRequired: `PT${guide.readTime}M`,
    keywords: guide.keywords,
    inLanguage: 'en',
  };
}

export default function GuidePage({ guide }) {
  const { lang } = useLang();

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Guides', path: '/blog' },
    { name: guide.title, path: `/guide/${guide.slug}` },
  ];

  // Related guides (other entries) + selected blog posts can be added later
  const related = guides.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <>
      <SEOHead
        title={guide.title}
        description={guide.description}
        path={`/guide/${guide.slug}`}
        lang={lang}
        jsonLd={[
          getGuideArticleSchema(guide),
          getFAQSchema(guide.faqs || []),
          getBreadcrumbSchema(breadcrumbs),
          // Speakable: introduction paragraph + h2 headings. Reads
          // well in voice assistants and signals AI engines which
          // chunks are the most quotable.
          getSpeakableSchema(`/guide/${guide.slug}`, [
            'h1',
            '.guide-intro p:first-of-type',
            '.guide-section h2',
          ]),
        ]}
      />

      <div className="min-h-screen bg-white font-body">
        {/* NAV */}
        <nav className="fixed top-0 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-white/90 backdrop-blur-md z-50 shadow-sm">
          <Link href="/" className="text-xl md:text-2xl font-bold font-headline">
            <span>Thai</span>
            <span style={{ color: '#006a62' }}>Helper</span>
          </Link>
          {(() => {
            const navItems = [
              { href: '/blog',                label: 'All Articles' },
              { href: '/employers',           label: 'For Families' },
              { href: '/helpers',             label: 'Browse Helpers' },
              { href: '/work-permit-wizard',  label: 'Work Permit Wizard' },
              { href: '/directory',           label: 'Expert Directory' },
              { href: '/about',               label: 'About' },
              { href: '/faq',                 label: 'FAQ' },
            ];
            return (
              <>
                <div className="hidden lg:flex items-center gap-4">
                  <ResourcesDropdown label="Resources" items={navItems} />
                  <Link href="/signup" className="text-sm font-bold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 transition-colors whitespace-nowrap">
                    Register Free
                  </Link>
                  <LangSwitcher />
                </div>
                <div className="lg:hidden">
                  <MobileMenu
                    items={navItems}
                    secondaryCta={{ href: '/login', label: 'Login' }}
                    primaryCta={{ href: '/signup', label: 'Register Free' }}
                  />
                </div>
              </>
            );
          })()}
        </nav>

        <article className="max-w-3xl mx-auto px-4 md:px-6 pt-24 pb-16">
          {/* Breadcrumbs */}
          <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/blog" className="hover:text-primary">Guides</Link>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <span className="inline-block text-xs font-bold tracking-wide uppercase text-primary mb-3">
              Definitive Guide
            </span>
            <h1 className="text-3xl md:text-5xl font-bold font-headline leading-tight text-[#001b3d] mb-6">
              {guide.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                Published {new Date(guide.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {guide.updated && guide.updated !== guide.date && (
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={14} />
                  Updated {new Date(guide.updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {guide.readTime} min read
              </span>
              <span>By {guide.author}</span>
            </div>
          </header>

          {/* Table of Contents */}
          <aside className="mb-12 p-6 rounded-2xl bg-[#f4f9f8] border border-[#e0eeeb]">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#006a62] mb-4">
              Table of Contents
            </h2>
            <ol className="space-y-2 text-[15px]">
              {guide.sections.map((s, i) => (
                <li key={s.id} className="flex gap-3">
                  <span className="text-gray-400 font-mono text-sm flex-none w-6">{String(i + 1).padStart(2, '0')}</span>
                  <a href={`#${s.id}`} className="text-[#001b3d] hover:text-primary hover:underline">
                    {s.h2}
                  </a>
                </li>
              ))}
              <li className="flex gap-3">
                <span className="text-gray-400 font-mono text-sm flex-none w-6">{String(guide.sections.length + 1).padStart(2, '0')}</span>
                <a href="#faq" className="text-[#001b3d] hover:text-primary hover:underline">
                  Frequently asked questions
                </a>
              </li>
            </ol>
          </aside>

          {/* Intro/first section gets a class so Speakable JSON-LD can target it */}
          <div className="guide-intro">
            {guide.sections.length > 0 && (
              <section id={guide.sections[0].id} className="guide-section prose-guide mb-12">
                <h2 className="text-2xl md:text-3xl font-bold font-headline text-[#001b3d] mb-4 scroll-mt-24">
                  {guide.sections[0].h2}
                </h2>
                <div
                  className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: guide.sections[0].html }}
                />
              </section>
            )}
          </div>

          {/* Remaining sections */}
          {guide.sections.slice(1).map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="guide-section prose-guide mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold font-headline text-[#001b3d] mb-4 scroll-mt-24">
                {s.h2}
              </h2>
              <div
                className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
            </section>
          ))}

          {/* FAQ section */}
          {guide.faqs && guide.faqs.length > 0 && (
            <section id="faq" className="mt-16 mb-12">
              <h2 className="text-2xl md:text-3xl font-bold font-headline text-[#001b3d] mb-6 scroll-mt-24">
                Frequently asked questions
              </h2>
              <div className="space-y-6">
                {guide.faqs.map((f, i) => (
                  <div key={i} className="border-l-4 border-[#006a62] pl-5">
                    <h3 className="text-lg font-bold text-[#001b3d] mb-2">{f.question}</h3>
                    <p className="text-gray-800 leading-relaxed faq-answer">{f.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA strip */}
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-[#006a62] to-[#004d47] text-white text-center">
            <h2 className="text-2xl font-bold font-headline mb-3">
              Ready to start your search?
            </h2>
            <p className="text-white/90 mb-6">
              Browse verified helper profiles across Thailand. No agency, no placement fee — message directly and hire on your terms.
            </p>
            <Link
              href="/helpers"
              className="inline-block bg-white text-[#006a62] font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
            >
              Browse Helpers →
            </Link>
          </div>

          {/* Related guides */}
          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-xl font-bold font-headline text-[#001b3d] mb-6">
                Related guides
              </h2>
              <ul className="space-y-3">
                {related.map((g) => (
                  <li key={g.slug}>
                    <Link
                      href={`/guide/${g.slug}`}
                      className="text-[#006a62] font-semibold hover:underline"
                    >
                      {g.title} →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 mt-16">
          <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-500">
            <p>© {new Date(guide.date).getFullYear()} ThaiHelper · <Link href="/about" className="hover:underline">About</Link> · <Link href="/faq" className="hover:underline">FAQ</Link> · <Link href="/privacy" className="hover:underline">Privacy</Link></p>
          </div>
        </footer>
      </div>

      {/* Custom prose styles for the guide content. Tailwind's prose
          plugin isn't installed in this project, so a small inline
          stylesheet handles the markdown-derived HTML. */}
      <style jsx global>{`
        .prose-guide p { margin-bottom: 1.1em; line-height: 1.75; }
        .prose-guide h3 {
          font-size: 1.15rem; font-weight: 700; color: #001b3d;
          margin-top: 1.6em; margin-bottom: 0.6em;
        }
        .prose-guide ul, .prose-guide ol {
          margin-bottom: 1.1em; padding-left: 1.5em;
        }
        .prose-guide ul { list-style: disc; }
        .prose-guide ol { list-style: decimal; }
        .prose-guide li { margin-bottom: 0.4em; line-height: 1.7; }
        .prose-guide a { color: #006a62; text-decoration: underline; }
        .prose-guide a:hover { color: #004d47; }
        .prose-guide strong { font-weight: 700; color: #001b3d; }
        .prose-guide em { font-style: italic; color: #4b5563; }
        .prose-guide table {
          width: 100%; border-collapse: collapse; margin: 1.5em 0;
          font-size: 0.95rem;
        }
        .prose-guide th, .prose-guide td {
          border: 1px solid #e5e7eb; padding: 0.6em 0.8em; text-align: left;
        }
        .prose-guide th { background: #f4f9f8; font-weight: 700; color: #001b3d; }
      `}</style>
    </>
  );
}
