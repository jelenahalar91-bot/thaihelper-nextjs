/**
 * Server-side Cloudflare Turnstile verification.
 * Validates the cf-turnstile-response token sent from the client.
 *
 * Env vars:
 *   TURNSTILE_SECRET_KEY — secret key from Cloudflare dashboard
 *
 * In development (no secret key configured), verification is skipped
 * so local forms keep working without a Turnstile account. In
 * production, missing secret or upstream errors fail closed — better
 * to inconvenience real users with a retry than let bots through the
 * registration / signup forms when Cloudflare has a hiccup.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Verify a Turnstile token. Returns { success: true } or { success: false, error: string }.
 */
export async function verifyTurnstile(token) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (IS_PRODUCTION) {
      // Misconfiguration in production — fail closed so bots can't slip
      // through while we wait for the env var to be set.
      console.error('TURNSTILE_SECRET_KEY is not set — refusing verification in production');
      return { success: false, error: 'CAPTCHA misconfigured' };
    }
    // Dev convenience — local forms work without a Turnstile account.
    return { success: true };
  }

  if (!token) {
    return { success: false, error: 'Missing CAPTCHA token' };
  }

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    });

    const data = await res.json();

    if (data.success) {
      return { success: true };
    }

    return { success: false, error: 'CAPTCHA verification failed' };
  } catch (err) {
    console.error('Turnstile verification error:', err);
    if (IS_PRODUCTION) {
      // Cloudflare reachability issue in production — fail closed. The
      // user sees a "temporarily unavailable" message and can retry;
      // bots can't exploit the outage window to bulk-register.
      return { success: false, error: 'CAPTCHA temporarily unavailable, please retry' };
    }
    return { success: true };
  }
}
