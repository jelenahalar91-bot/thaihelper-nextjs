// POST /api/phone/verify-otp
//
// Body: { code: "123456" }
//
// Checks the code against Twilio Verify and, on approval, marks the number
// verified. See the header of send-otp.js for why Verify replaced our own
// hashed-OTP flow.
//
// Twilio owns correctness here — it ages the code out and enforces its own
// brute-force ceiling, and we never see the code. We still count wrong
// guesses locally, for one reason only: Verify does not report how many
// attempts remain, and the card shows the user that number.
//
// Responses:
//   200 { ok: true, verified_at }
//   400 { error: 'invalid_request' | 'otp_expired' | 'wrong_code', attemptsLeft? }
//   409 { error: 'phone_in_use' | 'phone_blocked' }
//   401 { error: 'unauthorized' }
//   429 { error: 'too_many_attempts' }

import { getAnySession } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { MAX_ATTEMPTS, DEV_BYPASS } from '@/lib/phone-otp';
import { numberTakenBy } from '@/lib/phone-identity';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

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
    console.error('[phone/verify-otp] twilio package not installed:', err.message);
    return null;
  }
}

async function markVerified(supabase, table, refCol, ref) {
  const verifiedAt = new Date();
  const { error } = await supabase
    .from(table)
    .update({
      phone_verified_at: verifiedAt.toISOString(),
      phone_verified_channel: 'sms',
      phone_otp_attempts: 0,
    })
    .eq(refCol, ref);
  return { verifiedAt, error };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const session = await getAnySession(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  const { code } = req.body || {};
  if (!code || typeof code !== 'string' || !/^\d{4,8}$/.test(code)) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const supabase = getServiceSupabase();
  const { table, refCol } = tableFor(session.role);

  const { data: row, error: loadErr } = await supabase
    .from(table)
    .select('phone_number, phone_country_code, phone_otp_attempts')
    .eq(refCol, session.ref)
    .single();

  if (loadErr || !row) {
    return res.status(404).json({ error: 'account_not_found' });
  }
  // No number on file means send-otp was never called, or the row was reset
  // between the two calls. Either way there is nothing to check against.
  if (!row.phone_number) {
    return res.status(400).json({ error: 'otp_expired' });
  }

  // Re-checked here, not just in send-otp: two accounts can both pass that
  // check and race to confirm the same number. This is the one that decides,
  // because it is the step that grants the badge.
  const owner = await numberTakenBy(supabase, row.phone_number, session.ref);
  if (owner.taken) {
    console.warn(`[phone/verify-otp] ${session.ref} blocked: number belongs to ${owner.ref}`);
    return res.status(409).json({
      error: owner.suspended ? 'phone_blocked' : 'phone_in_use',
    });
  }

  if (DEV_BYPASS) {
    console.log(`[phone/verify-otp] DEV — accepting ${code} for +${row.phone_number} without Twilio.`);
    const { verifiedAt, error } = await markVerified(supabase, table, refCol, session.ref);
    if (error) return res.status(500).json({ error: 'db_update_failed' });
    return res.status(200).json({ ok: true, verified_at: verifiedAt.toISOString() });
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_VERIFY_SERVICE_SID) {
    console.error('[phone/verify-otp] TWILIO_ACCOUNT_SID / TWILIO_VERIFY_SERVICE_SID not configured');
    return res.status(500).json({ error: 'server_misconfigured' });
  }
  const client = getTwilio();
  if (!client) return res.status(500).json({ error: 'server_misconfigured' });

  let check;
  try {
    check = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: `+${row.phone_number}`, code: code.trim() });
  } catch (err) {
    // 20404: no verification is pending for this number — it expired, or it
    // was already approved. 60202: Verify's own wrong-guess ceiling.
    if (err.code === 20404) {
      return res.status(400).json({ error: 'otp_expired' });
    }
    if (err.code === 60202) {
      return res.status(429).json({ error: 'too_many_attempts', attemptsLeft: 0 });
    }
    console.error('[phone/verify-otp] Verify check failed:', err.message, err.code);
    return res.status(500).json({ error: 'verify_failed', detail: err.code });
  }

  // Anything other than an explicit approval is a wrong code. Checking the
  // status rather than `valid` on purpose: an unexpected status must fall on
  // the deny side, not sail past a truthy check.
  if (check.status !== 'approved') {
    const nextAttempts = (row.phone_otp_attempts || 0) + 1;
    const attemptsLeft = Math.max(0, MAX_ATTEMPTS - nextAttempts);
    await supabase
      .from(table)
      .update({ phone_otp_attempts: nextAttempts })
      .eq(refCol, session.ref);

    if (attemptsLeft === 0) {
      return res.status(429).json({ error: 'too_many_attempts', attemptsLeft: 0 });
    }
    return res.status(400).json({ error: 'wrong_code', attemptsLeft });
  }

  const { verifiedAt, error: updateErr } = await markVerified(supabase, table, refCol, session.ref);
  if (updateErr) {
    console.error('[phone/verify-otp] DB update failed:', updateErr.message);
    return res.status(500).json({ error: 'db_update_failed' });
  }

  return res.status(200).json({
    ok: true,
    verified_at: verifiedAt.toISOString(),
  });
}
