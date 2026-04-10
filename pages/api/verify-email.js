// GET /api/verify-email?token=xxx
// Verifies a helper or employer email address. The token was generated during
// registration and stored in the DB. On success, redirects to a confirmation page.

import { getServiceSupabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || token.length < 20) {
    return res.redirect('/verify?status=invalid');
  }

  const supabase = getServiceSupabase();

  // Try helper_profiles first
  const { data: helper } = await supabase
    .from('helper_profiles')
    .select('helper_ref')
    .eq('verification_token', token)
    .eq('email_verified', false)
    .single();

  if (helper) {
    await supabase
      .from('helper_profiles')
      .update({ email_verified: true, verification_token: null })
      .eq('helper_ref', helper.helper_ref);

    return res.redirect('/verify?status=success&role=helper');
  }

  // Try employer_accounts
  const { data: employer } = await supabase
    .from('employer_accounts')
    .select('employer_ref')
    .eq('verification_token', token)
    .eq('email_verified', false)
    .single();

  if (employer) {
    await supabase
      .from('employer_accounts')
      .update({ email_verified: true, verification_token: null })
      .eq('employer_ref', employer.employer_ref);

    return res.redirect('/verify?status=success&role=employer');
  }

  // Token not found or already used
  return res.redirect('/verify?status=expired');
}
