// POST /api/report-content — Report a profile or conversation.
//
// App Store guideline 1.2 requires a reporting mechanism for user-generated
// content. Reports go straight to the admin inbox (no new DB table needed);
// moderation happens manually from there.

import { getAnySession } from '../../lib/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Light rate limit — reporting is rare; this only stops runaway loops.
const attempts = new Map();
const WINDOW = 15 * 60 * 1000;
const MAX = 10;

function checkRate(key) {
  const now = Date.now();
  const r = attempts.get(key);
  if (!r || now - r.first > WINDOW) {
    attempts.set(key, { count: 1, first: now });
    return true;
  }
  r.count++;
  return r.count <= MAX;
}

const TARGET_TYPES = new Set(['helper', 'employer', 'conversation']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getAnySession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  if (!checkRate(session.ref)) {
    return res.status(429).json({ error: 'Too many reports. Please wait.' });
  }

  const { targetType, targetRef, reason } = req.body || {};
  if (!TARGET_TYPES.has(targetType) || !targetRef || typeof targetRef !== 'string') {
    return res.status(400).json({ error: 'targetType and targetRef required' });
  }

  const cleanReason = typeof reason === 'string' ? reason.slice(0, 1000) : '';

  try {
    if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
      await resend.emails.send({
        from: 'ThaiHelper <noreply@thaihelper.app>',
        to: process.env.ADMIN_EMAIL,
        subject: `🚩 Content report: ${targetType} ${targetRef.slice(0, 40)}`,
        text: [
          'A user reported content on ThaiHelper.',
          '',
          `Reported ${targetType}: ${targetRef.slice(0, 100)}`,
          `Reported by: ${session.role} ${session.ref}`,
          `Reason: ${cleanReason || '(none given)'}`,
          '',
          'Review the profile/conversation and take action if needed.',
        ].join('\n'),
      });
    } else {
      console.log('[report-content] Report (email not configured):', {
        targetType, targetRef, by: session.ref, reason: cleanReason,
      });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Report email failed:', err);
    return res.status(500).json({ error: 'Failed to submit report' });
  }
}
