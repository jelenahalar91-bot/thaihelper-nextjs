/**
 * AndroidAppBanner — CTA on the helper dashboard inviting Android users to
 * install the app from the Play Store. Visible when ALL of these are true:
 *   - Device is Android (user agent check)
 *   - Not already inside the native app (Capacitor bridge / TWA referrer)
 *   - User hasn't dismissed the banner in the last 7 days
 *
 * The app left closed testing and is publicly listed (verified 2026-09-01),
 * so the former beta-tester whitelist gate is gone — every Android visitor
 * can install. iPhone visitors get Apple's native Smart App Banner instead
 * (see the apple-itunes-app meta tag in SEOHead).
 */

import { useEffect, useState } from 'react';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.thaihelper.mobile';

const COPY = {
  en: {
    title: 'The ThaiHelper app is here',
    body: 'Get an instant notification the moment a family messages you. Free, and it installs in seconds.',
    cta: 'Install now',
    later: 'Later',
    steps: 'Tap install → Play Store opens → Install',
  },
  th: {
    title: 'แอป ThaiHelper มาแล้ว',
    body: 'รับการแจ้งเตือนทันทีเมื่อมีครอบครัวส่งข้อความถึงคุณ ใช้งานฟรี ติดตั้งได้ในไม่กี่วินาที',
    cta: 'ติดตั้งเลย',
    later: 'ภายหลัง',
    steps: 'กดติดตั้ง → เปิด Play Store → ติดตั้ง',
  },
};

const DISMISS_KEY = 'th_android_app_banner_dismissed_at';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export default function AndroidAppBanner({ lang = 'en' }) {
  const t = COPY[lang] || COPY.en;
  const [state, setState] = useState('checking');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    if (!/android/i.test(ua)) { setState('hidden'); return; }

    // Already in the native app? Hide.
    if (window.Capacitor?.isNativePlatform?.() === true) { setState('hidden'); return; }
    if ((document.referrer || '').startsWith('android-app://')) { setState('hidden'); return; }

    // Recently dismissed?
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const ts = parseInt(raw, 10);
        if (!Number.isNaN(ts) && Date.now() - ts < DISMISS_TTL_MS) {
          setState('hidden');
          return;
        }
      }
    } catch {}

    setState('shown');
  }, []);

  function handleInstall() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
  }

  function handleLater() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setState('hidden');
  }

  if (state !== 'shown') return null;

  const wrapper = {
    background: 'linear-gradient(135deg, #006a62 0%, #00897a 100%)',
    borderRadius: '16px',
    padding: '18px 20px',
    marginBottom: '16px',
    boxShadow: '0 4px 16px rgba(0,106,98,0.25)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };
  const row = { display: 'flex', alignItems: 'flex-start', gap: '12px' };
  const iconWrap = {
    flexShrink: 0,
    width: '40px', height: '40px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px',
  };
  const title = { fontSize: '16px', fontWeight: 700, margin: 0, lineHeight: 1.3 };
  const body = { fontSize: '13px', margin: '4px 0 6px', opacity: 0.95, lineHeight: 1.45 };
  const steps = { fontSize: '12px', margin: 0, opacity: 0.85, lineHeight: 1.4 };
  const actions = { display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '2px' };
  const ctaBtn = {
    padding: '10px 18px', borderRadius: '10px', border: 'none',
    background: 'white', color: '#006a62',
    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
  };
  const laterBtn = {
    padding: '10px 14px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.4)',
    background: 'transparent', color: 'white',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  };

  return (
    <div style={wrapper} role="region" aria-label="Android app install prompt">
      <div style={row}>
        <div style={iconWrap} aria-hidden="true">📱</div>
        <div style={{ flex: 1 }}>
          <h3 style={title}>{t.title}</h3>
          <p style={body}>{t.body}</p>
          <p style={steps}>{t.steps}</p>
        </div>
      </div>
      <div style={actions}>
        <button type="button" onClick={handleInstall} style={ctaBtn}>{t.cta}</button>
        <button type="button" onClick={handleLater} style={laterBtn}>{t.later}</button>
      </div>
    </div>
  );
}
