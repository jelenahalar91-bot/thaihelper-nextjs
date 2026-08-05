/**
 * /app — Short redirect target used in LINE/email invites for the
 * closed-test Android app. Routes each visitor to the right destination:
 *
 *   Android → Play Store closed-test opt-in (installs the app)
 *   iOS     → placeholder page saying "coming soon"
 *   Desktop → the homepage
 *
 * Why a redirect page instead of pasting the Play Store URL directly
 * into invites: gives us a stable short link we control. If Google
 * changes the opt-in URL, or we roll out an iOS build, we swap it here
 * once — no need to re-blast every LINE/email link.
 */

const PLAY_STORE_TEST_URL =
  'https://play.google.com/apps/testing/app.thaihelper.mobile';

export async function getServerSideProps({ req, res }) {
  const ua = req.headers['user-agent'] || '';
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);

  // Preserve inbound tracking params so campaign attribution survives
  // the hop into Play Store (Google Play propagates ?utm_source etc.
  // through the install referrer for GA/FB analytics).
  const url = req.url || '/app';
  const qs = url.includes('?') ? url.slice(url.indexOf('?')) : '';

  if (isAndroid) {
    return {
      redirect: {
        destination: `${PLAY_STORE_TEST_URL}${qs}`,
        permanent: false,
      },
    };
  }

  if (isIOS) {
    // iOS visitor — show the "coming soon" fallback page below.
    return { props: { platform: 'ios' } };
  }

  // Desktop / unknown — bounce to homepage so the link isn't a dead-end.
  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };
}

export default function AppRedirect({ platform }) {
  const isThai = typeof window !== 'undefined'
    && window.location.pathname.startsWith('/th/');

  const T = isThai ? {
    title: 'แอป iOS กำลังจะมา',
    body: 'ตอนนี้แอปมีเฉพาะ Android เท่านั้น เวอร์ชัน iPhone กำลังจะเปิดตัวเร็วๆ นี้',
    body2: 'ในระหว่างนี้ คุณสามารถใช้ ThaiHelper ผ่านเว็บไซต์ได้ตามปกติ',
    cta: 'กลับสู่ ThaiHelper',
  } : {
    title: 'iOS app coming soon',
    body: 'The ThaiHelper app is currently Android-only. The iPhone version is on the way.',
    body2: 'In the meantime, you can keep using ThaiHelper right in your browser.',
    cta: 'Back to ThaiHelper',
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      background: 'linear-gradient(135deg, #006a62 0%, #00897a 100%)',
      color: 'white',
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>📱</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 16px' }}>
          {T.title}
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.5, margin: '0 0 12px', opacity: 0.95 }}>
          {T.body}
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: '0 0 24px', opacity: 0.85 }}>
          {T.body2}
        </p>
        <a href="/" style={{
          display: 'inline-block',
          padding: '12px 24px',
          borderRadius: 10,
          background: 'white',
          color: '#006a62',
          fontSize: 15,
          fontWeight: 700,
          textDecoration: 'none',
        }}>
          {T.cta}
        </a>
      </div>
    </main>
  );
}
