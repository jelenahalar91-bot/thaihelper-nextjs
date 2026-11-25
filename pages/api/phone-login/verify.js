// POST /api/phone-login/verify — check the code and open the session
//
// Body: { phone_number, country_code, code, role?, client? }
//
// Responses:
//   200 { success: true, role, firstName, ref?, token? }
//   400 { error: 'invalid_request' | 'invalid_phone' | 'wrong_code', attemptsLeft? }
//   403 { error: 'account_suspended' }
//   404 { error: 'no_account' }
//   429 { error: 'too_many_attempts' }
//   500 { error: 'server_misconfigured' | 'lookup_failed' }

import { createToken, setSessionCookie } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { normalisePhone, MAX_ATTEMPTS, DEV_BYPASS } from '@/lib/phone-otp';
import { getTwilioVerify } from '@/lib/twilio-verify';
import { accountsWithVerifiedPhone, tableFor } from '@/lib/phone-login';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { phone_number, country_code, code, role, client } = req.body || {};
  if (!phone_number || !country_code || !/^\d{4,8}$/.test(String(code || '').trim())) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const e164 = normalisePhone({ countryCode: country_code, number: phone_number });
  if (!e164) return res.status(400).json({ error: 'invalid_phone' });

  let accounts;
  try {
    accounts = await accountsWithVerifiedPhone(e164);
  } catch (err) {
    console.error('[phone-login/verify]', err.message);
    return res.status(500).json({ error: 'lookup_failed' });
  }

  const live = accounts.filter((a) => a.status !== 'suspended');
  if (accounts.length === 0) return res.status(404).json({ error: 'no_account' });
  if (live.length === 0) return res.status(403).json({ error: 'account_suspended' });

  const chosen = live.length === 1 ? live[0] : live.find((a) => a.role === role);
  if (!chosen) return res.status(400).json({ error: 'invalid_request' });

  const supabase = getServiceSupabase();
  const { table, refCol } = tableFor(chosen.role);

  // Our own attempt counter exists only so the form can say how many guesses
  // are left; Twilio Verify enforces the real ceiling and never tells us what
  // it has left. Same arrangement as pages/api/phone/verify-otp.js.
  const { data: row } = await supabase
    .from(table)
    .select('phone_otp_attempts')
    .eq(refCol, chosen.ref)
    .single();
  const attempts = row?.phone_otp_attempts || 0;
  if (attempts >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'too_many_attempts' });
  }

  let approved = DEV_BYPASS;
  if (!DEV_BYPASS) {
    const verify = getTwilioVerify();
    if (!verify) return res.status(500).json({ error: 'server_misconfigured' });
    try {
      const check = await verify.verificationChecks.create({ to: `+${e164}`, code: String(code).trim() });
      approved = check.status === 'approved';
    } catch (err) {
      // 20404: no pending verification for this number — it expired, or was
      // already used. Both read to the person as "ask for a new code".
      if (err.code === 20404) {
        return res.status(400).json({ error: 'wrong_code', attemptsLeft: MAX_ATTEMPTS - attempts - 1 });
      }
      console.error('[phone-login/verify] Verify check failed:', err.message, err.code);
      return res.status(500).json({ error: 'server_misconfigured' });
    }
  }

  if (!approved) {
    await supabase.from(table).update({ phone_otp_attempts: attempts + 1 }).eq(refCol, chosen.ref);
    return res.status(400).json({ error: 'wrong_code', attemptsLeft: MAX_ATTEMPTS - attempts - 1 });
  }

  const token = await createToken({
    ref: chosen.ref,
    email: chosen.email,
    firstName: chosen.firstName,
    role: chosen.role,
  });
  setSessionCookie(res, token, chosen.role);

  // Reset the guess counter and stamp the login. last_login_at is what keeps
  // a profile listed (INACTIVE_AFTER_DAYS in lib/access.js) — for somebody
  // who got in by SMS because her inbox is out of reach, this is the write
  // that puts her back on the page.
  await supabase
    .from(table)
    .update({ phone_otp_attempts: 0, last_login_at: new Date().toISOString() })
    .eq(refCol, chosen.ref);

  if (chosen.role === 'helper') {
    try {
      await supabase
        .from('user_preferences')
        .upsert({ helper_ref: chosen.ref, email: chosen.email }, { onConflict: 'helper_ref' });
    } catch (syncErr) {
      console.error('user_preferences sync failed (non-critical):', syncErr.message);
    }
  }

  return res.status(200).json({
    success: true,
    role: chosen.role,
    firstName: chosen.firstName,
    // The native app keeps the JWT itself; browsers use the HttpOnly cookie.
    ...(client === 'mobile' ? { token, ref: chosen.ref } : {}),
  });
}
