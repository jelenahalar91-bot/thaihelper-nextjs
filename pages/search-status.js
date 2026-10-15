// Where the buttons in the "are you still looking?" email land
// (lib/emails/status-checkin.js).
//
// The page records the answer itself, on mount, by posting to
// /api/family-followup. The email never links to anything that changes state
// on GET: mail gateways fetch every link in a message before the human sees
// it, and a scanner must not be able to hide someone's profile or log a hire
// that never happened. A robot that fetches this URL gets HTML and nothing
// else happens.
//
// Then it says in plain words what the tap did — a family who chose "not
// looking any more" should be told their profile is now hidden, not merely
// thanked — and, for the one answer where it is worth knowing, asks where
// they found someone. That second question is optional and one tap.

import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import BrandWordmark from '@/components/BrandWordmark';

const ANSWERS = {
  still_searching: {
    title: 'Thanks — we’ll keep you listed',
    body: 'Your profile stays visible to helpers and nothing changes. We won’t ask again.',
  },
  found_here: {
    title: 'Wonderful — congratulations',
    body: 'That is exactly what this site is for. Your profile is set to “not hiring now”, so new enquiries stop. Your conversations stay open, and you can start searching again any time.',
  },
  found_elsewhere: {
    title: 'Good to hear you found someone',
    body: 'Your profile is set to “not hiring now”, so new enquiries stop. You can start searching again any time.',
  },
  not_looking: {
    title: 'Done — your profile is hidden',
    body: 'Helpers can no longer see you or message you. Nothing is deleted: your account and your messages stay saved, and you can go back online from your dashboard whenever you like.',
  },
};

const FAILURE = {
  invalid: {
    title: 'This link didn’t work',
    body: 'We couldn’t read it. You can set your status on your dashboard instead — it takes one tap.',
  },
  error: {
    title: 'Something went wrong',
    body: 'We couldn’t save that. Please try again, or set your status on your dashboard.',
  },
};

const SOURCES = [
  { value: 'agency', label: 'Through an agency' },
  { value: 'facebook', label: 'A Facebook group' },
  { value: 'friends', label: 'Friends or word of mouth' },
  { value: 'other', label: 'Somewhere else' },
];

export default function SearchStatus() {
  const router = useRouter();
  const [state, setState] = useState('working'); // working | ok | invalid | error
  const [answer, setAnswer] = useState('');
  const [sourceSent, setSourceSent] = useState(false);
  const [saving, setSaving] = useState(false);
  // React runs effects twice in development; the POST is idempotent server
  // side, but there is no reason to make it twice.
  const submitted = useRef(false);

  useEffect(() => {
    if (!router.isReady || submitted.current) return;
    submitted.current = true;

    const t = typeof router.query.t === 'string' ? router.query.t : '';
    const a = typeof router.query.a === 'string' ? router.query.a : '';
    if (!t || !ANSWERS[a]) { setState('invalid'); return; }
    setAnswer(a);

    fetch('/api/family-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t, answer: a }),
    })
      .then(r => setState(r.ok ? 'ok' : (r.status === 400 ? 'invalid' : 'error')))
      .catch(() => setState('error'));
  }, [router.isReady, router.query.t, router.query.a]);

  async function pickSource(value) {
    if (saving) return;
    setSaving(true);
    const t = typeof router.query.t === 'string' ? router.query.t : '';
    try {
      await fetch('/api/family-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t, source: value }),
      });
    } catch {
      // Never make someone answer a courtesy question twice.
    } finally {
      setSourceSent(true);
      setSaving(false);
    }
  }

  const copy =
    state === 'ok' ? ANSWERS[answer]
    : state === 'invalid' ? FAILURE.invalid
    : state === 'error' ? FAILURE.error
    : null;

  const askSource = state === 'ok' && answer === 'found_elsewhere' && !sourceSent;

  return (
    <>
      <Head>
        <title>Your search status · ThaiHelper</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{
        minHeight: '100vh', background: '#f8faf9',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{
          width: '100%', maxWidth: '480px', background: 'white',
          borderRadius: '18px', padding: '36px 30px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center',
        }}>
          <div style={{ marginBottom: '22px' }}><BrandWordmark /></div>

          {!copy ? (
            <p style={{ fontSize: '15px', color: '#8b99a3', margin: '8px 0 24px' }}>Saving your answer…</p>
          ) : (
            <>
              <h1 style={{ fontSize: '21px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 10px', lineHeight: 1.35 }}>
                {copy.title}
              </h1>
              <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.6, margin: '0 0 24px' }}>
                {copy.body}
              </p>
            </>
          )}

          {askSource && (
            <div style={{
              borderTop: '1px solid #eef2f4', paddingTop: '22px', marginBottom: '22px', textAlign: 'left',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A4B', marginBottom: '4px' }}>
                Where did you find them?
              </div>
              <p style={{ fontSize: '13px', color: '#8b99a3', margin: '0 0 12px', lineHeight: 1.5 }}>
                Optional, and it genuinely helps us know what works for families here.
              </p>
              <div style={{ display: 'grid', gap: '7px' }}>
                {SOURCES.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    disabled={saving}
                    onClick={() => pickSource(s.value)}
                    style={{
                      padding: '11px 15px', borderRadius: '11px',
                      border: '2px solid #E2ECF0', background: 'white',
                      color: '#1B3A4B', fontWeight: 600, fontSize: '14px',
                      cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sourceSent && (
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#006a62', margin: '0 0 22px' }}>
              ✅ Thank you — that helps.
            </p>
          )}

          <Link
            href="/employer-dashboard"
            style={{
              display: 'inline-block', padding: '13px 26px', borderRadius: '10px',
              background: '#006a62', color: 'white', fontSize: '15px',
              fontWeight: 700, textDecoration: 'none',
            }}
          >
            Open my dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
