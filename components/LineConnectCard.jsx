/**
 * LineConnectCard — shown after registration when the user opted into LINE
 * notifications. Renders the two-step handshake the user has to complete
 * to connect their LINE account to ours:
 *
 *   1. Add @ThaiHelper as a friend (QR + tap-to-open-LINE button)
 *   2. Send the bot a "link XXXX" message — XXXX is a one-time token
 *      issued at registration. The /api/line/webhook handler claims the
 *      token and saves the user's LINE userId.
 *
 * Props:
 *   token         — the link token from /api/register response
 *   message       — full text the user should send, e.g. "link abc123"
 *   addFriendUrl  — https://line.me/R/ti/p/@xxx — encoded in the QR
 *   lang          — 'en' | 'th' (others fall back to en)
 *
 * No prop = the user didn't opt in or the env isn't configured → render null.
 */

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const COPY = {
  en: {
    title: 'One more step — connect LINE',
    subtitle: 'Two quick steps to start getting instant alerts on your phone:',
    step1: '1. Add @ThaiHelper as a friend',
    step1_mobile: 'Open in LINE',
    step1_desktop: 'Or scan this QR with the LINE app on your phone:',
    step2: '2. Send this message to the bot',
    step2_hint: 'Tap to copy, then paste in your chat with @ThaiHelper:',
    copied: 'Copied ✓',
    copy: 'Copy',
    skip: 'Skip for now — I\'ll do this later',
  },
  th: {
    title: 'อีกขั้นตอนเดียว — เชื่อมต่อ LINE',
    subtitle: 'สองขั้นตอนสั้นๆ เพื่อรับการแจ้งเตือนทันทีบนมือถือ:',
    step1: '1. เพิ่ม @ThaiHelper เป็นเพื่อน',
    step1_mobile: 'เปิดใน LINE',
    step1_desktop: 'หรือสแกน QR นี้ด้วย LINE บนมือถือ:',
    step2: '2. ส่งข้อความนี้ให้บอท',
    step2_hint: 'แตะเพื่อคัดลอก แล้ววางในแชทกับ @ThaiHelper:',
    copied: 'คัดลอกแล้ว ✓',
    copy: 'คัดลอก',
    skip: 'ข้ามไปก่อน — ค่อยทำทีหลัง',
  },
};

export default function LineConnectCard({ token, message, addFriendUrl, lang = 'en' }) {
  const t = COPY[lang] || COPY.en;
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate QR client-side so we don't need to round-trip an image URL.
  // Falls back gracefully — if QR fails the add-friend button still works.
  useEffect(() => {
    if (!addFriendUrl) return;
    let cancelled = false;
    QRCode.toDataURL(addFriendUrl, {
      width: 220,
      margin: 1,
      color: { dark: '#1B3A4B', light: '#ffffff' },
    })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch((err) => console.warn('[LineConnectCard] QR gen failed:', err));
    return () => { cancelled = true; };
  }, [addFriendUrl]);

  if (!token || !message) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without Clipboard API — select the text.
      const el = document.getElementById('line-link-message');
      if (el) {
        const range = document.createRange();
        range.selectNode(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  return (
    <div style={{
      background: '#f0fdf4',
      border: '2px solid #86efac',
      borderRadius: '16px',
      padding: '20px',
      marginTop: '20px',
      textAlign: 'left',
    }}>
      <h3 style={{
        margin: '0 0 4px',
        fontSize: '17px',
        fontWeight: 700,
        color: '#14532d',
      }}>
        💬 {t.title}
      </h3>
      <p style={{
        margin: '0 0 16px',
        fontSize: '14px',
        color: '#166534',
        lineHeight: 1.5,
      }}>
        {t.subtitle}
      </p>

      {/* ─── Step 1: add as friend ───────────────────────────────────────── */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '12px',
      }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1B3A4B', marginBottom: '10px' }}>
          {t.step1}
        </div>

        {addFriendUrl && (
          <a
            href={addFriendUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              background: '#06C755', // LINE brand green
              color: 'white',
              textAlign: 'center',
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '15px',
              textDecoration: 'none',
              marginBottom: '12px',
            }}
          >
            📱 {t.step1_mobile}
          </a>
        )}

        {qrDataUrl && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
              {t.step1_desktop}
            </div>
            <img
              src={qrDataUrl}
              alt="LINE add-friend QR"
              style={{
                display: 'block',
                margin: '0 auto',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: 'white',
              }}
            />
          </div>
        )}
      </div>

      {/* ─── Step 2: send link message ───────────────────────────────────── */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '14px',
      }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1B3A4B', marginBottom: '6px' }}>
          {t.step2}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
          {t.step2_hint}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          style={{
            width: '100%',
            background: copied ? '#dcfce7' : '#f1f5f9',
            border: `2px dashed ${copied ? '#22c55e' : '#cbd5e1'}`,
            borderRadius: '10px',
            padding: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            transition: 'all 0.15s ease',
          }}
        >
          <code
            id="line-link-message"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '15px',
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: '0.05em',
            }}
          >
            {message}
          </code>
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            color: copied ? '#16a34a' : '#475569',
            whiteSpace: 'nowrap',
          }}>
            {copied ? t.copied : `📋 ${t.copy}`}
          </span>
        </button>
      </div>
    </div>
  );
}
