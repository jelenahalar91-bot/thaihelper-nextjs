/**
 * PushNotificationBanner — prominent opt-in CTA shown at the top of the
 * dashboard. Visible ONLY when the browser supports push AND permission is
 * still 'default' (user hasn't decided yet) AND the user hasn't dismissed
 * the banner this session.
 *
 * Goal: make sure no helper/employer leaves the site without seeing this —
 * the feature's whole point is push-notifications-on-new-messages, so the
 * opt-in cannot be buried at the bottom of a settings page.
 *
 * Uses the same subscribe mechanics as PushNotificationToggle.
 */

import { useEffect, useState } from 'react';

const COPY = {
  en: {
    title: "Don't miss a message",
    body: "Get an instant alert on your phone or computer the moment a family writes to you.",
    cta: 'Enable notifications',
    enabling: 'Enabling…',
    later: 'Later',
    dismissed: null, // not shown when dismissed
    error: 'Something went wrong. Please try again.',
  },
  th: {
    title: 'อย่าพลาดข้อความสำคัญ',
    body: 'รับการแจ้งเตือนบนมือถือหรือคอมพิวเตอร์ทันทีเมื่อมีครอบครัวส่งข้อความถึงคุณ',
    cta: 'เปิดการแจ้งเตือน',
    enabling: 'กำลังเปิด…',
    later: 'ภายหลัง',
    dismissed: null,
    error: 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง',
  },
  ru: {
    title: 'Не пропустите сообщение',
    body: 'Получайте мгновенное уведомление на телефон или компьютер, как только семья напишет вам.',
    cta: 'Включить уведомления',
    enabling: 'Включаем…',
    later: 'Позже',
    dismissed: null,
    error: 'Что-то пошло не так. Попробуйте ещё раз.',
  },
};

const DISMISS_KEY = 'th_push_banner_dismissed_at';
// How long we hide the banner after "Later" click, in milliseconds.
// 3 days — pushy enough to re-surface, gentle enough not to annoy.
const DISMISS_TTL_MS = 3 * 24 * 60 * 60 * 1000;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export default function PushNotificationBanner({ lang = 'en' }) {
  const t = COPY[lang] || COPY.en;

  // 'checking' | 'hidden' | 'shown' | 'busy' | 'done'
  const [state, setState] = useState('checking');
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function decide() {
      if (typeof window === 'undefined') return;

      // 1. Feature detect
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        if (!cancelled) setState('hidden');
        return;
      }

      // 2. Already granted/denied → don't show banner
      if (Notification.permission !== 'default') {
        if (!cancelled) setState('hidden');
        return;
      }

      // 3. Already has an active subscription (edge case: granted somewhere
      // else without us noticing) → hide
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          if (!cancelled) setState('hidden');
          return;
        }
      } catch {
        // ignore — we'll still offer the banner
      }

      // 4. Recently dismissed? stay hidden
      try {
        const raw = localStorage.getItem(DISMISS_KEY);
        if (raw) {
          const ts = parseInt(raw, 10);
          if (!Number.isNaN(ts) && Date.now() - ts < DISMISS_TTL_MS) {
            if (!cancelled) setState('hidden');
            return;
          }
        }
      } catch {
        // localStorage disabled — still show banner
      }

      if (!cancelled) setState('shown');
    }

    decide();
    return () => { cancelled = true; };
  }, []);

  async function handleEnable() {
    setErr('');
    setState('busy');
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error('VAPID public key missing');

      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        // Denied or default (user closed the prompt) — hide banner either way;
        // they saw it, they decided.
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
        setState('hidden');
        return;
      }

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const resp = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
        credentials: 'same-origin',
      });
      if (!resp.ok) throw new Error(`subscribe API returned ${resp.status}`);

      setState('done');
      // Hide the banner after a short success moment
      setTimeout(() => setState('hidden'), 1500);
    } catch (e) {
      console.error('[push-banner] enable failed:', e);
      setErr(t.error);
      setState('shown');
    }
  }

  function handleLater() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setState('hidden');
  }

  if (state === 'checking' || state === 'hidden') return null;

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
  const body = { fontSize: '13px', margin: '4px 0 0', opacity: 0.95, lineHeight: 1.45 };
  const actions = { display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '2px' };
  const ctaBtn = {
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    background: 'white',
    color: '#006a62',
    fontSize: '14px',
    fontWeight: 700,
    cursor: state === 'busy' ? 'wait' : 'pointer',
  };
  const laterBtn = {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.4)',
    background: 'transparent',
    color: 'white',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  };
  const errStyle = { fontSize: '12px', color: '#fecaca', marginTop: '4px' };
  const done = { fontSize: '14px', fontWeight: 600, margin: 0 };

  if (state === 'done') {
    return (
      <div style={wrapper}>
        <div style={row}>
          <div style={iconWrap}>✓</div>
          <p style={done}>All set — you'll now get notifications for new messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapper} role="region" aria-label="Push notifications opt-in">
      <div style={row}>
        <div style={iconWrap} aria-hidden="true">🔔</div>
        <div style={{ flex: 1 }}>
          <h3 style={title}>{t.title}</h3>
          <p style={body}>{t.body}</p>
        </div>
      </div>
      <div style={actions}>
        <button type="button" onClick={handleEnable} disabled={state === 'busy'} style={ctaBtn}>
          {state === 'busy' ? t.enabling : t.cta}
        </button>
        <button type="button" onClick={handleLater} disabled={state === 'busy'} style={laterBtn}>
          {t.later}
        </button>
      </div>
      {err && <div style={errStyle}>{err}</div>}
    </div>
  );
}
