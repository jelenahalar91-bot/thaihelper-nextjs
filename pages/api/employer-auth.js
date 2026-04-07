// POST /api/employer-auth — Login (verify email + employer_ref against Supabase)
// DELETE /api/employer-auth — Logout (clear employer session cookie)

import { createToken, setSessionCookie, clearSessionCookie } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';

// Simple rate limiting (in-memory, resets on redeploy)
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
  // Logout
  if (req.method === 'DELETE') {
    clearSessionCookie(res, 'employer');
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }

  const { email, ref } = req.body;

  if (!email?.trim() || !ref?.trim()) {
    return res.status(400).json({ error: 'Email and reference number are required.' });
  }

  try {
    const supabase = getServiceSupabase();

    // Look up employer in Supabase
    const { data: account, error } = await supabase
      .from('employer_accounts')
      .select('employer_ref, email, first_name, last_name, city, preferred_language')
      .eq('email', email.trim().toLowerCase())
      .eq('employer_ref', ref.trim().toUpperCase())
      .single();

    if (error || !account) {
      console.log('Employer auth lookup: not found', {
        email: email.trim().toLowerCase(),
        ref: ref.trim().toUpperCase(),
      });
      return res.status(401).json({ error: 'Invalid email or reference number.' });
    }

    // Create JWT session token (role=employer)
    const token = await createToken({
      ref: account.employer_ref,
      email: account.email,
      firstName: account.first_name,
      role: 'employer',
    });

    setSessionCookie(res, token, 'employer');

    // Update last_login_at (non-blocking)
    supabase
      .from('employer_accounts')
      .update({ last_login_at: new Date().toISOString() })
      .eq('employer_ref', account.employer_ref)
      .then(({ error: updErr }) => {
        if (updErr) console.error('last_login_at update failed:', updErr.message);
      });

    return res.status(200).json({
      success: true,
      firstName: account.first_name,
    });
  } catch (err) {
    console.error('Employer auth error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
