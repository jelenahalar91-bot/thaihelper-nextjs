// Browser-side Sentry init — replaces the deprecated
// sentry.client.config.js. Auto-loaded by Next.js on every client
// hydration when this file is present at the project root.

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',
  // Sample 100% of errors, 10% of transactions (adjust as traffic grows)
  tracesSampleRate: 0.1,
  // Don't send PII (emails, IPs) — GDPR compliance
  sendDefaultPii: false,
});

// Instrument client-side route changes — required by @sentry/nextjs to
// capture navigation performance + errors that happen mid-transition.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
