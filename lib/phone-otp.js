// Phone-verification helpers — rate-limit maths and phone-number
// normalisation. No I/O; all DB access and the Twilio calls happen in the API
// routes that use these.
//
// This file used to generate, hash and check the OTP itself. Twilio Verify
// does all three now (see pages/api/phone/send-otp.js for why), so the code
// never exists on our side: nothing to hash, nothing to leak, and no
// PHONE_OTP_SECRET to manage. What is left is the part Verify does not do —
// turning what a user typed into an E.164 number, and capping how often one
// ACCOUNT may trigger an SMS, which is what protects our balance from an
// account that keeps changing the number it sends to.

// ─── Tunables ────────────────────────────────────────────────────────

// How long Twilio Verify keeps a code alive. This is THEIR timeout, not ours
// — we only report it to the UI so the countdown matches reality. Changing it
// here changes nothing; change it on the Verify Service.
export const VERIFY_EXPIRY_MS = 10 * 60 * 1000;

// Wrong guesses we show a countdown for. Verify enforces its own ceiling and
// is the real protection; this exists so the card can say "2 attempts left"
// instead of nothing, because Verify does not report what it has left.
export const MAX_ATTEMPTS = 5;

// SMS-rate-limit window: max 3 SMS per phone number per hour.
// Prevents SMS-pumping where a malicious actor uses our app to push
// hundreds of SMS to premium-rate numbers we'd be billed for.
export const MAX_SMS_PER_WINDOW = 3;
export const SMS_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Strip a user-entered phone number to E.164-shape digits only.
 * "089-123 4567" + "+66" → "66891234567" (drops the leading 0 since
 * Thai mobile numbers conventionally include it locally but drop it
 * with the country code, e.g. "+66 89 123 4567").
 *
 * Returns null if the result doesn't look like a phone number.
 */
export function normalisePhone({ countryCode, number }) {
  if (typeof countryCode !== 'string' || typeof number !== 'string') return null;

  const cc = countryCode.replace(/[^\d]/g, '');
  // Strip everything except digits from the number itself.
  let local = number.replace(/[^\d]/g, '');
  if (!cc || !local) return null;

  // Common Thai-specific quirk: locals enter "0891234567" but with
  // country code +66 they should not have the leading 0. Drop it.
  if (cc === '66' && local.startsWith('0')) {
    local = local.slice(1);
  }

  // Same for several other countries with leading-zero local format.
  if (['49', '44', '33', '39', '34', '61', '64'].includes(cc) && local.startsWith('0')) {
    local = local.slice(1);
  }

  const combined = cc + local;

  // Sanity: 8 to 15 digits total (ITU E.164 range).
  if (combined.length < 8 || combined.length > 15) return null;
  return combined;
}

/**
 * Display format for a stored E.164 number. We don't try to render
 * pretty per-country formats; this is only for the user's own
 * settings page so a "+66 891234567" style is fine.
 */
export function displayPhone({ countryCode, number }) {
  if (!countryCode || !number) return '';
  const cc = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  // Strip cc prefix from number if it's already in there.
  const ccDigits = countryCode.replace(/[^\d]/g, '');
  const local = number.startsWith(ccDigits) ? number.slice(ccDigits.length) : number;
  return `${cc} ${local}`;
}

// ─── Rate-limiting maths ─────────────────────────────────────────────

/**
 * Given the current SMS-send window state from the DB, return:
 *   { allowed, retryAfterSec, nextCount, nextWindowStart }
 *
 * Caller updates the row to nextCount + nextWindowStart on a successful
 * send. If allowed=false, do not send and surface retryAfterSec to the
 * client.
 */
export function checkSmsRateLimit({ count, windowStart, now = new Date() }) {
  const nowMs = now.getTime();
  const startMs = windowStart ? new Date(windowStart).getTime() : null;

  // Window expired or never started → fresh window.
  if (!startMs || nowMs - startMs >= SMS_WINDOW_MS) {
    return {
      allowed: true,
      retryAfterSec: 0,
      nextCount: 1,
      nextWindowStart: now,
    };
  }

  // Within window, under cap → allow.
  if ((count || 0) < MAX_SMS_PER_WINDOW) {
    return {
      allowed: true,
      retryAfterSec: 0,
      nextCount: (count || 0) + 1,
      nextWindowStart: new Date(startMs),
    };
  }

  // Within window, at or over cap → deny.
  const retryAfterMs = SMS_WINDOW_MS - (nowMs - startMs);
  return {
    allowed: false,
    retryAfterSec: Math.ceil(retryAfterMs / 1000),
    nextCount: count,
    nextWindowStart: new Date(startMs),
  };
}

// ─── Local development ───────────────────────────────────────────────

/**
 * True only when a developer has explicitly asked to skip Twilio.
 *
 * This makes send-otp report success without sending, and verify-otp accept
 * any well-formed code — so it must be impossible on a deployed site, where it
 * would be a login-grade bypass of phone verification.
 *
 * Two conditions, deliberately. The previous version fell into dev mode
 * whenever Twilio credentials were merely absent, which is one unset
 * environment variable away from being live.
 */
export const DEV_BYPASS =
  process.env.PHONE_OTP_DEV_LOG === 'true'
  && process.env.VERCEL_ENV !== 'production'
  && process.env.NODE_ENV !== 'production';
