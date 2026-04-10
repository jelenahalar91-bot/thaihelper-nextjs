import { useState, useEffect } from 'react';
import Link from 'next/link';

const T = {
  en: {
    text: 'We use cookies to analyze site traffic and improve your experience.',
    privacy: 'Privacy Policy',
    accept: 'Accept',
    decline: 'Decline',
  },
  th: {
    text: 'เราใช้คุกกี้เพื่อวิเคราะห์การเข้าชมเว็บไซต์และปรับปรุงประสบการณ์ของคุณ',
    privacy: 'นโยบายความเป็นส่วนตัว',
    accept: 'ยอมรับ',
    decline: 'ปฏิเสธ',
  },
};

const STORAGE_KEY = 'th_cookie_consent'; // 'accepted' | 'declined'

export function useCookieConsent() {
  const [consent, setConsent] = useState(null); // null = not yet decided
  useEffect(() => {
    setConsent(localStorage.getItem(STORAGE_KEY));
  }, []);
  return consent;
}

export default function CookieConsent({ lang = 'en' }) {
  const [visible, setVisible] = useState(false);
  const t = T[lang] || T.en;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const respond = (value) => {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
    if (value === 'declined') {
      // Remove GA cookies if user declines
      document.cookie = '_ga=; Max-Age=0; path=/; domain=.' + window.location.hostname;
      document.cookie = '_ga_437WQMTX2X=; Max-Age=0; path=/; domain=.' + window.location.hostname;
    } else {
      // Reload to activate GA scripts
      window.location.reload();
    }
  };

  if (!visible) return null;

  return (
    <div role="region" aria-label="Cookie consent" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'white', borderTop: '1px solid #e5e7eb',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
      padding: '16px 20px',
      animation: 'cookieSlideUp 0.3s ease-out',
    }}>
      <div style={{
        maxWidth: '900px', margin: '0 auto',
        display: 'flex', alignItems: 'center', gap: '16px',
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        <p style={{ fontSize: '14px', color: '#444', margin: 0, flex: '1 1 300px', lineHeight: 1.5 }}>
          <span aria-hidden="true">🍪</span> {t.text}{' '}
          <Link href="/privacy" style={{ color: '#006a62', textDecoration: 'underline' }}>
            {t.privacy}
          </Link>
        </p>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={() => respond('declined')}
            style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              border: '1px solid #d1d5db', background: 'white', color: '#666',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.target.style.background = '#f9fafb'}
            onMouseLeave={e => e.target.style.background = 'white'}
          >
            {t.decline}
          </button>
          <button
            onClick={() => respond('accepted')}
            style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              border: 'none', background: '#006a62', color: 'white',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.target.style.background = '#004d47'}
            onMouseLeave={e => e.target.style.background = '#006a62'}
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
