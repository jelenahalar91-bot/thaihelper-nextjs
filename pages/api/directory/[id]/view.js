// POST /api/directory/[id]/view
//
// Counts one view of a listing's detail page. Until 2026-10-14 view_count
// was bumped only from the list endpoint (/api/directory), which is cached
// at the CDN for five minutes and is not what the detail pages read anyway
// (they are statically generated from Supabase) — so after five months
// every listing stood at 6 views against 20 clicks. The number was
// meaningless, and views are half of the pitch to a paying listing
// ("X people opened your page, Y contacted you").
//
// Same posture as ./click.js: anonymous, best-effort, rate-limited per IP so
// nobody can inflate a listing they are about to be billed on.

import { getServiceSupabase } from '../../../../lib/supabase';
import { checkRateLimit } from '../../../../lib/rate-limit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (typeof id !== 'string' || !UUID_RE.test(id)) {
    return res.status(400).json({ error: 'Invalid listing id' });
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress || null;

  // One person reading the directory opens a handful of pages, not sixty.
  const withinRate = await checkRateLimit({
    bucket: 'directory-view',
    key: clientIp,
    max: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!withinRate) return res.status(200).json({ ok: true });

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase.rpc('increment_view_counts', { listing_ids: [id] });
    if (error) console.warn('view count RPC failed:', error.message);
  } catch (err) {
    console.error('Directory view handler error:', err);
  }
  return res.status(200).json({ ok: true });
}
