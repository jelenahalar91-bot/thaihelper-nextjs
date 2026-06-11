// GET /api/auth/magic-login?token=...
//
// Consume a magic-link token issued by POST /api/auth/magic-link.
// On success: set the session cookie (helper or employer based on the
// token's role) and redirect to the appropriate dashboard.
// On failure: redirect to /login with an error query so the page can
// show a friendly message instead of leaking why it failed.

import { getServiceSupabase } from '../../../lib/supabase';
import { createToken, setSessionCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  if (!token || typeof token !== 'string' || token.length < 32) {
    return res.redirect('/login?error=invalid_link');
  }

  const supabase = getServiceSupabase();

  // Mark the token used atomically: we filter on used_at IS NULL and
  // also on expires_at > now, then check `count` from the update. If
  // we got zero rows, the token was already used or expired and we
  // bail without setting a session.
  const now = new Date().toISOString();
  const { data: claimed, error: claimErr } = await supabase
    .from('magic_login_tokens')
    .update({ used_at: now })
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', now)
    .select('role, user_ref, email')
    .single();

  if (claimErr || !claimed) {
    return res.redirect('/login?error=expired_link');
  }

  const { role, user_ref, email } = claimed;

  // Load the up-to-date first_name + verify the account still exists
  // (could have been deleted between issue and click).
  const table = role === 'employer' ? 'employer_accounts' : 'helper_profiles';
  const refCol = role === 'employer' ? 'employer_ref' : 'helper_ref';
  const { data: profile, error: profileErr } = await supabase
    .from(table)
    .select(`${refCol}, first_name, email, email_verified`)
    .eq(refCol, user_ref)
    .single();

  if (profileErr || !profile) {
    return res.redirect('/login?error=account_unavailable');
  }

  if (!profile.email_verified) {
    if (role === 'employer') {
      // Clicking a link that was emailed to this address proves email
      // ownership — exactly what verification checks. Flip the bit so
      // unverified employers (publicly listed since 2026-06-11) have a
      // one-click path back into their account.
      const { error: verifyErr } = await supabase
        .from('employer_accounts')
        .update({
          email_verified: true,
          email_verified_at: new Date().toISOString(),
          verification_token: null,
        })
        .eq('employer_ref', user_ref);
      if (verifyErr) {
        console.error('Magic-login: employer auto-verify failed:', verifyErr.message);
        return res.redirect('/login?error=account_unavailable');
      }
    } else {
      // Helpers still need the explicit verification flow.
      return res.redirect('/login?error=account_unavailable');
    }
  }

  // Issue the same JWT shape the password flow uses.
  const sessionToken = await createToken({
    ref: user_ref,
    email: profile.email,
    firstName: profile.first_name,
    role,
  });
  setSessionCookie(res, sessionToken, role);

  // For helpers, mirror the user_preferences upsert from /api/auth so
  // documents / references work right after a magic-link sign-in.
  if (role === 'helper') {
    try {
      await supabase.from('user_preferences').upsert(
        { helper_ref: user_ref, email: profile.email },
        { onConflict: 'helper_ref' }
      );
    } catch (syncErr) {
      console.error('user_preferences upsert after magic-login failed (non-critical):', syncErr.message);
    }
  }

  const dashboard = role === 'employer' ? '/employer-dashboard' : '/profile';
  return res.redirect(dashboard);
}
