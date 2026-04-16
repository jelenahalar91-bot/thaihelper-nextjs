import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Script from 'next/script';
import { Plus_Jakarta_Sans, Manrope, Sarabun } from 'next/font/google';
import '../styles/globals.css';
import { getOrganizationSchema, getWebSiteSchema } from '@/components/SEOHead';
import { GA_ID, pageview } from '@/lib/analytics';
import CookieConsent, { useCookieConsent } from '@/components/CookieConsent';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-headline',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-body',
});

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-thai',
});

// Language context so all pages share the same lang state
const LangContext = createContext({ lang: 'en', setLang: () => {} });

export function useLang() {
  return useContext(LangContext);
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [lang, setLangState] = useState('en');
  const cookieConsent = useCookieConsent();
  const gaAllowed = GA_ID && cookieConsent === 'accepted';

  useEffect(() => {
    const saved = localStorage.getItem('th_lang') || 'en';
    setLangState(saved);
  }, []);

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem('th_lang', l);
    document.documentElement.lang = l === 'th' ? 'th' : l === 'ru' ? 'ru' : 'en';
  };

  // Set initial lang on html element
  useEffect(() => {
    document.documentElement.lang = lang === 'th' ? 'th' : lang === 'ru' ? 'ru' : 'en';
  }, [lang]);

  // Track page views on route change
  useEffect(() => {
    if (!gaAllowed) return;
    const handleRouteChange = (url) => pageview(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events, gaAllowed]);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {/* Google Analytics 4 — only loads after cookie consent */}
      {gaAllowed && (
        <>
          <Script
            strategy="lazyOnload"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script
            id="ga4-init"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                  cookie_flags: 'SameSite=None;Secure',
                });
              `,
            }}
          />
        </>
      )}
      <Head>
        {/* Viewport — critical for mobile rendering */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Global JSON-LD: Organization + WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              getOrganizationSchema(),
              getWebSiteSchema(),
            ]),
          }}
        />
      </Head>
      <div className={`${plusJakarta.variable} ${manrope.variable} ${sarabun.variable}`}>
        <Component {...pageProps} />
        {/* Cookie consent banner — shown once, remembers choice */}
        <CookieConsent lang={lang} />
      </div>
    </LangContext.Provider>
  );
}
