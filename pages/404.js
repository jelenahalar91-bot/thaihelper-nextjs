import Link from 'next/link';
import Head from 'next/head';
import { useLang } from './_app';

const T = {
  en: {
    title: 'Page Not Found – ThaiHelper',
    heading: 'Page not found',
    text: 'The page you\u2019re looking for doesn\u2019t exist or has been moved.',
    cta_home: 'Back to Home',
    cta_helpers: 'Browse Helpers',
    cta_register: 'Register Free',
  },
  th: {
    title: '\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2B\u0E19\u0E49\u0E32 – ThaiHelper',
    heading: '\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23',
    text: '\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E01\u0E33\u0E25\u0E31\u0E07\u0E21\u0E2D\u0E07\u0E2B\u0E32\u0E2D\u0E32\u0E08\u0E16\u0E39\u0E01\u0E22\u0E49\u0E32\u0E22\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27',
    cta_home: '\u0E01\u0E25\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E23\u0E01',
    cta_helpers: '\u0E14\u0E39\u0E1C\u0E39\u0E49\u0E0A\u0E48\u0E27\u0E22',
    cta_register: '\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E1F\u0E23\u0E35',
  },
};

export default function Custom404() {
  const { lang } = useLang();
  const t = T[lang] || T.en;

  return (
    <>
      <Head>
        <title>{t.title}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-background text-on-background font-sans flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-8xl font-extrabold font-headline text-primary/20 mb-4">404</p>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-on-background mb-3">
            {t.heading}
          </h1>
          <p className="text-on-surface-variant mb-10">{t.text}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform text-center"
            >
              {t.cta_home}
            </Link>
            <Link
              href="/helpers"
              className="px-6 py-3 rounded-xl bg-surface-container-highest text-secondary font-bold text-sm hover:bg-surface-container-high transition-colors text-center"
            >
              {t.cta_helpers}
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl border border-primary/20 text-primary font-bold text-sm hover:bg-primary/5 transition-colors text-center"
            >
              {t.cta_register}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
