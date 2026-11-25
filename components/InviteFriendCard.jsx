import { useEffect, useState } from 'react';
import { inviteUrl } from '../lib/invite-url';

// Helpers know other helpers. This card hands them a personal link to pass
// on, with LINE first because that is where they already talk to each other.
//
// The link carries the inviter's code as utm_campaign, so a signup through it
// lands in helper_profiles.source as "invite/<code>" via the existing
// attribution path (lib/utm.js) — no extra column, no extra endpoint.
// The code is NOT the helper ref: the ref doubles as the login credential.

const T = {
  en: {
    title: 'Know someone who is looking for work?',
    body: 'Send your link to a friend who works as a nanny, housekeeper or caregiver. Signing up is free.',
    line: 'Send on LINE',
    share: 'Share',
    copy: 'Copy link',
    copied: 'Copied',
    message: 'I am using ThaiHelper to find work. It is a free website where families in Thailand look for nannies, housekeepers and caregivers. Families write to you directly. You can sign up here:',
  },
  th: {
    title: 'มีเพื่อนที่กำลังหางานอยู่ไหม',
    body: 'ส่งลิงก์ของคุณให้เพื่อนที่ทำงานเป็นพี่เลี้ยงเด็ก แม่บ้าน หรือผู้ดูแลผู้สูงอายุ สมัครฟรี',
    line: 'ส่งทาง LINE',
    share: 'แชร์',
    copy: 'คัดลอกลิงก์',
    copied: 'คัดลอกแล้ว',
    message: 'ฉันใช้ ThaiHelper หางานอยู่ เป็นเว็บไซต์ฟรีที่ครอบครัวในประเทศไทยมาหาพี่เลี้ยงเด็ก แม่บ้าน และผู้ดูแลผู้สูงอายุ ครอบครัวจะส่งข้อความหาเราโดยตรง สมัครได้ที่นี่:',
  },
};

export { inviteUrl };

export default function InviteFriendCard({ inviteCode, lang = 'en', isMobile = false }) {
  const t = T[lang] || T.en;
  const url = inviteUrl(inviteCode, lang);
  const text = `${t.message} ${url}`;

  // navigator.share only exists in the browser, so decide after mount to
  // keep the server and client markup identical.
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const handleShare = async () => {
    try {
      await navigator.share({ text: t.message, url });
    } catch {
      // Closing the share sheet rejects the promise; nothing to report.
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked (old in-app browsers): the link is visible below.
    }
  };

  const btn = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '11px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
    cursor: 'pointer', textDecoration: 'none', flex: isMobile ? '1 1 100%' : '0 0 auto',
  };

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      padding: isMobile ? '20px' : '24px', marginTop: '16px',
      border: '1px solid #e5e7eb',
    }}>
      <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px', color: '#1a1a1a' }}>
        {t.title}
      </h3>
      <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 16px', lineHeight: 1.55 }}>
        {t.body}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <a
          href={`https://line.me/R/share?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noreferrer"
          style={{ ...btn, background: '#06C755', color: 'white', border: '1px solid #06C755' }}
        >
          {t.line}
        </a>
        {canShare && (
          <button type="button" onClick={handleShare} style={{ ...btn, background: '#006a62', color: 'white', border: '1px solid #006a62' }}>
            {t.share}
          </button>
        )}
        <button type="button" onClick={handleCopy} style={{ ...btn, background: 'white', color: '#006a62', border: '1px solid #006a62' }}>
          {copied ? `✓ ${t.copied}` : t.copy}
        </button>
      </div>
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280', wordBreak: 'break-all', userSelect: 'all' }}>
        {url}
      </div>
    </div>
  );
}
