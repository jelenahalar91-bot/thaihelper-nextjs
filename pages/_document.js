import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Preconnect for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Open Graph defaults */}
        <meta property="og:site_name" content="ThaiHelper" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://thaihelper.app/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://thaihelper.app/og-image.jpg" />

        {/* Theme color */}
        <meta name="theme-color" content="#006a62" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
