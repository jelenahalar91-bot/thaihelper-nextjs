// POST /api/auth/magic-link
//
// Request a magic-link login email.
//
// Body: { email: string }
// Response: always 200 { success: true } — even when no account exists.
//          Distinguishing "found" from "not found" would leak which
//          addresses are registered (same anti-enumeration rule as
//          /api/forgot-ref).
//
// If both a helper account AND an employer account exist for the same
// email, we send TWO links — the recipient picks which one to use.
// Each link is single-use and expires after 15 minutes.

import crypto from 'crypto';
import { getServiceSupabase } from '../../../lib/supabase';
import { sendMagicLoginEmail } from '../../../lib/send-confirmation-email';

// In-memory throttle. Per-email cap to limit spam-the-recipient and
// reduce Resend cost burn. On Vercel cold starts this resets, which is
// fine for the small abuse window it leaves open — a proper fix is a
// Supabase table or KV, see the security cleanup list.
const lastSendByEmail = new Map();
const SEND_COOLDOWN_MS = 60 * 1000; // 1 minute between sends to same email
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email.' });
  }

  // Throttle per email — caller cannot tell whether the cap was hit
  // (still returns 200) so this doesn't help enumeration; it just
  // protects mailbox owners from being spammed if someone keys in
  // their address repeatedly.
  const now = Date.now();
  const lastSend = lastSendByEmail.get(normalizedEmail);
  if (lastSend && now - lastSend < SEND_COOLDOWN_MS) {
    return res.status(200).json({ success: true });
  }

  const supabase = getServiceSupabase();

  // Look up in both tables.
  const [helperRes, employerRes] = await Promise.all([
    supabase
      .from('helper_profiles')
      .select('helper_ref, first_name, email, email_verified')
      .eq('email', normalizedEmail)
      .maybeSingle(),
    supabase
      .from('employer_accounts')
      .select('employer_ref, first_name, email, email_verified')
      .eq('email', normalizedEmail)
      .maybeSingle(),
  ]);

  const targets = [];
  if (helperRes.data) {
    targets.push({
      role: 'helper',
      userRef: helperRes.data.helper_ref,
      firstName: helperRes.data.first_name,
      emailVerified: helperRes.data.email_verified,
    });
  }
  if (employerRes.data) {
    targets.push({
      role: 'employer',
      userRef: employerRes.data.employer_ref,
      firstName: employerRes.data.first_name,
      emailVerified: employerRes.data.email_verified,
    });
  }

  if (targets.length === 0) {
    // Unknown email — return success anyway, do nothing. Anti-enumeration.
    return res.status(200).json({ success: true });
  }

  // Issue a token per matched account and send one email each.
  const expiresAt = new Date(now + TOKEN_TTL_MS).toISOString();
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || null;

  for (const target of targets) {
    // Skip accounts whose email isn't verified — they need to finish
    // verification first, magic-link login would otherwise let them in
    // without that step.
    if (!target.emailVerified) continue;

    const token = crypto.randomBytes(32).toString('hex');

    const { error: insertErr } = await supabase
      .from('magic_login_tokens')
      .insert({
        token,
        role: target.role,
        user_ref: target.userRef,
        email: normalizedEmail,
        expires_at: expiresAt,
        ip_address: ip,
      });

    if (insertErr) {
      console.error('Magic-link insert failed:', insertErr);
      continue;
    }

    try {
      await sendMagicLoginEmail({
        firstName: target.firstName,
        email: normalizedEmail,
        role: target.role,
        token,
      });
    } catch (err) {
      console.error('Magic-link email send failed:', err);
      // Don't expose the failure — the user can request another link.
    }
  }

  lastSendByEmail.set(normalizedEmail, now);
  return res.status(200).json({ success: true });
}
