// GET /api/helpers — Public helpers browse list
//
// Returns all active helpers WITHOUT contact details (whatsapp, phone, email).
// Contact info is gated behind the paywall and must be fetched separately via
// GET /api/helpers/[ref]/contact (which checks employer access).

import { getServiceSupabase } from '../../lib/supabase';
import { getDisplayAge } from '../../lib/age';
import { maskWpStatusForPublic } from '../../lib/constants/work-permit';

// Map a helper_profiles row to a public-safe card shape.
// IMPORTANT: never expose whatsapp / has_whatsapp / phone / email here.
// `trust` carries presence-only signals derived from related tables
// (uploaded certificate documents, references) — booleans/counts, never
// the underlying content (which stays gated behind the employer paywall).
function toPublicCard(row, trust = {}) {
  return {
    ref: row.helper_ref,
    firstName: row.first_name,
    lastName: row.last_name ? row.last_name.charAt(0) + '.' : '', // only initial
    age: getDisplayAge(row) || null,
    category: row.category || '',
    skills: row.skills || '',
    city: row.city || '',
    area: row.area || '',
    areaEn: row.area_en || '',
    availabilityStatus: row.availability_status || 'available',
    additionalCities: row.additional_cities || '',
    experience: row.experience || '',
    languages: row.languages || '',
    rate: row.rate || '',
    education: row.education || '',
    educationEn: row.education_en || '',
    certificates: row.certificates || '',
    bio: row.bio || '',
    bioEn: row.bio_en || '',
    photo: row.photo_url || '',
    createdAt: row.created_at || null,
    lastActiveAt: row.last_login_at || null,
    ratingAvg: row.rating_avg != null ? Number(row.rating_avg) : null,
    ratingCount: row.rating_count || 0,
    // Signal to the UI whether contact info exists (without revealing it)
    hasWhatsApp: !!row.whatsapp,
    hasEmail: !!row.email,
    // Only positive WP statuses are surfaced publicly. Anything else
    // (in_progress / no_wp / prefer_not_say) is masked to null so it
    // can't leak through the public API.
    wpStatus: maskWpStatusForPublic(row.work_permit_status),
    // Nationality is shown publicly except "prefer_not_say" — that
    // value is the helper's explicit opt-out and must stay private.
    nationality: row.nationality === 'prefer_not_say' ? null : (row.nationality || null),
    // Trust badges — booleans only. The actual phone number is never
    // exposed in the public card; the family sees only "📞 Phone"
    // signalling "we verified this helper's number reaches them".
    phoneVerified: !!row.phone_verified_at,
    lineVerified: !!row.line_linked_at,
    // Quality signals — presence only. "Has uploaded certificates" and
    // "has references" let families see proof-of-qualification at a glance
    // in the browse list; the documents/reference content itself stays
    // behind the employer-only endpoints.
    hasCertificates: !!trust.hasCertificates,
    referenceCount: trust.referenceCount || 0,
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
        'age, date_of_birth, category, skills, city, area, area_en, additional_cities, ' +
        'experience, languages, rate, education, education_en, certificates, bio, bio_en, ' +
        'photo_url, created_at, last_login_at, rating_avg, rating_count, status, ' +
        'availability_status, work_permit_status, nationality, ' +
        'phone_verified_at, line_linked_at'
      )
      .or('status.eq.active,status.is.null')
      .eq('email_verified', true)
      .order('created_at', { ascending: false });

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
      const [{ data: certDocs }, { data: refs }] = await Promise.all([
        supabase.from('documents').select('helper_ref').eq('file_type', 'certificate'),
        supabase.from('helper_references').select('helper_ref'),
      ]);
      for (const d of certDocs || []) certSet.add(d.helper_ref);
      for (const r of refs || []) refCounts.set(r.helper_ref, (refCounts.get(r.helper_ref) || 0) + 1);
    } catch (trustErr) {
      console.warn('Helpers list: trust-signal fetch failed:', trustErr.message);
    }

    const helpers = (data || []).map((row) => toPublicCard(row, {
      hasCertificates: certSet.has(row.helper_ref),
      referenceCount: refCounts.get(row.helper_ref) || 0,
    }));

    // Cache publicly for 60s at the edge — browse list doesn't need to be realtime
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    return res.status(200).json({ helpers, demo: false });
  } catch (err) {
    console.error('Helpers list error:', err);
    return res.status(500).json({ error: 'Failed to load helpers' });
  }
}
