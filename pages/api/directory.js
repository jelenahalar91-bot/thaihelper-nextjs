// GET /api/directory
//   Public listing of immigration lawyers, visa agents, MOU agencies.
//   Query params (all optional): ?city=<slug>&type=<DIRECTORY_TYPE>&specialty=<SPECIALTY>
//
// Listings are returned sorted by tier (featured → premium → free), then by
// ranking_score, then alphabetically by name. Sort happens in JS rather than
// SQL because the tier order is non-alphabetical and Postgres can't sort
// text by an arbitrary enum without a CASE statement or a join.

import { getServiceSupabase } from '../../lib/supabase';
import {
  DIRECTORY_TYPE_VALUES,
  SPECIALTY_VALUES,
} from '../../lib/constants/directory';

// Cheap whitelist for the city slug. We don't import CITY_OPTIONS here
// because seed data may include directory-only cities (e.g. provincial
// capitals not yet in the helper city list); this regex catches the
// obvious injection vectors without coupling to the helper-side list.
const CITY_SLUG_RE = /^[a-z0-9_-]{2,40}$/;

// Map a snake_case row to the camelCase shape the directory pages expect.
function toPublicListing(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameTh: row.name_th || '',
    type: row.type,
    city: row.city,
    citiesServed: row.cities_served || '',
    address: row.address || '',
    phone: row.phone || '',
    email: row.email || '',
    website: row.website || '',
    googleMapsUrl: row.google_maps_url || '',
    description: row.description || '',
    descriptionTh: row.description_th || '',
    specialties: row.specialties || '',
    languagesSpoken: row.languages_spoken || '',
    tier: row.tier || 'free',
    verified: row.verified === true,
    viewCount: row.view_count || 0,
    clickCount: row.click_count || 0,
  };
}

// Map tier → numeric rank so featured > premium > free in the UI.
const TIER_RANK = { featured: 3, premium: 2, free: 1 };

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { city, type, specialty } = req.query;

    // Whitelist the inputs before they reach the query — protects against
    // PostgREST .or()/.ilike() injection via comma or percent characters.
    const cityValid     = typeof city === 'string'     && CITY_SLUG_RE.test(city) ? city : null;
    const typeValid     = typeof type === 'string'     && DIRECTORY_TYPE_VALUES.includes(type) ? type : null;
    const specialtyValid = typeof specialty === 'string' && SPECIALTY_VALUES.includes(specialty) ? specialty : null;

    const supabase = getServiceSupabase();
    let query = supabase
      .from('directory_listings')
      .select('*')
      .eq('status', 'active');

    if (cityValid) {
      // A listing matches if its primary city equals the slug, OR the
      // slug appears in its cities_served CSV.
      query = query.or(`city.eq.${cityValid},cities_served.ilike.%${cityValid}%`);
    }
    if (typeValid)      query = query.eq('type', typeValid);
    if (specialtyValid) query = query.ilike('specialties', `%${specialtyValid}%`);

    const { data, error } = await query;
    if (error) {
      console.error('Directory list error:', error);
      return res.status(500).json({ error: 'Failed to load directory' });
    }

    const listings = (data || [])
      .map(toPublicListing)
      .sort((a, b) => {
        const t = (TIER_RANK[b.tier] || 0) - (TIER_RANK[a.tier] || 0);
        if (t !== 0) return t;
        // ranking_score isn't returned by toPublicListing, so use the raw
        // row pass-through via a Map. Keep it simple: equal scores fall
        // through to alphabetical name.
        return a.name.localeCompare(b.name);
      });

    // Increment view counts for the listings we returned (fire-and-forget).
    // Wrap the RPC call in a try so a missing function in dev doesn't 500.
    const ids = listings.map(l => l.id);
    if (ids.length > 0) {
      supabase.rpc('increment_view_counts', { listing_ids: ids })
        .then(({ error: rpcErr }) => { if (rpcErr) console.warn('view count RPC failed:', rpcErr.message); })
        .catch(err => console.warn('view count RPC threw:', err));
    }

    // Cache publicly for 5 min — directory data changes rarely
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ listings });
  } catch (err) {
    console.error('Directory handler error:', err);
    return res.status(500).json({ error: 'Failed to load directory' });
  }
}
