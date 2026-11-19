// GET /api/still-looking?t=<token>
//
// The "Yes, I'm still looking for work" button in the reactivation letter.
// Verifies the signed token (lib/still-looking.js), puts the helper back in
// the directory, and redirects to /still-looking for the confirmation.
//
// WHY last_login_at IS THE THING IT WRITES. The directory does not read a
// flag — hiddenForInactivity() in lib/access.js derives everything from how
// long it has been since we last saw somebody, which is what makes the rule
// impossible to get out of step with. So the only honest way to say "she is
// still here" is to record that we have just seen her. That is not a fiction:
// she read a letter and pressed a button, which is more deliberate than the
// session touch in lib/auth.js that sets the same column for anyone who
// merely has a tab open.
//
// It also clears 'hidden'. Somebody who hid her profile and then pressed a
// button that says she is looking for work has changed her mind, and leaving
// her hidden would make the confirmation page a lie.
//
// Nothing here creates a session. See the note in lib/still-looking.js.

import { getServiceSupabase } from '../../lib/supabase';
import { verifyStillLookingToken } from '../../lib/still-looking';
import { isSuspended } from '../../lib/access';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = await verifyStillLookingToken(req.query.t);
  if (!payload) {
    return res.redirect(302, '/still-looking?status=invalid');
  }

  const supabase = getServiceSupabase();

  const { data: profile, error: readErr } = await supabase
    .from('helper_profiles')
    .select('helper_ref, status, email_verified')
    .eq('helper_ref', payload.ref)
    .maybeSingle();

  if (readErr) {
    console.error('still-looking read failed:', readErr.message);
    return res.redirect(302, '/still-looking?status=error');
  }
  // The account was deleted between the letter going out and the click.
  if (!profile) {
    return res.redirect(302, '/still-looking?status=gone');
  }
  // Suspended since the letter was sent, or suspended all along. Same line
  // /api/auth/magic-login holds: a token already in an inbox must not let a
  // stopped account back into the directory.
  if (isSuspended(profile)) {
    console.warn(`still-looking refused: ${payload.ref} is suspended.`);
    return res.redirect(302, '/still-looking?status=unavailable');
  }

  const { error: updErr } = await supabase
    .from('helper_profiles')
    .update({
      last_login_at: new Date().toISOString(),
      availability_status: 'available',
    })
    .eq('helper_ref', payload.ref);

  if (updErr) {
    console.error('still-looking update failed:', updErr.message);
    return res.redirect(302, '/still-looking?status=error');
  }

  // No ref in the query string — the confirmation page says the same thing to
  // everyone, and her number is in the letter she just came from.
  return res.redirect(302, '/still-looking?status=ok');
}
