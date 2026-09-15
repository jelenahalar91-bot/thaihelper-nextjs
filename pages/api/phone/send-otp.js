// POST /api/phone/send-otp
//
// Body:
//   { phone_number: "0891234567", country_code: "+66", language?: "en"|"th" }
//
// Asks Twilio Verify to send a code to the requested phone. Works for both
// helpers (th_session cookie) and employers (th_emp_session cookie).
//
// WHY VERIFY AND NOT PLAIN SMS. This route used to generate a code, hash it
// into the account row and send it with Programmable SMS. That cannot reach a
// Thai phone: since 2025-10-06 Thai operators drop SMS from unregistered
// sender IDs and from international long codes, and registering means three
// Letters of Authorisation and up to ten business days. 289 of our 298
// helpers with a number on file have a Thai one, so "mostly works" would have
// meant "works for nine people". Twilio states that Verify carries those
// registrations itself for OTP traffic, which is the whole reason for the
// switch.
//
// The side effect is that the code never exists on our side at all: Twilio
// generates it, ages it out and counts wrong guesses. We no longer store an
// OTP hash, and PHONE_OTP_SECRET is no longer needed.
//
// Responses:
//   200 { ok: true, retryAfterSec: 0, expiresInSec }
//   429 { error: 'rate_limited', retryAfterSec } → too many SMS this hour
//   400 { error: 'invalid_phone' | 'invalid_request' }
//   401 { error: 'unauthorized' }
//   500 { error: 'sms_send_failed' | 'server_misconfigured' }

import { getAnySession } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import {
  normalisePhone,
  checkSmsRateLimit,
  VERIFY_EXPIRY_MS,
  DEV_BYPASS,
} from '@/lib/phone-otp';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

// Locales Twilio Verify has a template for AND that we actually offer. Sending
// an unsupported locale is an error, not a silent fallback, so this is an
// allowlist rather than a pass-through of whatever the client sent.
const VERIFY_LOCALES = new Set(['en', 'th']);

// Helpers live in helper_profiles (PK column 'helper_ref').
// Employers live in employer_accounts (PK column 'employer_ref').
function tableFor(role) {
  return role === 'employer'
    ? { table: 'employer_accounts', refCol: 'employer_ref' }
    : { table: 'helper_profiles', refCol: 'helper_ref' };
}

let _twilioClient = null;
function getTwilio() {
  if (_twilioClient) return _twilioClient;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require('twilio');
    _twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    return _twilioClient;
  } catch (err) {
    console.error('[phone/send-otp] twilio package not installed:', err.message);
    return null;
  }
}

// DEV_BYPASS (lib/phone-otp.js) reports success without sending anything, so
// it is gated on both an explicit opt-in flag and a non-production build.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const session = await getAnySession(req);
  if (!session) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { phone_number, country_code, language } = req.body || {};
  if (!phone_number || !country_code) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const e164 = normalisePhone({ countryCode: country_code, number: phone_number });
  if (!e164) {
    return res.status(400).json({ error: 'invalid_phone' });
  }

  const supabase = getServiceSupabase();
  const { table, refCol } = tableFor(session.role);

  const { data: row, error: loadErr } = await supabase
    .from(table)
    .select('phone_sms_count, phone_sms_window_start, phone_verified_at, phone_number')
    .eq(refCol, session.ref)
    .single();

  if (loadErr || !row) {
    console.error('[phone/send-otp] account not found', { ref: session.ref, role: session.role, err: loadErr?.message });
    return res.status(404).json({ error: 'account_not_found' });
  }

  // Our own per-account ceiling, kept even though Verify enforces one of its
  // own: theirs is per phone number and ours is what stops a single account
  // burning our balance by re-sending to a different number each time.
  const rl = checkSmsRateLimit({
    count: row.phone_sms_count,
    windowStart: row.phone_sms_window_start,
  });
  if (!rl.allowed) {
    return res.status(429).json({
      error: 'rate_limited',
      retryAfterSec: rl.retryAfterSec,
    });
  }

  // Record the number and the rate-limit window BEFORE sending, so a send we
  // never hear back about still costs a slot. phone_verified_at is untouched
  // here — only verify-otp may set it.
  const update = {
    phone_number: e164,
    phone_country_code: country_code,
    phone_otp_attempts: 0,
    phone_sms_count: rl.nextCount,
    phone_sms_window_start: rl.nextWindowStart.toISOString(),
  };
  // Changing the number drops any previous verification: the badge must never
  // outlive the number it was granted for.
  if (row.phone_number && row.phone_number !== e164) {
    update.phone_verified_at = null;
    update.phone_verified_channel = null;
  }

  const { error: updateErr } = await supabase
    .from(table)
    .update(update)
    .eq(refCol, session.ref);

  if (updateErr) {
    console.error('[phone/send-otp] DB update failed:', updateErr.message);
    return res.status(500).json({ error: 'db_update_failed' });
  }

  if (DEV_BYPASS) {
    console.log(`[phone/send-otp] DEV — no SMS sent to +${e164}; any 6-digit code will verify.`);
    return res.status(200).json({ ok: true, retryAfterSec: 0, expiresInSec: VERIFY_EXPIRY_MS / 1000 });
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_VERIFY_SERVICE_SID) {
    console.error('[phone/send-otp] TWILIO_ACCOUNT_SID / TWILIO_VERIFY_SERVICE_SID not configured');
    return res.status(500).json({ error: 'server_misconfigured' });
  }
  const client = getTwilio();
  if (!client) return res.status(500).json({ error: 'server_misconfigured' });

  const locale = VERIFY_LOCALES.has(language) ? language : 'en';

  try {
    await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: `+${e164}`, channel: 'sms', locale });
  } catch (err) {
    // 60203: Verify's own per-number send ceiling. Ours is per account, so a
    // user switching numbers can reach theirs first — it is a rate limit to
    // the person either way, not a broken number.
    if (err.code === 60203) {
      return res.status(429).json({ error: 'rate_limited', retryAfterSec: 600 });
    }
    // 60200: Verify rejected the number itself. normalisePhone only checks
    // shape, so this is where a well-formed but non-existent number lands.
    if (err.code === 60200) {
      return res.status(400).json({ error: 'invalid_phone' });
    }
    console.error('[phone/send-otp] Verify send failed:', err.message, err.code);
    return res.status(500).json({ error: 'sms_send_failed', detail: err.code });
  }

  return res.status(200).json({
    ok: true,
    retryAfterSec: 0,
    expiresInSec: VERIFY_EXPIRY_MS / 1000,
  });
}
