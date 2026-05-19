// GET /api/verify-email?token=xxx
// Verifies a helper or employer email address. The token was generated during
// registration and stored in the DB. On success, redirects to a confirmation page
// and fires match notifications to the opposite side (existing employers for a
// newly verified helper, existing helpers for a newly verified employer).
// Match emails are best-effort — a failure never breaks verification.

import { getServiceSupabase } from '../../lib/supabase';
import {
  notifyEmployersOfNewHelper,
  notifyHelpersOfNewEmployer,
} from '../../lib/match-notifications';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || token.length < 20) {
    return res.redirect('/verify?status=invalid');
  }

  const supabase = getServiceSupabase();

  // Helpers: atomic UPDATE-then-SELECT so concurrent clicks (e.g. Gmail
  // link prefetch + user click) don't both trip the "still unverified"
  // SELECT and both fire match notifications. The UPDATE filters on
  // email_verified=false, so only the FIRST request actually returns a
  // row — the second sees null and is a no-op.
  const { data: helper } = await supabase
    .from('helper_profiles')
    .update({
      email_verified: true,
      email_verified_at: new Date().toISOString(),
      verification_token: null,
    })
    .eq('verification_token', token)
    .eq('email_verified', false)
    .select('helper_ref, first_name, city, category')
    .maybeSingle();

  if (helper) {
    try {
      await notifyEmployersOfNewHelper(helper);
    } catch (err) {
      console.error('Match notify on helper verification failed (non-critical):', err.message);
    }
    return res.redirect('/verify?status=success&role=helper');
  }

  // Same atomic pattern for employers.
  const { data: employer } = await supabase
    .from('employer_accounts')
    .update({
      email_verified: true,
      email_verified_at: new Date().toISOString(),
      verification_token: null,
    })
    .eq('verification_token', token)
    .eq('email_verified', false)
    .select('employer_ref, first_name, city, looking_for')
    .maybeSingle();

  if (employer) {
    try {
      await notifyHelpersOfNewEmployer(employer);
    } catch (err) {
      console.error('Match notify on employer verification failed (non-critical):', err.message);
    }
    return res.redirect('/verify?status=success&role=employer');
  }

  // Token not found or already used
  return res.redirect('/verify?status=expired');
}
