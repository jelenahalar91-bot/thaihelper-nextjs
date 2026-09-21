// POST   /api/company-auth — Company login (email + password)
// DELETE /api/company-auth — Logout (clear company session cookie)
//
// Unlike helpers/employers (passwordless email + ref), companies use a real
// password they set during onboarding. Login is gated on status 'active'.

import bcrypt from 'bcryptjs';
import { createToken, setSessionCookie, clearSessionCookie } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

// Persistent (Supabase-backed) rate limiting. This used to be an in-memory
// Map, which does not throttle anything on Vercel: each serverless instance
// starts with an empty Map, so an attacker just keeps landing on fresh ones.
// /api/auth and /api/employer-auth were moved off that pattern already; this
// is the platform's only PASSWORD login, so it is the one that most needed it.
// Throttled by IP and by target email, so rotating IPs doesn't buy an
// attacker extra guesses against one account.
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    clearSessionCookie(res, 'company');
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // x-forwarded-for is a comma-separated chain; the client IP is the first
  // entry. Using the whole header as the key let an attacker mint a fresh
  // bucket per request by appending values.
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress || null;
  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit({ bucket: 'company-login-ip', key: ip, max: 30, windowMs: RATE_WINDOW_MS }),
    checkRateLimit({ bucket: 'company-login-email', key: email.trim().toLowerCase(), max: 10, windowMs: RATE_WINDOW_MS }),
  ]);
  if (!ipOk || !emailOk) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }

  try {
    const supabase = getServiceSupabase();
    const { data: account, error } = await supabase
      .from('company_accounts')
      .select('id, company_ref, email, company_name, status, password_hash')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    // Uniform error for not-found / wrong-password / not-active so we don't
    // reveal which accounts exist.
    const invalid = () => res.status(401).json({ error: 'Invalid email or password.' });

    if (error || !account || account.status !== 'active' || !account.password_hash) {
      return invalid();
    }

    const ok = await bcrypt.compare(String(password), account.password_hash);
    if (!ok) return invalid();

    const token = await createToken({
      ref: account.company_ref,
      email: account.email,
      firstName: account.company_name,
      role: 'company',
    });
    setSessionCookie(res, token, 'company');

    return res.status(200).json({
      success: true,
      company: { ref: account.company_ref, name: account.company_name, email: account.email },
    });
  } catch (err) {
    console.error('company-auth error', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
