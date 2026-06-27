// POST   /api/company-auth — Company login (email + password)
// DELETE /api/company-auth — Logout (clear company session cookie)
//
// Unlike helpers/employers (passwordless email + ref), companies use a real
// password they set during onboarding. Login is gated on status 'active'.

import bcrypt from 'bcryptjs';
import { createToken, setSessionCookie, clearSessionCookie } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';

// Simple in-memory rate limiting (resets on redeploy) — mirrors employer-auth.
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  record.count++;
  return record.count <= MAX_ATTEMPTS;
}

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    clearSessionCookie(res, 'company');
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }

  const { email, password } = req.body || {};
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
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
