// POST /api/directory/[id]/click
//
// Tracks when a user actually clicks a directory listing's website,
// phone, or email link. We separate views (loaded the listing) from
// clicks (took action) because the latter is the metric we'll quote
// to lawyers / agencies when pitching paid tiers.
//
// No auth — anonymous tracking. The listing id (UUID) is treated as a
// public identifier; the only side effect is a counter increment.

import { getServiceSupabase } from '../../../../lib/supabase';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (typeof id !== 'string' || !UUID_RE.test(id)) {
    return res.status(400).json({ error: 'Invalid listing id' });
  }

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase.rpc('increment_click_count', { p_listing_id: id });
    if (error) {
      console.warn('click count RPC failed:', error.message);
      // Tracking is best-effort — never block the user.
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Directory click handler error:', err);
    return res.status(200).json({ ok: true });
  }
}
