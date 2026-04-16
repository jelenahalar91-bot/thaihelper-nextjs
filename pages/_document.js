import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Fonts loaded via next/font in _app.js — self-hosted, no external requests */}

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />

        {/* Theme color */}
        <meta name="theme-color" content="#006a62" />

        {/* Bing Webmaster Tools verification */}
        <meta name="msvalidate.01" content="F12409946E0AC671E03AAAD5C5CA679C" />

        {/* Google Search Console verified via HTML file (public/google*.html) */}

        {/* Geo meta tags for local SEO */}
        <meta name="geo.region" content="TH" />
        <meta name="geo.placename" content="Thailand" />

        {/* App identification */}
        <meta name="application-name" content="ThaiHelper" />
        <meta name="apple-mobile-web-app-title" content="ThaiHelper" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
