import Link from 'next/link';
import Head from 'next/head';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found – ThaiHelper</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', 'Manrope', sans-serif",
        padding: '2rem',
        textAlign: 'center',
        background: '#f8faf9',
      }}>
        <h1 style={{ fontSize: '5rem', marginBottom: '0.5rem', color: '#006a62' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#001b3d' }}>Page not found</h2>
        <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '400px' }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/" style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.75rem',
            background: '#006a62',
            color: '#fff',
            fontWeight: 'bold',
            textDecoration: 'none',
          }}>
            For Helpers
          </Link>
          <Link href="/employers" style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.75rem',
            background: '#001b3d',
            color: '#fff',
            fontWeight: 'bold',
            textDecoration: 'none',
          }}>
            For Employers
          </Link>
        </div>
      </div>
    </>
  );
}
