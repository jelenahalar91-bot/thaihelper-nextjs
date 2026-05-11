// Server-side Sentry init — runs once per runtime (nodejs / edge) at
// startup. Replaces the deprecated sentry.server.config.js and
// sentry.edge.config.js. The browser-side init lives in
// instrumentation-client.js.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      enabled: process.env.NODE_ENV === 'production',
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
    });
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      enabled: process.env.NODE_ENV === 'production',
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
    });
  }
}
