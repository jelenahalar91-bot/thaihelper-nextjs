// Phone-OTP helpers — generation, hashing, verification, rate-limit
// math, phone-number normalisation. No I/O; all DB access and SMS
// sending happens in the API routes that use these.
//
// Why salt with a server-side secret rather than per-OTP random
// salt: the OTP space is only 1 000 000 codes, so a plaintext-hashed
// OTP in a DB leak can be brute-forced trivially. The PHONE_OTP_SECRET
// env var (separate from JWT_SECRET, never logged) makes the leaked
// hash unusable without the secret. Combined with the per-row
// 10-minute expiry, this is the right balance for v1.

import crypto from 'crypto';

// ─── Tunables ────────────────────────────────────────────────────────

// 6-digit numeric OTPs. 1 in 1 000 000 chance of guessing in one shot;
// combined with MAX_ATTEMPTS (5) before the code is invalidated, the
// effective brute-force ceiling is 5/1 000 000 = 0.0005 % per session.
export const OTP_LENGTH = 6;

// OTP is valid for 10 minutes. Generous enough for users to read the
// SMS, dig out their phone, type it in. Short enough to limit replay
// risk if the SMS leaks.
export const OTP_EXPIRY_MS = 10 * 60 * 1000;

// Brute-force protection: after 5 wrong attempts the OTP is dead and
// the user must request a new one.
export const MAX_ATTEMPTS = 5;

// SMS-rate-limit window: max 3 SMS per phone number per hour.
// Prevents SMS-pumping where a malicious actor uses our app to push
// hundreds of SMS to premium-rate numbers we'd be billed for.
export const MAX_SMS_PER_WINDOW = 3;
export const SMS_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ─── OTP generation + hashing ────────────────────────────────────────

/**
 * Generate a numeric OTP of OTP_LENGTH digits using crypto-grade
 * randomness. Leading zeros are preserved (e.g. "042195" is valid).
 */
export function generateOtp() {
  const max = 10 ** OTP_LENGTH;
  const value = crypto.randomInt(0, max);
  return String(value).padStart(OTP_LENGTH, '0');
}

/**
 * Salted SHA-256 hash of the OTP. Salt is the per-account auth ID +
 * a server-side secret. The secret must be set as PHONE_OTP_SECRET in
 * env; if missing we throw — better to fail loudly than to silently
 * hash with empty salt.
 *
 * The hash is hex-encoded and ~64 chars — fits comfortably in TEXT.
 */
export function hashOtp({ code, accountId }) {
  const secret = process.env.PHONE_OTP_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'PHONE_OTP_SECRET env var is missing or too short (need 16+ chars). ' +
      'Add a random value to .env.local and Vercel env vars.',
    );
  }
  if (!accountId) throw new Error('hashOtp requires accountId');
  return crypto
    .createHash('sha256')
    .update(`${secret}|${accountId}|${code}`)
    .digest('hex');
}

/**
 * Timing-safe comparison of submitted OTP against stored hash.
 * Returns true iff they match. Never returns early on partial mismatch
 * (prevents timing attacks).
 */
export function verifyOtp({ submittedCode, storedHash, accountId }) {
  if (!storedHash || !submittedCode || !accountId) return false;
  const candidate = hashOtp({ code: submittedCode, accountId });
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ─── Phone-number normalisation ──────────────────────────────────────

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

// ─── OTP-message body ────────────────────────────────────────────────

/**
 * Single source of truth for the SMS body. Kept short — Thai mobile
 * networks split at 70 chars for Thai script, 160 for Latin. This
 * stays well under both.
 */
export function buildSmsBody({ code, lang = 'en' }) {
  if (lang === 'th') {
    return `รหัสยืนยัน ThaiHelper: ${code}\nหมดอายุใน 10 นาที`;
  }
  return `ThaiHelper verification code: ${code}\nExpires in 10 min`;
}
