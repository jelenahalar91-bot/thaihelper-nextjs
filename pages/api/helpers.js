// GET /api/helpers — Public helpers browse list
//
// Returns all active helpers WITHOUT contact details (whatsapp, phone, email).
// Contact info is gated behind the paywall and must be fetched separately via
// GET /api/helpers/[ref]/contact (which checks employer access).
//
// The card shape itself lives in lib/public-helper-card.js, because the
// server-rendered first page of /helpers builds the same one and the two used
// to be hand-copied.

import { getServiceSupabase, selectAll } from '../../lib/supabase';
import {
  PUBLIC_CARD_COLUMNS,
  toPublicCard,
  isPubliclyVisible,
} from '../../lib/public-helper-card';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceSupabase();
    // Paged: the directory passed 1000 helpers, which is exactly where an
    // unpaginated .select() starts silently dropping the oldest profiles.
    // `id` is the tiebreaker that keeps page boundaries stable when two
    // helpers share a created_at. See selectAll() in lib/supabase.js.
    const { data, error } = await selectAll(() =>
      supabase
        .from('helper_profiles')
        .select(PUBLIC_CARD_COLUMNS)
        .or('status.eq.active,status.is.null')
        .eq('email_verified', true)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
    );

    if (error) {
      console.error('Helpers list error:', error);
      return res.status(500).json({ error: 'Failed to load helpers' });
    }

    // Pull presence-only trust signals from related tables in two cheap
    // ref-only queries, then fold them into each card. Failures here are
    // non-fatal — the list still renders, just without the badges.
    const certSet = new Set();
    const refCounts = new Map();
    try {
      // Paged for the same reason as the profile query above. These two are
      // still well short of 1000 rows, but they grow with every upload — and
      // truncation here is invisible: the page renders fine, just with trust
      // badges quietly missing from the oldest helpers.
      const [
        { data: certDocs, error: certErr },
        { data: refs, error: refErr },
      ] = await Promise.all([
        selectAll(() =>
          supabase
            .from('documents')
            .select('helper_ref')
            .eq('file_type', 'certificate')
            .order('id', { ascending: true })
        ),
        selectAll(() =>
          supabase
            .from('helper_references')
            .select('helper_ref')
            .order('id', { ascending: true })
        ),
      ]);
      if (certErr || refErr) {
        console.warn(
          'Helpers list: trust-signal fetch failed:',
          (certErr || refErr).message
        );
      }
      for (const d of certDocs || []) certSet.add(d.helper_ref);
      for (const r of refs || []) refCounts.set(r.helper_ref, (refCounts.get(r.helper_ref) || 0) + 1);
    } catch (trustErr) {
      console.warn('Helpers list: trust-signal fetch failed:', trustErr.message);
    }

    const helpers = (data || [])
      .filter(isPubliclyVisible)
      .map((row) => toPublicCard(row, {
        hasCertificates: certSet.has(row.helper_ref),
        referenceCount: refCounts.get(row.helper_ref) || 0,
      }));

    // Cache publicly at the edge. Safe to share between everyone: this route
    // reads no session and takes no query params, so every caller gets the
    // same bytes.
    //
    // 5 minutes, not the 60s this used to ask for. This is the heaviest
    // response on the site — three DB queries and ~1.37 MB of JSON, built on
    // every browse-page load and every mobile app start — so the window is
    // what decides how often that work happens. A helper who registered four
    // minutes ago showing up a minute late costs nobody anything;
    // /api/recent-helpers is the one with a real freshness claim ("Recently
    // joined") and it keeps its shorter window.
    //
    // stale-while-revalidate means nobody ever waits for the rebuild: the
    // stale copy goes out immediately while the refresh happens behind it.
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return res.status(200).json({ helpers, demo: false });
  } catch (err) {
    console.error('Helpers list error:', err);
    return res.status(500).json({ error: 'Failed to load helpers' });
  }
}
