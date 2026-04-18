// Landing page shown after clicking "Unsubscribe" in a notification email.
// Confirms the unsubscribe worked and offers a one-click "Resubscribe" button.

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Unsubscribe() {
  const router = useRouter();
  const { status = 'ok', t } = router.query;
  const [state, setState] = useState('idle'); // 'idle' | 'working' | 'resubscribed' | 'error'

  async function resubscribe() {
    if (!t || state === 'working') return;
    setState('working');
    try {
      const r = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t, subscribe: true }),
      });
      if (r.ok) setState('resubscribed');
      else setState('error');
    } catch {
      setState('error');
    }
  }

  const isInvalid = status === 'invalid';
  const isError = status === 'error' || state === 'error';

  return (
    <>
      <Head>
        <title>Unsubscribe · ThaiHelper</title>
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
          padding: '48px 32px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: '24px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a' }}>
                Thai<span style={{ color: '#006a62' }}>Helper</span>
              </span>
            </Link>
          </div>

          {isInvalid ? (
            <>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>⚠️</div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px' }}>
                Invalid unsubscribe link
              </h1>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, margin: '0 0 24px' }}>
                This link has expired or is not valid. You can manage your notification settings
                from your account page once logged in.
              </p>
              <Link href="/" style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#006a62',
                color: 'white',
                fontWeight: 700,
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
              }}>
                Back to home
              </Link>
            </>
          ) : isError ? (
            <>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>❌</div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px' }}>
                Something went wrong
              </h1>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, margin: '0 0 24px' }}>
                We couldn't update your notification settings. Please try again, or
                update them from your account page.
              </p>
              <Link href="/" style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#006a62',
                color: 'white',
                fontWeight: 700,
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
              }}>
                Back to home
              </Link>
            </>
          ) : state === 'resubscribed' ? (
            <>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>✅</div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px' }}>
                You're subscribed again
              </h1>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, margin: '0 0 24px' }}>
                You'll receive email notifications when you get a new message on ThaiHelper.
              </p>
              <Link href="/" style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#006a62',
                color: 'white',
                fontWeight: 700,
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
              }}>
                Back to home
              </Link>
            </>
          ) : (
            <>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>📭</div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 12px' }}>
                You've been unsubscribed
              </h1>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, margin: '0 0 28px' }}>
                You will no longer receive email notifications when someone sends you a
                message on ThaiHelper. You can still see new messages by logging in to
                your inbox.
              </p>
              <p style={{ fontSize: '13px', color: '#999', lineHeight: 1.6, margin: '0 0 16px' }}>
                Changed your mind?
              </p>
              <button
                onClick={resubscribe}
                disabled={state === 'working' || !t}
                style={{
                  padding: '12px 24px',
                  background: state === 'working' ? '#cbd5e1' : '#006a62',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: state === 'working' ? 'wait' : 'pointer',
                }}
              >
                {state === 'working' ? 'Working…' : 'Resubscribe'}
              </button>
              <div style={{ marginTop: '24px' }}>
                <Link href="/" style={{ fontSize: '13px', color: '#999', textDecoration: 'underline' }}>
                  Back to home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
