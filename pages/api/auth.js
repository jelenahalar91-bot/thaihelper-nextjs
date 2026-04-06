// POST /api/auth — Login (verify email + ref against Google Sheet)
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

  const SHEET_URL = process.env.GOOGLE_SHEETS_URL;
  if (!SHEET_URL) {
    console.error('GOOGLE_SHEETS_URL not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Call Google Apps Script to look up helper
    const lookupPayload = {
      action: 'lookup',
      email: email.trim().toLowerCase(),
      ref: ref.trim().toUpperCase(),
    };

    const response = await fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lookupPayload),
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    // Google Apps Script sometimes returns HTML redirects instead of JSON
    if (!contentType.includes('application/json') && !rawText.startsWith('{')) {
      console.error('Auth lookup: unexpected response', {
        status: response.status,
        contentType,
        bodyPreview: rawText.substring(0, 200),
        lookup: { email: lookupPayload.email, ref: lookupPayload.ref },
      });
      return res.status(500).json({ error: 'Login service temporarily unavailable. Please try again.' });
    }

    let result;
    try {
      result = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('Auth lookup: JSON parse failed', { rawText: rawText.substring(0, 500) });
      return res.status(500).json({ error: 'Login service error. Please try again.' });
    }

    if (!result.found) {
      console.log('Auth lookup: not found', { email: lookupPayload.email, ref: lookupPayload.ref, result });
      return res.status(401).json({ error: 'Invalid email or reference number.' });
    }

    // Create JWT session token
    const token = await createToken({
      ref: result.data.ref,
      email: result.data.email,
      firstName: result.data.firstName,
    });

    setSessionCookie(res, token);

    // Sync user to Supabase (non-blocking)
    try {
      const supabase = getServiceSupabase();
      await supabase.from('user_preferences').upsert(
        { helper_ref: result.data.ref, email: result.data.email },
        { onConflict: 'helper_ref' }
      );
    } catch (syncErr) {
      console.error('Supabase user sync failed (non-critical):', syncErr.message);
    }

    return res.status(200).json({
      success: true,
      firstName: result.data.firstName,
    });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
