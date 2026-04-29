// GET    /api/favorites                   → list favorite helper_refs for current employer
// GET    /api/favorites?full=1             → list with full helper profile data
// POST   /api/favorites  { helper_ref }    → add a favorite
// DELETE /api/favorites?helper_ref=TH-XXX  → remove a favorite
//
// Employer-only. Requires th_emp_session cookie.

import { getEmployerSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import { getDisplayAge } from '../../lib/age';

export default async function handler(req, res) {
  const session = await getEmployerSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const employer_ref = session.ref;

  // ─── GET: list favorites ─────────────────────────────────────────────
  if (req.method === 'GET') {
    const full = req.query.full === '1' || req.query.full === 'true';

    const { data: favs, error } = await supabase
      .from('helper_favorites')
      .select('helper_ref, created_at')
      .eq('employer_ref', employer_ref)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Favorites list error:', error);
      return res.status(500).json({ error: 'Failed to load favorites' });
    }

    if (!full) {
      return res.status(200).json({
        favorites: (favs || []).map(f => f.helper_ref),
      });
    }

    // Full mode: enrich with helper profile data
    const refs = (favs || []).map(f => f.helper_ref);
    if (refs.length === 0) return res.status(200).json({ favorites: [] });

    const { data: helpers } = await supabase
      .from('helper_profiles')
      .select(
        'helper_ref, first_name, last_name, age, date_of_birth, category, skills, city, area, ' +
        'experience, languages, rate, bio, bio_en, photo_url, email_verified, status'
      )
      .in('helper_ref', refs)
      .or('status.eq.active,status.is.null')
      .eq('email_verified', true);

    const helpersByRef = Object.fromEntries((helpers || []).map(h => [h.helper_ref, h]));
    const enriched = refs
      .map(ref => {
        const h = helpersByRef[ref];
        if (!h) return null;
        return {
          ref: h.helper_ref,
          firstName: h.first_name,
          lastName: h.last_name ? h.last_name.charAt(0) + '.' : '',
          age: getDisplayAge(h) || null,
          category: h.category || '',
          skills: h.skills || '',
          city: h.city || '',
          area: h.area || '',
          experience: h.experience || '',
          languages: h.languages || '',
          rate: h.rate || '',
          bio: h.bio || '',
          bioEn: h.bio_en || '',
          photo: h.photo_url || '',
        };
      })
      .filter(Boolean);

    return res.status(200).json({ favorites: enriched });
  }

  // ─── POST: add a favorite ────────────────────────────────────────────
  if (req.method === 'POST') {
    const { helper_ref } = req.body || {};
    if (!helper_ref || typeof helper_ref !== 'string') {
      return res.status(400).json({ error: 'helper_ref required' });
    }

    // Upsert (ignore duplicates thanks to UNIQUE constraint)
    const { error } = await supabase
      .from('helper_favorites')
      .upsert(
        { employer_ref, helper_ref: helper_ref.trim().toUpperCase() },
        { onConflict: 'employer_ref,helper_ref', ignoreDuplicates: true }
      );

    if (error) {
      console.error('Favorites add error:', error);
      return res.status(500).json({ error: 'Failed to add favorite' });
    }
    return res.status(200).json({ ok: true });
  }

  // ─── DELETE: remove a favorite ───────────────────────────────────────
  if (req.method === 'DELETE') {
    const helper_ref = req.query.helper_ref;
    if (!helper_ref) return res.status(400).json({ error: 'helper_ref required' });

    const { error } = await supabase
      .from('helper_favorites')
      .delete()
      .eq('employer_ref', employer_ref)
      .eq('helper_ref', String(helper_ref).trim().toUpperCase());

    if (error) {
      console.error('Favorites delete error:', error);
      return res.status(500).json({ error: 'Failed to remove favorite' });
    }
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
