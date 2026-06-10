// POST /api/phone/verify-otp
//
// Body: { code: "123456" }
//
// Verifies the 6-digit code sent by /api/phone/send-otp. On success
// sets phone_verified_at and clears the OTP fields. Brute-force
// protected: after MAX_ATTEMPTS wrong submissions the OTP is invalidated
// and the user must request a new one.
//
// Responses:
//   200 { ok: true, verified_at }
//   400 { error: 'invalid_request' | 'no_otp_pending' | 'otp_expired' | 'wrong_code', attemptsLeft? }
//   401 { error: 'unauthorized' }
//   429 { error: 'too_many_attempts' }  → OTP invalidated, request a new one

import { getAnySession } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import {
  verifyOtp,
  MAX_ATTEMPTS,
} from '@/lib/phone-otp';

function tableFor(role) {
  return role === 'employer'
    ? { table: 'employer_accounts', refCol: 'employer_ref' }
    : { table: 'helper_profiles', refCol: 'helper_ref' };
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
    .select('phone_otp_hash, phone_otp_expires_at, phone_otp_attempts, phone_number, phone_country_code')
    .eq(refCol, session.ref)
    .single();

  if (loadErr || !row) {
    return res.status(404).json({ error: 'account_not_found' });
  }

  if (!row.phone_otp_hash || !row.phone_otp_expires_at) {
    return res.status(400).json({ error: 'no_otp_pending' });
  }

  // Expired? Clear it and tell the user to request a new one.
  if (new Date(row.phone_otp_expires_at).getTime() < Date.now()) {
    await supabase
      .from(table)
      .update({
        phone_otp_hash: null,
        phone_otp_expires_at: null,
        phone_otp_attempts: 0,
      })
      .eq(refCol, session.ref);
    return res.status(400).json({ error: 'otp_expired' });
  }

  // Verify the code (timing-safe).
  const isMatch = verifyOtp({
    submittedCode: code.trim(),
    storedHash: row.phone_otp_hash,
    accountId: session.ref,
  });

  if (!isMatch) {
    const nextAttempts = (row.phone_otp_attempts || 0) + 1;
    const attemptsLeft = Math.max(0, MAX_ATTEMPTS - nextAttempts);

    if (nextAttempts >= MAX_ATTEMPTS) {
      // Brute-force ceiling — kill the OTP, force a resend.
      await supabase
        .from(table)
        .update({
          phone_otp_hash: null,
          phone_otp_expires_at: null,
          phone_otp_attempts: nextAttempts,
        })
        .eq(refCol, session.ref);
      return res.status(429).json({
        error: 'too_many_attempts',
        attemptsLeft: 0,
      });
    }

    await supabase
      .from(table)
      .update({ phone_otp_attempts: nextAttempts })
      .eq(refCol, session.ref);

    return res.status(400).json({
      error: 'wrong_code',
      attemptsLeft,
    });
  }

  // Success — mark the number verified and clear the OTP state.
  const verifiedAt = new Date();
  const { error: updateErr } = await supabase
    .from(table)
    .update({
      phone_verified_at: verifiedAt.toISOString(),
      phone_verified_channel: 'sms',
      phone_otp_hash: null,
      phone_otp_expires_at: null,
      phone_otp_attempts: 0,
    })
    .eq(refCol, session.ref);

  if (updateErr) {
    console.error('[phone/verify-otp] DB update failed:', updateErr.message);
    return res.status(500).json({ error: 'db_update_failed' });
  }

  return res.status(200).json({
    ok: true,
    verified_at: verifiedAt.toISOString(),
  });
}
