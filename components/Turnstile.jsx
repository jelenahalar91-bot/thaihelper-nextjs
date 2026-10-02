import { useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';

/**
 * Cloudflare Turnstile CAPTCHA widget.
 *
 * Props:
 *   onToken(token)  — called when the user passes verification
 *   theme           — 'light' | 'dark' | 'auto' (default: 'auto')
 *   resetSignal     — change this number to throw away the current token and
 *                     solve again; onToken fires with the new one
 *
 * A TOKEN IS SINGLE-USE. Cloudflare rejects the second submission of the same
 * token, so a form that verifies twice — the employer signup now sends one with
 * the SMS request and one with the account — must ask for a fresh one in
 * between. Hence resetSignal: bump it after spending a token.
 *
 * Env: NEXT_PUBLIC_TURNSTILE_SITE_KEY must be set.
 * When the site key is missing (local dev), the widget is not rendered
 * and the form works without CAPTCHA.
 */
export default function Turnstile({ onToken, theme = 'auto', resetSignal = 0 }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile) return;
    // Avoid double-rendering
    if (widgetIdRef.current != null) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      callback: (token) => onToken?.(token),
    });
  }, [siteKey, theme, onToken]);

  // Spend-and-replace. Skipped on the first render — there is nothing to
  // discard yet, and resetting a widget that has not solved would clear the
  // challenge the user is in the middle of.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (widgetIdRef.current != null && window.turnstile) {
      // reset() re-runs the challenge and fires the callback again, so the
      // parent receives the replacement through the same onToken it already has.
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetSignal]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  // If no site key, skip rendering entirely (dev mode)
  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
        onLoad={renderWidget}
      />
      <div ref={containerRef} style={{ marginTop: '16px', marginBottom: '8px' }} />
    </>
  );
}
