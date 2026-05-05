import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Script from 'next/script';
import { Plus_Jakarta_Sans, Manrope, Sarabun } from 'next/font/google';
import '../styles/globals.css';
import { getOrganizationSchema, getWebSiteSchema } from '@/components/SEOHead';
import { GA_ID, FB_PIXEL_ID, pageview, fbPageview } from '@/lib/analytics';
import { captureAttribution } from '@/lib/utm';
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
  const fbAllowed = FB_PIXEL_ID && cookieConsent === 'accepted';

  useEffect(() => {
    const saved = localStorage.getItem('th_lang') || 'en';
    setLangState(saved);
    captureAttribution();
  }, []);

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem('th_lang', l);
    document.documentElement.lang = l === 'th' ? 'th' : 'en';
  };

  // Set initial lang on html element
  useEffect(() => {
    document.documentElement.lang = lang === 'th' ? 'th' : 'en';
  }, [lang]);

  // Track page views on route change — fires both GA and Meta Pixel
  useEffect(() => {
    if (!gaAllowed && !fbAllowed) return;
    const handleRouteChange = (url) => {
      if (gaAllowed) pageview(url);
      if (fbAllowed) fbPageview();
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events, gaAllowed, fbAllowed]);

  // Register Service Worker — production only, required for PWA installability + TWA
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

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

      {/* Meta Pixel — only loads after cookie consent. Fires PageView on
          load; subsequent route changes fire via fbPageview() in the effect
          above. Standard events (CompleteRegistration, Lead) are fired from
          the relevant pages via fbTrack(). */}
      {fbAllowed && (
        <Script
          id="fb-pixel-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${FB_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}
      <Head>
        {/* Viewport — critical for mobile rendering */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* PWA — installable + Android TWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#006a62" />
        <meta name="application-name" content="ThaiHelper" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ThaiHelper" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
