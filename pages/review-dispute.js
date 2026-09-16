// "This review is not true" — reached from the link in the rating email.
//
// Bilingual on one page rather than behind the language switcher: whoever
// lands here is upset, and picking a language is one obstacle too many.
//
// The page is deliberately plain about what disputing does and does not do.
// It does not hide the review (see pages/api/review-dispute.js), and saying
// otherwise would be a promise we break in public on their profile.

import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BrandWordmark from '@/components/BrandWordmark';
import { useRouter } from 'next/router';

const MAX_REASON = 1000;

export default function ReviewDispute() {
  const router = useRouter();
  const { t: token } = router.query;

  const [state, setState] = useState('loading'); // loading | ready | sending | sent | removed | invalid
  const [review, setReview] = useState(null);
  const [helperName, setHelperName] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // router.query is empty on the first render of a static page.
    if (!router.isReady) return;
    if (!token) { setState('invalid'); return; }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/review-dispute?t=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) { setState('invalid'); return; }
        if (data.removed) { setState('removed'); return; }
        setReview(data.review);
        setHelperName(data.helperName);
        setState('ready');
      } catch {
        if (!cancelled) setState('invalid');
      }
    })();
    return () => { cancelled = true; };
  }, [router.isReady, token]);

  async function submit() {
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/review-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not send. Please reply to the email instead.');
        setState('ready');
        return;
      }
      setState(data.removed ? 'removed' : 'sent');
    } catch {
      setError('Could not send. Please reply to the email instead.');
      setState('ready');
    }
  }

  return (
    <>
      <Head>
        <title>Report a review · ThaiHelper</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#f8faf9',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '40px 32px',
          maxWidth: '520px',
          width: '100%',
        }}>
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <BrandWordmark href={null} size="lg" />
            </Link>
          </div>

          {state === 'loading' && (
            <p style={{ textAlign: 'center', color: '#9ca3af', margin: 0 }}>Loading…</p>
          )}

          {state === 'invalid' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 10px' }}>
                This link does not work
              </h1>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, margin: 0 }}>
                Reply to the email you received instead, or write to{' '}
                <a href="mailto:support@thaihelper.app" style={{ color: '#006a62' }}>
                  support@thaihelper.app
                </a>. We read every message.
                <br /><br />
                ลิงก์นี้ใช้ไม่ได้ กรุณาตอบกลับอีเมลที่คุณได้รับ หรือเขียนถึง support@thaihelper.app เราอ่านทุกฉบับ
              </p>
            </div>
          )}

          {state === 'removed' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 10px' }}>
                This review is already gone
              </h1>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, margin: 0 }}>
                It is no longer on your profile and nobody can see it.
                <br /><br />
                รีวิวนี้ถูกลบไปแล้ว ไม่มีใครเห็นอีกต่อไป
              </p>
            </div>
          )}

          {state === 'sent' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📨</div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 10px' }}>
                Thank you — we have it
              </h1>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, margin: 0 }}>
                A real person is reading this, not a robot. We will look at the
                conversation behind the review and get back to you. If it turns out to
                be false, we remove it — we have done it before.
                <br /><br />
                ขอบคุณค่ะ เราได้รับเรื่องแล้ว มีคนจริง ๆ อ่าน ไม่ใช่ระบบอัตโนมัติ
                เราจะตรวจสอบบทสนทนาที่เกี่ยวข้องและติดต่อกลับ หากพบว่าไม่เป็นความจริง เราจะลบรีวิวนั้น
              </p>
            </div>
          )}

          {(state === 'ready' || state === 'sending') && review && (
            <>
              <h1 style={{ fontSize: '21px', fontWeight: 700, margin: '0 0 8px' }}>
                Report this review
              </h1>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, margin: '0 0 20px' }}>
                {helperName ? `${helperName}, tell` : 'Tell'} us what is wrong with it. You do not
                need to be polite or explain yourself well — just say what happened.
              </p>

              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
              }}>
                <div style={{ fontSize: '20px', color: '#F4A261', letterSpacing: '2px' }}>
                  {'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  {review.employerFirstName}
                </div>
                {review.comment && (
                  <blockquote style={{
                    margin: '12px 0 0', padding: '10px 14px',
                    borderLeft: '3px solid #e5e7eb', background: 'white',
                    borderRadius: '8px', fontSize: '14px', color: '#374151',
                  }}>
                    {review.comment}
                  </blockquote>
                )}
              </div>

              {review.alreadyDisputed && (
                <p style={{
                  fontSize: '13px', color: '#8a4b12', background: '#fff8f0',
                  borderLeft: '4px solid #F4A261', borderRadius: '8px',
                  padding: '10px 14px', margin: '0 0 16px', lineHeight: 1.6,
                }}>
                  You already reported this review. Sending again is fine — it replaces what
                  you wrote before.
                </p>
              )}

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON))}
                rows={5}
                disabled={state === 'sending'}
                placeholder="What is not true? Did you ever work for this family? / ไม่จริงตรงไหน คุณเคยทำงานให้ครอบครัวนี้หรือไม่"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1px solid #e5e7eb', fontSize: '14px',
                  fontFamily: 'inherit', resize: 'vertical', minHeight: '120px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: '11px', color: '#9ca3af', marginTop: '6px',
              }}>
                <span>{reason.length}/{MAX_REASON}</span>
                {error && <span style={{ color: '#dc2626', fontWeight: 600 }}>{error}</span>}
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={state === 'sending'}
                style={{
                  width: '100%', marginTop: '16px', padding: '14px',
                  borderRadius: '10px', border: 'none',
                  background: '#006a62', color: 'white',
                  fontSize: '15px', fontWeight: 700,
                  cursor: state === 'sending' ? 'wait' : 'pointer',
                  opacity: state === 'sending' ? 0.7 : 1,
                }}
              >
                {state === 'sending' ? 'Sending…' : 'Send this to ThaiHelper / ส่งให้ ThaiHelper'}
              </button>

              <p style={{
                fontSize: '12px', color: '#9ca3af', lineHeight: 1.6,
                margin: '16px 0 0',
              }}>
                Being honest with you: reporting a review does not hide it. It stays on your
                profile while we check, because otherwise anyone could delete criticism by
                pressing this button. What it does is put it in front of a person today
                instead of next week.
                <br /><br />
                การรายงานรีวิวไม่ได้ทำให้รีวิวหายไปทันที รีวิวจะยังอยู่ระหว่างที่เราตรวจสอบ
                แต่เรื่องของคุณจะถึงมือคนจริง ๆ ภายในวันนี้
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
