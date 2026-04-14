/**
 * Server-side Cloudflare Turnstile verification.
 * Validates the cf-turnstile-response token sent from the client.
 *
 * Env vars:
 *   TURNSTILE_SECRET_KEY — secret key from Cloudflare dashboard
 *
 * In development (no secret key configured), verification is skipped
 * so local forms keep working without a Turnstile account.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify a Turnstile token. Returns { success: true } or { success: false, error: string }.
 */
export async function verifyTurnstile(token) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Skip verification in dev when no secret is configured
  if (!secret) return { success: true };

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
    // Fail open — don't block registrations if Cloudflare is down
    return { success: true };
  }
}
