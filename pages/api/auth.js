// POST /api/auth — Login (verify email + ref against Google Sheet)
// DELETE /api/auth — Logout (clear session cookie)

import { createToken, setSessionCookie, clearSessionCookie } from '../../lib/auth';

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
    const response = await fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'lookup',
        email: email.trim().toLowerCase(),
        ref: ref.trim().toUpperCase(),
      }),
    });

    const result = await response.json();

    if (!result.found) {
      return res.status(401).json({ error: 'Invalid email or reference number.' });
    }

    // Create JWT session token
    const token = await createToken({
      ref: result.data.ref,
      email: result.data.email,
      firstName: result.data.firstName,
    });

    setSessionCookie(res, token);

    return res.status(200).json({
      success: true,
      firstName: result.data.firstName,
    });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
