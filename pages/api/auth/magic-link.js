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
import { sendMagicLoginEmail, sendHelperConfirmation } from '../../../lib/send-confirmation-email';
import { verifyTurnstile } from '../../../lib/turnstile';
import { checkRateLimit } from '../../../lib/rate-limit';
import { isSuspended } from '../../../lib/access';

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Per-IP rate limit. 10 magic-link requests per 15 minutes is well
// above any legitimate use (a real user clicks "send link" maybe
// 1-3 times when their email is slow) and tight enough to stop a
// script bombing the endpoint to burn Resend budget or amplify DB
// queries.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, turnstileToken } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Invalid email.' });
  }

  // CAPTCHA — Turnstile keeps simple scripted bots off the endpoint.
  // In production this fails closed if the secret is missing (see
  // lib/turnstile.js); in dev it's permissive so local forms work.
  const captcha = await verifyTurnstile(turnstileToken);
  if (!captcha.success) {
    return res.status(400).json({ error: captcha.error || 'Captcha failed' });
  }

  // Per-IP rate limit — backed by Supabase so the limit actually holds
  // across Vercel cold starts (an in-memory Map resets and is bypassed
  // in seconds). Returns 429 so the client knows it's been limited;
  // caller still sees the generic "we sent a link if the email exists"
  // message so enumeration via 429 vs 200 isn't a useful signal here.
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || null;
  const allowed = await checkRateLimit({
    bucket: 'magic-link',
    key: ip,
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });
  if (!allowed) {
    return res.status(429).json({ error: 'Too many requests. Please wait a few minutes.' });
  }

  const now = Date.now();

  const supabase = getServiceSupabase();

  // Look up in both tables.
  const [helperRes, employerRes] = await Promise.all([
    supabase
      .from('helper_profiles')
      .select('helper_ref, first_name, email, email_verified, status')
      .eq('email', normalizedEmail)
      .maybeSingle(),
    supabase
      .from('employer_accounts')
      .select('employer_ref, first_name, email, email_verified, status')
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
      suspended: isSuspended(helperRes.data),
    });
  }
  if (employerRes.data) {
    targets.push({
      role: 'employer',
      userRef: employerRes.data.employer_ref,
      firstName: employerRes.data.first_name,
      emailVerified: employerRes.data.email_verified,
      suspended: isSuspended(employerRes.data),
    });
  }

  if (targets.length === 0) {
    // Unknown email — return success anyway, do nothing. Anti-enumeration.
    return res.status(200).json({ success: true });
  }

  // Issue a token per matched account and send one email each.
  const expiresAt = new Date(now + TOKEN_TTL_MS).toISOString();

  for (const target of targets) {
    // A suspended account gets NOTHING from this endpoint: no token row, no
    // email, not even the verification resend below. This is the door
    // EMP-3THHAA walked through on 2026-09-13, two days after it was
    // suspended — it asked for a link to its own unchanged address and had a
    // fresh 365-day session sixteen seconds later, because the credential
    // login checked `status` and this endpoint did not.
    //
    // Checked live against the DB, never against lib/suspension.js's cache:
    // a session that was minted here outlives the incident that caused the
    // suspension, so this one must bite on the very next request.
    //
    // The caller still sees the same generic success — telling someone their
    // account is suspended is the moderator's decision, not this endpoint's.
    if (target.suspended) {
      console.warn(`Magic-link refused: ${target.userRef} is suspended.`);
      continue;
    }

    // Helpers must finish email verification before magic-link login.
    // Employers are exempt (since 2026-06-11): clicking a magic link
    // sent to their address proves email ownership — magic-login
    // flips email_verified for them on click.
    if (!target.emailVerified && target.role !== 'employer') {
      // Don't silently do nothing — that leaves the helper staring at a
      // "we sent you an email" screen with no email ever arriving (a dead
      // end). Resend the verification email instead so they have an
      // actionable next step. Still anti-enumeration: the HTTP response is
      // the same generic success either way.
      try {
        const vToken = crypto.randomBytes(32).toString('hex');
        await supabase
          .from('helper_profiles')
          .update({ verification_token: vToken })
          .eq('helper_ref', target.userRef);
        await sendHelperConfirmation({
          firstName: target.firstName,
          email: normalizedEmail,
          ref: target.userRef,
          verificationToken: vToken,
        });
      } catch (resendErr) {
        console.error('Magic-link: verification resend failed:', resendErr.message);
      }
      continue;
    }

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

  return res.status(200).json({ success: true });
}
