// POST /api/forgot-ref
// Look up a user by email (helper or employer) and resend their reference number.
// Does NOT create a session — the user still has to log in with email + ref.

import { getServiceSupabase } from '../../lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple rate limiting
const attempts = new Map();
const WINDOW = 15 * 60 * 1000;
const MAX = 5;

function checkRate(ip) {
  const now = Date.now();
  const r = attempts.get(ip);
  if (!r || now - r.first > WINDOW) {
    attempts.set(ip, { count: 1, first: now });
    return true;
  }
  r.count++;
  return r.count <= MAX;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRate(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Please wait.' });
  }

  const { email } = req.body;
  if (!email?.trim()) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const supabase = getServiceSupabase();

  // Check both helper and employer tables
  const [helperRes, employerRes] = await Promise.all([
    supabase
      .from('helper_profiles')
      .select('helper_ref, first_name, email')
      .eq('email', normalizedEmail)
      .maybeSingle(),
    supabase
      .from('employer_accounts')
      .select('employer_ref, first_name, email')
      .eq('email', normalizedEmail)
      .maybeSingle(),
  ]);

  const helper = helperRes.data;
  const employer = employerRes.data;

  if (!helper && !employer) {
    return res.status(404).json({ error: 'No account found with this email.' });
  }

  // Build a list of accounts to include in the email
  const accounts = [];
  if (helper) {
    accounts.push({ type: 'Helper', ref: helper.helper_ref, firstName: helper.first_name });
  }
  if (employer) {
    accounts.push({ type: 'Employer', ref: employer.employer_ref, firstName: employer.first_name });
  }

  const firstName = accounts[0].firstName || 'there';

  // Send the email with the reference number(s)
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set — would send ref reminder to', normalizedEmail, accounts);
    return res.status(200).json({ success: true });
  }

  const refRows = accounts.map(a => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#999;width:100px;">${a.type}</td>
      <td style="padding:8px 0;font-size:18px;font-weight:700;color:#001b3d;font-family:monospace;letter-spacing:1px;">${a.ref}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8faf9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:800;color:#1a1a1a;">Thai<span style="color:#006a62;">Helper</span></span>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 8px;">
        Your Reference Number
      </h1>
      <p style="font-size:15px;color:#666;text-align:center;margin:0 0 28px;line-height:1.5;">
        Hi ${firstName}, here is your reference number for logging in:
      </p>

      <div style="background:#f0f2f5;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          ${refRows}
        </table>
      </div>

      <div style="background:#fff8e1;border-left:3px solid #f5a623;border-radius:8px;padding:14px 18px;margin-bottom:28px;">
        <div style="font-size:13px;color:#555;line-height:1.5;">
          Go to <a href="https://thaihelper.app/login" style="color:#001b3d;">thaihelper.app/login</a>
          and enter your email together with the reference number above.
        </div>
      </div>

      <div style="text-align:center;">
        <a href="https://thaihelper.app/login" style="display:inline-block;padding:14px 32px;background:#006a62;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">
          Log In Now
        </a>
      </div>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#aaa;margin:0;">
        ThaiHelper — Connecting families with trusted household staff in Thailand
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: 'ThaiHelper <noreply@thaihelper.app>',
      to: normalizedEmail,
      subject: 'Your ThaiHelper Reference Number',
      html,
    });
  } catch (err) {
    console.error('Failed to send ref reminder email:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  return res.status(200).json({ success: true });
}
