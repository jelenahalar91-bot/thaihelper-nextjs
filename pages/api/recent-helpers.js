// GET /api/recent-helpers
//
// Returns the 4 most recent verified helper signups for the homepage
// "Recently joined" panel. Returns only public-safe fields (first name,
// last initial, category, city, photo, timestamp) — no email, phone, ref.

import { getServiceSupabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('helper_profiles')
      .select('first_name, last_name, category, city, photo_url, created_at')
      .or('status.eq.active,status.is.null')
      .eq('email_verified', true)
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) {
      console.error('recent-helpers query error:', error);
      return res.status(500).json({ error: 'Failed to load recent helpers' });
    }

    const helpers = (data || []).map((row) => ({
      firstName: row.first_name || '',
      lastInitial: row.last_name ? row.last_name.charAt(0) + '.' : '',
      category: row.category || '',
      city: row.city || '',
      photo: row.photo_url || null,
      createdAt: row.created_at || null,
    }));

    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    return res.status(200).json({ helpers });
  } catch (err) {
    console.error('recent-helpers handler error:', err);
    return res.status(500).json({ error: 'Failed to load recent helpers' });
  }
}
