// GET /api/recent-helpers
//
// Returns the 4 most recent verified helper signups + total verified count
// for the homepage "Recently joined" panel. Public-safe fields only (first
// name, last initial, category, city, photo, timestamp) — no email, phone,
// ref. Total count is used for the "80+ helpers registered" stat.

import { getServiceSupabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceSupabase();

    // Optional ?limit=N (1..20) — default 4 for the helpers homepage
    // panel; the families page passes 8 for its 4×2 latest-signups grid.
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, 20)
      : 4;

    const [recentResult, countResult] = await Promise.all([
      supabase
        .from('helper_profiles')
        .select('first_name, last_name, category, city, photo_url, created_at')
        .or('status.eq.active,status.is.null')
        .eq('email_verified', true)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('helper_profiles')
        .select('helper_ref', { count: 'exact', head: true })
        .or('status.eq.active,status.is.null')
        .eq('email_verified', true),
    ]);

    if (recentResult.error) {
      console.error('recent-helpers query error:', recentResult.error);
      return res.status(500).json({ error: 'Failed to load recent helpers' });
    }

    const helpers = (recentResult.data || []).map((row) => ({
      firstName: row.first_name || '',
      lastInitial: row.last_name ? row.last_name.charAt(0) + '.' : '',
      category: row.category || '',
      city: row.city || '',
      photo: row.photo_url || null,
      createdAt: row.created_at || null,
    }));

    // Count failure is non-fatal — frontend has its own fallback
    const count = countResult.error ? null : (countResult.count ?? null);

    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    return res.status(200).json({ helpers, count });
  } catch (err) {
    console.error('recent-helpers handler error:', err);
    return res.status(500).json({ error: 'Failed to load recent helpers' });
  }
}
