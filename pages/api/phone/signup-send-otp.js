// POST /api/phone/signup-send-otp
//
// Body: { phone_number, country_code, language?, turnstileToken }
//
// Sends a verification code to somebody who does NOT have an account yet. The
// companion route signup-verify-otp.js turns a correct code into a proof token
// that /api/employer-signup requires.
//
// WHY A SECOND PAIR OF OTP ROUTES. The existing send-otp/verify-otp need a
// session: they read the account row, write the number onto it, and keep the
// rate-limit counters there. None of that exists before signup. Rather than
// bend those routes into working without the row they are built around, this
// pair does the one thing they cannot — verify a number with nothing to attach
// it to — and lib/phone-signup-token.js carries the result forward.
//
// WHAT REPLACES THE email_verified GATE. send-otp refuses to spend an SMS until
// the account has confirmed its email, which is the cheapest guard against
// SMS-pumping through throwaway signups. There is no email to have confirmed
// here, so that guard is gone and three others stand in its place:
//
//   Turnstile      the real barrier, and the same one the signup form uses.
//                  A token is single-use, so the form fetches a fresh one for
//                  this call and another for the submit.
//   per number     3 per hour. Carries over MAX_SMS_PER_WINDOW from the
//                  logged-in flow, but keyed on the NUMBER rather than the
//                  account — there is no account, and the number is what costs
//                  money to reach.
//   per IP         6 per hour, above a household retrying twice on two
//                  handsets, below anything resembling a pump.
//
// Note this is not strictly weaker than what it replaces: an attacker who was
// willing to create throwaway accounts got a fresh 3-per-hour allowance with
// every one of them. Here the allowance follows the number and the address.
//
// Responses:
//   200 { ok: true, expiresInSec }
//   400 { error: 'invalid_request' | 'invalid_phone' }
//   403 { error: 'captcha' }
//   409 { error: 'phone_in_use' | 'phone_blocked' }
//   429 { error: 'rate_limited', retryAfterSec }
//   500 { error: 'sms_send_failed' | 'server_misconfigured' }

import { getServiceSupabase } from '@/lib/supabase';
import { numberTakenBy } from '@/lib/phone-identity';
import { verifyTurnstile } from '@/lib/turnstile';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  normalisePhone,
  VERIFY_EXPIRY_MS,
  MAX_SMS_PER_WINDOW,
  SMS_WINDOW_MS,
  DEV_BYPASS,
} from '@/lib/phone-otp';
import { getTwilioVerify, VERIFY_LOCALES } from '@/lib/twilio-verify';

const IP_MAX_PER_WINDOW = 6;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { phone_number, country_code, language, turnstileToken } = req.body || {};
  if (!phone_number || !country_code) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  // Before anything billable. verifyTurnstile already fails closed in
  // production when the secret is missing (lib/turnstile.js).
  const captcha = await verifyTurnstile(turnstileToken);
  if (!captcha.success) {
    return res.status(403).json({ error: 'captcha' });
  }

  const e164 = normalisePhone({ countryCode: country_code, number: phone_number });
  if (!e164) {
    return res.status(400).json({ error: 'invalid_phone' });
  }

  // One verified number, one account — asked here so nobody reads an SMS for a
  // number that could never be used. Asked again after the code is right, and
  // a third time at insert, because only the last one actually decides.
  const supabase = getServiceSupabase();
  const owner = await numberTakenBy(supabase, e164, null);
  if (owner.taken) {
    console.warn(`[phone/signup-send-otp] number already held by ${owner.ref}`);
    return res.status(409).json({
      error: owner.suspended ? 'phone_blocked' : 'phone_in_use',
    });
  }

  // Both counters are checked before the send and both record on the way
  // through, so a send we never hear back about still costs its slot.
  const perNumber = await checkRateLimit({
    bucket: 'signup-otp-number',
    key: e164,
    max: MAX_SMS_PER_WINDOW,
    windowMs: SMS_WINDOW_MS,
  });
  if (!perNumber) {
    return res.status(429).json({
      error: 'rate_limited',
      retryAfterSec: Math.ceil(SMS_WINDOW_MS / 1000),
    });
  }

  // Same inline read as every other rate-limited route here (/api/auth,
  // /api/employer-auth): the first hop of the x-forwarded-for chain.
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress || null;
  const perIp = await checkRateLimit({
    bucket: 'signup-otp-ip',
    key: ip,
    max: IP_MAX_PER_WINDOW,
    windowMs: SMS_WINDOW_MS,
  });
  if (!perIp) {
    return res.status(429).json({
      error: 'rate_limited',
      retryAfterSec: Math.ceil(SMS_WINDOW_MS / 1000),
    });
  }

  if (DEV_BYPASS) {
    console.log(`[phone/signup-send-otp] DEV — no SMS sent to +${e164}; any 6-digit code will verify.`);
    return res.status(200).json({ ok: true, expiresInSec: VERIFY_EXPIRY_MS / 1000 });
  }

  const verify = getTwilioVerify();
  if (!verify) return res.status(500).json({ error: 'server_misconfigured' });

  const locale = VERIFY_LOCALES.has(language) ? language : 'en';
  try {
    await verify.verifications.create({ to: `+${e164}`, channel: 'sms', locale });
  } catch (err) {
    // 60203: Verify's own per-number send ceiling. 60200: it rejected the
    // number itself — normalisePhone only checks shape, so a well-formed but
    // non-existent number lands here.
    if (err.code === 60203) {
      return res.status(429).json({ error: 'rate_limited', retryAfterSec: 600 });
    }
    if (err.code === 60200) {
      return res.status(400).json({ error: 'invalid_phone' });
    }
    console.error('[phone/signup-send-otp] Verify send failed:', err.message, err.code);
    return res.status(500).json({ error: 'sms_send_failed', detail: err.code });
  }

  return res.status(200).json({ ok: true, expiresInSec: VERIFY_EXPIRY_MS / 1000 });
}
