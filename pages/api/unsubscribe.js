// One-click unsubscribe for message-notification emails.
//
// GET  /api/unsubscribe?t=<token>   → set notify_on_message=false, redirect to /unsubscribe page
// POST /api/unsubscribe  {t, subscribe: true|false}  → flip the flag (used by the /unsubscribe page's "Resubscribe" button)
//
// The token is a signed JWT (see lib/unsubscribe.js) so we can verify the
// user without a session — one-click from the email itself has to work.

import { getServiceSupabase } from '../../lib/supabase';
import { verifyUnsubscribeToken } from '../../lib/unsubscribe';

async function setNotifyFlag(supabase, role, ref, value) {
  const table = role === 'helper' ? 'helper_profiles' : 'employer_accounts';
  const refCol = role === 'helper' ? 'helper_ref' : 'employer_ref';
  const { error } = await supabase
    .from(table)
    .update({ notify_on_message: value })
    .eq(refCol, ref);
  if (error) {
    console.error('Unsubscribe update error:', error);
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  const supabase = getServiceSupabase();

  // ─── GET: one-click unsubscribe from the email ─────────────────────────
  if (req.method === 'GET') {
    const token = req.query.t;
    const payload = await verifyUnsubscribeToken(token);
    if (!payload) {
      return res.redirect(302, '/unsubscribe?status=invalid');
    }
    const ok = await setNotifyFlag(supabase, payload.role, payload.ref, false);
    if (!ok) {
      return res.redirect(302, '/unsubscribe?status=error');
    }
    // Re-issue the same token back to the landing page so the "Resubscribe"
    // button there can flip the flag back without asking for credentials.
    return res.redirect(
      302,
      `/unsubscribe?status=ok&t=${encodeURIComponent(String(token))}`
    );
  }

  // ─── POST: toggle back on (or off again) from the landing page ─────────
  if (req.method === 'POST') {
    const { t, subscribe } = req.body || {};
    const payload = await verifyUnsubscribeToken(t);
    if (!payload) return res.status(400).json({ error: 'invalid_token' });
    const ok = await setNotifyFlag(
      supabase,
      payload.role,
      payload.ref,
      subscribe === true
    );
    if (!ok) return res.status(500).json({ error: 'update_failed' });
    return res.status(200).json({ ok: true, subscribed: subscribe === true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
