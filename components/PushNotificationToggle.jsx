/**
 * PushNotificationToggle — lets helpers & employers opt in to browser push
 * notifications for new messages.
 *
 * Flow:
 *   1. Feature-detect PushManager + Notification
 *   2. Check Notification.permission ('default' / 'granted' / 'denied')
 *   3. On "Enable": request permission → subscribe via Service Worker →
 *      POST subscription JSON to /api/push/subscribe
 *   4. On "Disable": unsubscribe locally + DELETE from /api/push/subscribe
 *
 * Shown in both pages/profile.js (helpers) and pages/employer-profile.js.
 * The server-side of this lives in lib/web-push.js + pages/api/push/subscribe.js.
 */

import { useEffect, useState } from 'react';

const COPY = {
  en: {
    title: 'Push notifications',
    label: 'Get an instant alert on your phone when you receive a new message',
    hint: 'Works best on Android (Chrome). On iPhone, first add ThaiHelper to your home screen via "Add to Home Screen".',
    unsupported: 'Your browser does not support push notifications. Try Chrome or Firefox.',
    blocked: 'Notifications are blocked. Open your browser settings for this site and set Notifications to "Allow".',
    enable: 'Enable push notifications',
    enabling: 'Enabling…',
    enabled: '✓ Enabled on this device',
    disable: 'Disable on this device',
    disabling: 'Disabling…',
    error: 'Something went wrong. Please try again.',
  },
  th: {
    title: 'การแจ้งเตือนแบบ Push',
    label: 'รับการแจ้งเตือนบนมือถือทันทีเมื่อได้รับข้อความใหม่',
    hint: 'ใช้งานได้ดีที่สุดบน Android (Chrome) สำหรับ iPhone ให้เพิ่ม ThaiHelper ไปที่หน้าจอหลักก่อน',
    unsupported: 'เบราว์เซอร์ของคุณไม่รองรับการแจ้งเตือนแบบ Push ลองใช้ Chrome หรือ Firefox',
    blocked: 'การแจ้งเตือนถูกบล็อก เปิดตั้งค่าเบราว์เซอร์สำหรับเว็บไซต์นี้และตั้งค่าการแจ้งเตือนเป็น "อนุญาต"',
    enable: 'เปิดการแจ้งเตือน Push',
    enabling: 'กำลังเปิด…',
    enabled: '✓ เปิดใช้งานบนอุปกรณ์นี้แล้ว',
    disable: 'ปิดบนอุปกรณ์นี้',
    disabling: 'กำลังปิด…',
    error: 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง',
  },
};

// Convert base64url VAPID public key to Uint8Array (what PushManager expects).
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export default function PushNotificationToggle({ lang = 'en' }) {
  const t = COPY[lang] || COPY.en;

  // 'unsupported' | 'blocked' | 'default' | 'granted' | 'checking'
  const [state, setState] = useState('checking');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Feature-detect + check current permission + existing subscription
  useEffect(() => {
    let cancelled = false;

    async function detect() {
      if (typeof window === 'undefined') return;
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        if (!cancelled) setState('unsupported');
        return;
      }

      const perm = Notification.permission;
      if (perm === 'denied') {
        if (!cancelled) setState('blocked');
        return;
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        setHasSubscription(!!sub);
        setState(perm);
      } catch (e) {
        if (!cancelled) {
          setState(perm);
          setHasSubscription(false);
        }
      }
    }

    detect();
    return () => { cancelled = true; };
  }, []);

  async function handleEnable() {
    setErr('');
    setBusy(true);
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error('VAPID public key missing');

      // Ensure the Service Worker is registered — in production _app.js does
      // this, but dev mode skips it, so register here as a safety net.
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }
      await navigator.serviceWorker.ready;

      // Request notification permission (must be a user-gesture context,
      // which the button click provides).
      const perm = await Notification.requestPermission();
      if (perm === 'denied') {
        setState('blocked');
        setBusy(false);
        return;
      }
      if (perm !== 'granted') {
        setBusy(false);
        return;
      }

      // Subscribe (or retrieve existing subscription)
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

      setState('granted');
      setHasSubscription(true);
    } catch (e) {
      console.error('[push-toggle] enable failed:', e);
      setErr(t.error);
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setErr('');
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg && (await reg.pushManager.getSubscription());
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
          credentials: 'same-origin',
        });
      }
      setHasSubscription(false);
    } catch (e) {
      console.error('[push-toggle] disable failed:', e);
      setErr(t.error);
    } finally {
      setBusy(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────
  const card = {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    marginTop: '16px',
    border: '1px solid #e5e7eb',
  };
  const h3 = { fontSize: '17px', fontWeight: 700, margin: '0 0 10px', color: '#1a1a1a' };
  const labelText = { display: 'block', fontSize: '14px', fontWeight: 600, color: '#1a1a1a' };
  const hintText = { display: 'block', fontSize: '12px', color: '#6b7280', marginTop: '6px', lineHeight: 1.5 };
  const btn = {
    display: 'inline-block',
    marginTop: '12px',
    padding: '10px 16px',
    borderRadius: '10px',
    border: 'none',
    background: '#006a62',
    color: 'white',
    fontSize: '14px',
    fontWeight: 600,
    cursor: busy ? 'wait' : 'pointer',
  };
  const btnGhost = { ...btn, background: 'transparent', color: '#006a62', border: '1px solid #006a62' };
  const status = { fontSize: '13px', color: '#059669', fontWeight: 600, marginTop: '10px' };
  const warn = { fontSize: '13px', color: '#b45309', fontWeight: 500, marginTop: '10px' };
  const errStyle = { fontSize: '13px', color: '#dc2626', fontWeight: 500, marginTop: '10px' };

  return (
    <div style={card}>
      <h3 style={h3}>{t.title}</h3>
      <span style={labelText}>{t.label}</span>
      <span style={hintText}>{t.hint}</span>

      {state === 'checking' && null}

      {state === 'unsupported' && <div style={warn}>{t.unsupported}</div>}

      {state === 'blocked' && <div style={warn}>{t.blocked}</div>}

      {state === 'default' && (
        <button type="button" onClick={handleEnable} disabled={busy} style={btn}>
          {busy ? t.enabling : t.enable}
        </button>
      )}

      {state === 'granted' && hasSubscription && (
        <>
          <div style={status}>{t.enabled}</div>
          <button type="button" onClick={handleDisable} disabled={busy} style={{ ...btnGhost, marginTop: '8px' }}>
            {busy ? t.disabling : t.disable}
          </button>
        </>
      )}

      {state === 'granted' && !hasSubscription && (
        <button type="button" onClick={handleEnable} disabled={busy} style={btn}>
          {busy ? t.enabling : t.enable}
        </button>
      )}

      {err && <div style={errStyle}>{err}</div>}
    </div>
  );
}
