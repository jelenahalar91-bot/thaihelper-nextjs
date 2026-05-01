// POST /api/line/link — generate a fresh link token for the logged-in user
//
// Returns: {
//   linkToken,        // 8 hex chars, valid 30 minutes
//   linkMessage,      // exact text the user should send to the bot
//   addFriendUrl,     // https://line.me/R/ti/p/@... — embed in QR
//   alreadyLinked,    // true if the user already has line_user_id set
// }
//
// Used:
//   - by the post-registration success screen, when the user opted in
//   - by the dashboard "Reconnect LINE" button, if the user wants to relink

import { getAnySession } from '../../../lib/auth';
import { getServiceSupabase } from '../../../lib/supabase';
import {
  generateLinkToken,
  buildLinkMessage,
  getAddFriendUrl,
} from '../../../lib/line';

const LINK_TTL_MS = 30 * 60 * 1000; // 30 minutes

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getAnySession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const table  = session.role === 'helper' ? 'helper_profiles' : 'employer_accounts';
  const refCol = session.role === 'helper' ? 'helper_ref'      : 'employer_ref';

  const supabase = getServiceSupabase();

  // If the user is already linked, surface that — caller can decide to
  // show "already connected" UI instead of the QR.
  const { data: existing, error: readErr } = await supabase
    .from(table)
    .select('line_user_id')
    .eq(refCol, session.ref)
    .single();

  if (readErr) {
    console.error('[line/link] lookup failed:', readErr);
    return res.status(500).json({ error: 'Lookup failed' });
  }

  if (existing?.line_user_id) {
    return res.status(200).json({ alreadyLinked: true });
  }

  // Issue a fresh token, overwriting any previous one (and its expiry).
  const linkToken   = generateLinkToken();
  const linkExpires = new Date(Date.now() + LINK_TTL_MS).toISOString();

  const { error: updErr } = await supabase
    .from(table)
    .update({
      line_link_token:   linkToken,
      line_link_expires: linkExpires,
      // mark intent in case they hit /api/line/link without having checked
      // the box at registration (e.g. via the dashboard "Connect LINE" CTA)
      notify_via_line: true,
    })
    .eq(refCol, session.ref);

  if (updErr) {
    console.error('[line/link] update failed:', updErr);
    return res.status(500).json({ error: 'Failed to issue token' });
  }

  return res.status(200).json({
    linkToken,
    linkMessage:  buildLinkMessage(linkToken),
    addFriendUrl: getAddFriendUrl(),
    alreadyLinked: false,
  });
}
