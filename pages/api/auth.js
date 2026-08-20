// POST /api/auth — Login (verify email + ref against Supabase)
// DELETE /api/auth — Logout (clear session cookie)

import { createToken, setSessionCookie, clearSessionCookie } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import { checkRateLimit } from '../../lib/rate-limit';

const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export default async function handler(req, res) {
  // Logout
  if (req.method === 'DELETE') {
    clearSessionCookie(res);
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, ref, client } = req.body || {};

  if (!email?.trim() || !ref?.trim()) {
    return res.status(400).json({ error: 'Email and reference number are required.' });
  }

  // Persistent (Supabase-backed) rate limiting — an in-memory Map resets per
  // serverless instance, so it doesn't actually throttle on Vercel. Throttle
  // by IP AND by the target email so a distributed attacker can't brute-force
  // one account's ref by rotating IPs.
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress || null;
  const [ipOk, emailOk] = await Promise.all([
    checkRateLimit({ bucket: 'login-ip', key: ip, max: 30, windowMs: RATE_WINDOW_MS }),
    checkRateLimit({ bucket: 'login-email', key: email.trim().toLowerCase(), max: 10, windowMs: RATE_WINDOW_MS }),
  ]);
  if (!ipOk || !emailOk) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
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

    // Update last_login_at (non-blocking) — powers "Last active Xd ago"
    // on public helper cards. Mirrors the employer-auth pattern.
    supabase
      .from('helper_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('helper_ref', profile.helper_ref)
      .then(({ error: updErr }) => {
        if (updErr) console.error('helper last_login_at update failed:', updErr.message);
      });

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
      // The native app stores the JWT itself (SecureStore) — browsers
      // never send client:'mobile' and keep using the HttpOnly cookie.
      ...(client === 'mobile' ? { token, ref: profile.helper_ref } : {}),
    });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
