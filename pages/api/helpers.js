// GET /api/helpers — Public helpers browse list
//
// Returns all active helpers WITHOUT contact details (whatsapp, phone, email).
// Contact info is gated behind the paywall and must be fetched separately via
// GET /api/helpers/[ref]/contact (which checks employer access).

import { getServiceSupabase } from '../../lib/supabase';
import { getDisplayAge } from '../../lib/age';

// Map a helper_profiles row to a public-safe card shape.
// IMPORTANT: never expose whatsapp / has_whatsapp / phone / email here.
function toPublicCard(row) {
  return {
    ref: row.helper_ref,
    firstName: row.first_name,
    lastName: row.last_name ? row.last_name.charAt(0) + '.' : '', // only initial
    age: getDisplayAge(row) || null,
    category: row.category || '',
    skills: row.skills || '',
    city: row.city || '',
    area: row.area || '',
    additionalCities: row.additional_cities || '',
    experience: row.experience || '',
    languages: row.languages || '',
    rate: row.rate || '',
    education: row.education || '',
    certificates: row.certificates || '',
    bio: row.bio || '',
    bioEn: row.bio_en || '',
    photo: row.photo_url || '',
    createdAt: row.created_at || null,
    // Signal to the UI whether contact info exists (without revealing it)
    hasWhatsApp: !!row.whatsapp,
    hasEmail: !!row.email,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('helper_profiles')
      .select(
        'helper_ref, first_name, last_name, email, whatsapp, has_whatsapp, ' +
        'age, date_of_birth, category, skills, city, area, additional_cities, ' +
        'experience, languages, rate, education, certificates, bio, bio_en, ' +
        'photo_url, created_at, status'
      )
      .or('status.eq.active,status.is.null')
      .eq('email_verified', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Helpers list error:', error);
      return res.status(500).json({ error: 'Failed to load helpers' });
    }

    const helpers = (data || []).map(toPublicCard);

    // Cache publicly for 60s at the edge — browse list doesn't need to be realtime
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    return res.status(200).json({ helpers, demo: false });
  } catch (err) {
    console.error('Helpers list error:', err);
    return res.status(500).json({ error: 'Failed to load helpers' });
  }
}
