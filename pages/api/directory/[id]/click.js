// POST /api/directory/[id]/click
//
// Tracks when a user actually clicks a directory listing's website,
// phone, or email link. We separate views (loaded the listing) from
// clicks (took action) because the latter is the metric we'll quote
// to lawyers / agencies when pitching paid tiers.
//
// Body: { cta: 'website' | 'phone' | 'email' | 'details' | 'maps' }
// Source is inferred from the Referer header.
//
// No auth — anonymous tracking. The listing id (UUID) is treated as a
// public identifier; the only side effect is a counter increment + event log.

import { getServiceSupabase } from '../../../../lib/supabase';
import { checkRateLimit } from '../../../../lib/rate-limit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_CTA = ['website', 'phone', 'email', 'details', 'maps'];
const VALID_SOURCE = ['wizard', 'direct', 'hire_page', 'search', 'internal'];

function inferSource(referer) {
  if (!referer) return 'direct';
  if (referer.includes('/work-permit-wizard')) return 'wizard';
  if (referer.includes('/hire/'))              return 'hire_page';
  if (referer.includes('/search'))             return 'search';
  if (referer.includes('/directory'))          return 'direct';
  return 'direct';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (typeof id !== 'string' || !UUID_RE.test(id)) {
    return res.status(400).json({ error: 'Invalid listing id' });
  }

  const { cta } = req.body || {};
  const ctaType = VALID_CTA.includes(cta) ? cta : 'website';
  const source  = inferSource(req.headers.referer || req.headers.referrer || '');

  // Generate a lightweight session id from IP + UA (no cookies needed).
  const clientIp   = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress || null;
  const rawSession = `${req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''}|${req.headers['user-agent'] || ''}`;
  const sessionId  = Buffer.from(rawSession).toString('base64').slice(0, 40);

  // These counters are the numbers we quote to prospective paying listings,
  // so an unbounded insert endpoint is worse than a missing one: it lets
  // anyone inflate a listing's click count. 120/hour per IP is far more than
  // a person browsing the directory produces. Over-limit callers get the same
  // 200 every other failure path returns — the click just isn't recorded.
  const withinRate = await checkRateLimit({
    bucket: 'directory-click',
    key: clientIp,
    max: 120,
    windowMs: 60 * 60 * 1000,
  });
  if (!withinRate) return res.status(200).json({ ok: true });

  try {
    const supabase = getServiceSupabase();

    // 1. Increment the summary counter (existing behaviour).
    const { error: rpcErr } = await supabase.rpc('increment_click_count', { p_listing_id: id });
    if (rpcErr) console.warn('click count RPC failed:', rpcErr.message);

    // 2. Log a detailed event row for per-CTA / per-source analytics.
    const { error: insertErr } = await supabase
      .from('directory_click_events')
      .insert({
        listing_id: id,
        cta_type:   ctaType,
        source,
        session_id: sessionId,
      });
    if (insertErr) console.warn('click event insert failed:', insertErr.message);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Directory click handler error:', err);
    return res.status(200).json({ ok: true });
  }
}
