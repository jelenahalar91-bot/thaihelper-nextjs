// POST /api/phone/send-otp
//
// Body:
//   { phone_number: "0891234567", country_code: "+66", language?: "en"|"th" }
//
// Sends a 6-digit verification code to the requested phone via Twilio,
// stores its hash on the caller's account row, and starts a 10-minute
// expiry. Works for both helpers (th_session cookie) and employers
// (th_emp_session cookie).
//
// Responses:
//   200 { ok: true, retryAfterSec: 0 }          → SMS dispatched
//   429 { error: 'rate_limited', retryAfterSec } → too many SMS this hour
//   400 { error: 'invalid_phone' | 'invalid_request' }
//   401 { error: 'unauthorized' }                → no session
//   500 { error: 'sms_send_failed' }             → Twilio rejected
//
// Dev mode: if PHONE_OTP_DEV_LOG=true OR Twilio creds are missing,
// the code is logged to the server console instead of sent. Useful
// for local testing before you have a Twilio account.

import { getAnySession } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import {
  generateOtp,
  hashOtp,
  normalisePhone,
  buildSmsBody,
  checkSmsRateLimit,
  OTP_EXPIRY_MS,
} from '@/lib/phone-otp';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const DEV_LOG = process.env.PHONE_OTP_DEV_LOG === 'true';

// ─── Table mapping ──────────────────────────────────────────────────

// Helpers live in helper_profiles (PK column 'helper_ref').
// Employers live in employer_accounts (PK column 'employer_ref').
function tableFor(role) {
  return role === 'employer'
    ? { table: 'employer_accounts', refCol: 'employer_ref' }
    : { table: 'helper_profiles', refCol: 'helper_ref' };
}

// ─── Twilio client (lazy-loaded so the route doesn't crash if the
//     package isn't installed yet) ────────────────────────────────────

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

async function sendSms({ to, body }) {
  // Dev-mode: skip Twilio, log to console. Lets you build and test
  // the entire flow before a Twilio account is set up.
  if (DEV_LOG || !TWILIO_ACCOUNT_SID) {
    console.log(`[phone/send-otp] DEV — would send to ${to}: ${body}`);
    return { sid: 'DEV-DRYRUN' };
  }

  const client = getTwilio();
  if (!client) {
    throw new Error('twilio_client_unavailable');
  }
  if (!TWILIO_FROM_NUMBER) {
    throw new Error('TWILIO_PHONE_NUMBER env var is missing');
  }

  return client.messages.create({
    to: to.startsWith('+') ? to : `+${to}`,
    from: TWILIO_FROM_NUMBER,
    body,
  });
}

// ─── Handler ────────────────────────────────────────────────────────

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

  // Load current rate-limit + verification state.
  const { data: row, error: loadErr } = await supabase
    .from(table)
    .select('phone_sms_count, phone_sms_window_start, phone_verified_at, phone_number')
    .eq(refCol, session.ref)
    .single();

  if (loadErr || !row) {
    console.error('[phone/send-otp] account not found', { ref: session.ref, role: session.role, err: loadErr?.message });
    return res.status(404).json({ error: 'account_not_found' });
  }

  // Rate-limit check (per account / per phone).
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

  // Generate + hash OTP. Salt is account ref + server secret (see lib/phone-otp.js).
  const code = generateOtp();
  let otpHash;
  try {
    otpHash = hashOtp({ code, accountId: session.ref });
  } catch (err) {
    console.error('[phone/send-otp] hash failed:', err.message);
    return res.status(500).json({ error: 'server_misconfigured' });
  }

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  // Persist the pending OTP + rate-limit window update.
  // We DON'T mark phone_verified_at here — that happens only after
  // verify-otp succeeds. We DO clear any previous verified state so
  // changing the number requires re-verification.
  const update = {
    phone_number: e164,
    phone_country_code: country_code,
    phone_otp_hash: otpHash,
    phone_otp_expires_at: expiresAt.toISOString(),
    phone_otp_attempts: 0,
    phone_sms_count: rl.nextCount,
    phone_sms_window_start: rl.nextWindowStart.toISOString(),
  };
  // If the user changed their number, drop the old verification.
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

  // Send the SMS. Failures here surface to the user but the OTP is
  // still stored — they can request a resend without consuming a new
  // rate-limit slot if it's a transient network problem.
  try {
    await sendSms({
      to: e164,
      body: buildSmsBody({ code, lang: language === 'th' ? 'th' : 'en' }),
    });
  } catch (err) {
    console.error('[phone/send-otp] Twilio send failed:', err.message, err.code);
    return res.status(500).json({ error: 'sms_send_failed', detail: err.code });
  }

  return res.status(200).json({
    ok: true,
    retryAfterSec: 0,
    // Tells the UI how long the user has to enter the code.
    expiresInSec: OTP_EXPIRY_MS / 1000,
  });
}
