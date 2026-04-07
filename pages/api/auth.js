// POST /api/auth — Login (verify email + ref against Supabase)
// DELETE /api/auth — Logout (clear session cookie)

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
    clearSessionCookie(res);
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

    // Look up helper in Supabase
    const { data: profile, error } = await supabase
      .from('helper_profiles')
      .select('helper_ref, email, first_name')
      .eq('email', email.trim().toLowerCase())
      .eq('helper_ref', ref.trim().toUpperCase())
      .single();

    if (error || !profile) {
      console.log('Auth lookup: not found', { email: email.trim().toLowerCase(), ref: ref.trim().toUpperCase() });
      return res.status(401).json({ error: 'Invalid email or reference number.' });
    }

    // Create JWT session token
    const token = await createToken({
      ref: profile.helper_ref,
      email: profile.email,
      firstName: profile.first_name,
    });

    setSessionCookie(res, token);

    // Ensure user_preferences exists (for documents, references, etc.)
    try {
      await supabase.from('user_preferences').upsert(
        { helper_ref: profile.helper_ref, email: profile.email },
        { onConflict: 'helper_ref' }
      );
    } catch (syncErr) {
      console.error('Supabase user sync failed (non-critical):', syncErr.message);
    }

    return res.status(200).json({
      success: true,
      firstName: profile.first_name,
    });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
