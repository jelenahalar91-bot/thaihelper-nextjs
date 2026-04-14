import { useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';

/**
 * Cloudflare Turnstile CAPTCHA widget.
 *
 * Props:
 *   onToken(token)  — called when the user passes verification
 *   theme           — 'light' | 'dark' | 'auto' (default: 'auto')
 *
 * Env: NEXT_PUBLIC_TURNSTILE_SITE_KEY must be set.
 * When the site key is missing (local dev), the widget is not rendered
 * and the form works without CAPTCHA.
 */
export default function Turnstile({ onToken, theme = 'auto' }) {
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
