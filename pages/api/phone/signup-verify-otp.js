// POST /api/phone/signup-verify-otp
//
// Body: { phone_number, country_code, code }
//
// Checks a code sent by signup-send-otp.js and, on approval, returns the proof
// token that /api/employer-signup requires. No session: the account does not
// exist yet, which is the whole point — see lib/phone-signup-token.js.
//
// The number comes from the body rather than from a row, so it is re-normalised
// here and the proof is minted for the normalised form. A caller who sends a
// different number than they verified simply gets 'wrong_code' from Twilio,
// because Verify is keyed on the number too.
//
// WRONG-GUESS CEILING. The account-side route counts attempts in
// phone_otp_attempts; there is no row to count in. Verify enforces its own
// ceiling and is the real protection, and lib/rate-limit.js backs it with a
// per-number count so a caller cannot work around a single number's Verify
// ceiling by re-sending. Unlike the account-side route this does not report
// attemptsLeft — without a row the number would be a guess, and a wrong count
// on screen is worse than none.
//
// Responses:
//   200 { ok: true, phoneToken, expiresInMin }
//   400 { error: 'invalid_request' | 'invalid_phone' | 'otp_expired' | 'wrong_code' }
//   409 { error: 'phone_in_use' | 'phone_blocked' }
//   429 { error: 'too_many_attempts' }
//   500 { error: 'verify_failed' | 'server_misconfigured' }

import { getServiceSupabase } from '@/lib/supabase';
import { numberTakenBy } from '@/lib/phone-identity';
import { checkRateLimit } from '@/lib/rate-limit';
import { normalisePhone, DEV_BYPASS } from '@/lib/phone-otp';
import { getTwilioVerify } from '@/lib/twilio-verify';
import { createPhoneProof, PHONE_PROOF_TTL_MIN } from '@/lib/phone-signup-token';

const MAX_CHECKS_PER_NUMBER = 8;
const CHECK_WINDOW_MS = 15 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { phone_number, country_code, code } = req.body || {};
  if (!phone_number || !country_code) {
    return res.status(400).json({ error: 'invalid_request' });
  }
  if (!code || typeof code !== 'string' || !/^\d{4,8}$/.test(code.trim())) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const e164 = normalisePhone({ countryCode: country_code, number: phone_number });
  if (!e164) {
    return res.status(400).json({ error: 'invalid_phone' });
  }

  const fresh = await checkRateLimit({
    bucket: 'signup-otp-check',
    key: e164,
    max: MAX_CHECKS_PER_NUMBER,
    windowMs: CHECK_WINDOW_MS,
  });
  if (!fresh) {
    return res.status(429).json({ error: 'too_many_attempts' });
  }

  // The deciding check. Two people can hold a pending verification for the same
  // number, and the earlier check in signup-send-otp cannot see what happened
  // since — so a number claimed in between is refused here, before a proof is
  // minted for it. /api/employer-signup asks once more at insert, because even
  // this one is not the last word.
  const supabase = getServiceSupabase();
  const owner = await numberTakenBy(supabase, e164, null);
  if (owner.taken) {
    console.warn(`[phone/signup-verify-otp] number already held by ${owner.ref}`);
    return res.status(409).json({
      error: owner.suspended ? 'phone_blocked' : 'phone_in_use',
    });
  }

  if (DEV_BYPASS) {
    console.log(`[phone/signup-verify-otp] DEV — accepting ${code} for +${e164} without Twilio.`);
    const phoneToken = await createPhoneProof({ e164, countryCode: country_code });
    return res.status(200).json({ ok: true, phoneToken, expiresInMin: PHONE_PROOF_TTL_MIN });
  }

  const verify = getTwilioVerify();
  if (!verify) return res.status(500).json({ error: 'server_misconfigured' });

  let check;
  try {
    check = await verify.verificationChecks.create({ to: `+${e164}`, code: code.trim() });
  } catch (err) {
    // 20404: nothing pending for this number — expired, or already approved.
    // 60202: Verify's own wrong-guess ceiling.
    if (err.code === 20404) return res.status(400).json({ error: 'otp_expired' });
    if (err.code === 60202) return res.status(429).json({ error: 'too_many_attempts' });
    console.error('[phone/signup-verify-otp] Verify check failed:', err.message, err.code);
    return res.status(500).json({ error: 'verify_failed', detail: err.code });
  }

  // Checking the status rather than a truthy `valid`, so an unexpected status
  // falls on the deny side instead of sailing past.
  if (check.status !== 'approved') {
    return res.status(400).json({ error: 'wrong_code' });
  }

  const phoneToken = await createPhoneProof({ e164, countryCode: country_code });
  return res.status(200).json({ ok: true, phoneToken, expiresInMin: PHONE_PROOF_TTL_MIN });
}
