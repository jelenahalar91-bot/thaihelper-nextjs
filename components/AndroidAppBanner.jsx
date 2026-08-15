/**
 * AndroidAppBanner — CTA on the helper dashboard inviting Android users to
 * install the closed-test app from the Play Store. Visible only when ALL
 * of these are true:
 *   - Device is Android (user agent check)
 *   - Not already inside the native app (Capacitor bridge / TWA referrer)
 *   - Helper's email is on the Play Store closed-test whitelist
 *     (non-whitelisted helpers would hit 'not eligible' — bad UX)
 *   - User hasn't dismissed the banner in the last 7 days
 *
 * Goal: drive test-installs from active helpers so we clear Google's
 * 12+ active-tester threshold and unlock production access.
 */

import { useEffect, useState } from 'react';
import { isBetaTester } from '@/lib/beta-tester-emails';

const PLAY_STORE_TEST_URL = 'https://play.google.com/apps/testing/app.thaihelper.mobile';

const COPY = {
  en: {
    title: 'New: ThaiHelper Android App',
    body: 'Get instant push notifications for new messages. Help us test — takes 2 minutes to install.',
    cta: 'Install now',
    later: 'Later',
    steps: 'Tap the link → Play Store opens → Join test → Install',
  },
  th: {
    title: 'ใหม่: แอป ThaiHelper สำหรับ Android',
    body: 'รับการแจ้งเตือนทันทีเมื่อมีข้อความใหม่ ช่วยเราทดสอบ — ใช้เวลาแค่ 2 นาที',
    cta: 'ติดตั้งเลย',
    later: 'ภายหลัง',
    steps: 'กดลิงก์ → เปิด Play Store → เข้าร่วมทดสอบ → ติดตั้ง',
  },
};

const DISMISS_KEY = 'th_android_app_banner_dismissed_at';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export default function AndroidAppBanner({ lang = 'en', email }) {
  const t = COPY[lang] || COPY.en;
  const [state, setState] = useState('checking');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Whitelist gate — if we don't know the email or it's not on the
    // closed-test list, silently hide. No point advertising an install
    // the user would be blocked from completing.
    if (!isBetaTester(email)) {
      setState('hidden');
      return;
    }

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
  }, [email]);

  function handleInstall() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    window.open(PLAY_STORE_TEST_URL, '_blank', 'noopener,noreferrer');
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
