// POST /api/phone-login/start — send a login code to a verified number
//
// Body: { phone_number, country_code, language?, role? }
//
// Responses:
//   200 { ok: true, role, expiresInSec }
//   300 { error: 'choose_role', roles: ['helper','employer'] }
//   400 { error: 'invalid_request' | 'invalid_phone' }
//   403 { error: 'account_suspended' }
//   404 { error: 'no_account' }
//   429 { error: 'rate_limited', retryAfterSec }
//   500 { error: 'server_misconfigured' | 'sms_send_failed' | 'lookup_failed' }

import { normalisePhone, checkSmsRateLimit, VERIFY_EXPIRY_MS, DEV_BYPASS } from '@/lib/phone-otp';
import { getTwilioVerify, VERIFY_LOCALES } from '@/lib/twilio-verify';
import { accountsWithVerifiedPhone, tableFor } from '@/lib/phone-login';
import { getServiceSupabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { phone_number, country_code, language, role } = req.body || {};
  if (!phone_number || !country_code) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const e164 = normalisePhone({ countryCode: country_code, number: phone_number });
  if (!e164) return res.status(400).json({ error: 'invalid_phone' });

  let accounts;
  try {
    accounts = await accountsWithVerifiedPhone(e164);
  } catch (err) {
    console.error('[phone-login/start]', err.message);
    return res.status(500).json({ error: 'lookup_failed' });
  }

  // "No account with this number", said plainly, rather than the usual
  // pretence that a code went out.
  //
  // Hiding it would tell an attacker nothing he could not already learn, and
  // only for numbers he holds: this confirms a number is registered here, it
  // does not reveal one. Against that, the person it would mislead is a
  // domestic worker on a phone keyboard who mistyped a digit and would wait
  // for an SMS that is never coming, with no way to tell a typo from a
  // forgotten number. Our own 3-per-hour ceiling and Verify's per-number one
  // are the real protection, and both still apply.
  if (accounts.length === 0) return res.status(404).json({ error: 'no_account' });

  const live = accounts.filter((a) => a.status !== 'suspended');
  if (live.length === 0) return res.status(403).json({ error: 'account_suspended' });

  // One number on both a helper and a family account. lib/phone-identity.js
  // has refused this since it shipped, so it can only be a pre-existing row —
  // but a wrong guess here would drop somebody into the wrong dashboard, so
  // ask instead.
  let chosen = live.length === 1 ? live[0] : live.find((a) => a.role === role);
  if (!chosen) {
    return res.status(300).json({ error: 'choose_role', roles: live.map((a) => a.role) });
  }

  const rl = checkSmsRateLimit({ count: chosen.smsCount, windowStart: chosen.smsWindowStart });
  if (!rl.allowed) {
    return res.status(429).json({ error: 'rate_limited', retryAfterSec: rl.retryAfterSec });
  }

  // Spend the slot before sending, so a send we never hear back about still
  // costs one. Mirrors pages/api/phone/send-otp.js.
  const { table, refCol } = tableFor(chosen.role);
  const supabase = getServiceSupabase();
  const { error: updErr } = await supabase
    .from(table)
    .update({
      phone_sms_count: rl.nextCount,
      phone_sms_window_start: rl.nextWindowStart.toISOString(),
      phone_otp_attempts: 0,
    })
    .eq(refCol, chosen.ref);
  if (updErr) {
    console.error('[phone-login/start] DB update failed:', updErr.message);
    return res.status(500).json({ error: 'db_update_failed' });
  }

  if (DEV_BYPASS) {
    console.log(`[phone-login/start] DEV — no SMS to +${e164}; any 6-digit code will do.`);
    return res.status(200).json({ ok: true, role: chosen.role, expiresInSec: VERIFY_EXPIRY_MS / 1000 });
  }

  const verify = getTwilioVerify();
  if (!verify) return res.status(500).json({ error: 'server_misconfigured' });

  const locale = VERIFY_LOCALES.has(language) ? language : 'en';
  try {
    await verify.verifications.create({ to: `+${e164}`, channel: 'sms', locale });
  } catch (err) {
    if (err.code === 60203) return res.status(429).json({ error: 'rate_limited', retryAfterSec: 600 });
    if (err.code === 60200) return res.status(400).json({ error: 'invalid_phone' });
    console.error('[phone-login/start] Verify send failed:', err.message, err.code);
    return res.status(500).json({ error: 'sms_send_failed', detail: err.code });
  }

  return res.status(200).json({ ok: true, role: chosen.role, expiresInSec: VERIFY_EXPIRY_MS / 1000 });
}
