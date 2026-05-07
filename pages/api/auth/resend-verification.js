// POST /api/auth/resend-verification
// Re-issues a verification token for the currently logged-in user and re-sends
// the verify email. Works for both helpers and employers (auth via session
// cookie). No body required — we read everything from the session and DB.

import crypto from 'crypto';
import { getAnySession } from '../../../lib/auth';
import { getServiceSupabase } from '../../../lib/supabase';
import {
  sendHelperConfirmation,
  sendEmployerAccountConfirmation,
} from '../../../lib/send-confirmation-email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getAnySession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const isEmployer = session.role === 'employer';
  const table = isEmployer ? 'employer_accounts' : 'helper_profiles';
  const refCol = isEmployer ? 'employer_ref' : 'helper_ref';

  const { data: row } = await supabase
    .from(table)
    .select('first_name, email, city, category, email_verified')
    .eq(refCol, session.ref)
    .single();

  if (!row) return res.status(404).json({ error: 'Account not found' });
  if (row.email_verified) {
    return res.status(400).json({ error: 'already_verified' });
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const { error: updateErr } = await supabase
    .from(table)
    .update({ verification_token: verificationToken })
    .eq(refCol, session.ref);
  if (updateErr) {
    console.error('Resend-verify: token update failed:', updateErr);
    return res.status(500).json({ error: 'Failed to generate token' });
  }

  try {
    if (isEmployer) {
      await sendEmployerAccountConfirmation({
        firstName: row.first_name,
        email: row.email,
        ref: session.ref,
        city: row.city,
        verificationToken,
      });
    } else {
      await sendHelperConfirmation({
        firstName: row.first_name,
        email: row.email,
        ref: session.ref,
        category: row.category,
        city: row.city,
        verificationToken,
      });
    }
  } catch (err) {
    console.error('Resend-verify: email send failed:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  return res.status(200).json({ ok: true });
}
