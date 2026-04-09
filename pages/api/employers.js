// GET /api/employers — Public employer browse list
//
// Returns employers from both employer_accounts (full accounts) and
// employer_registrations (leads). Strips sensitive info (email, phone).
// Shape mirrors /api/helpers for consistency.

import { getServiceSupabase } from '../../lib/supabase';

function toPublicCard(row, source) {
  return {
    ref: row.employer_ref || null,
    firstName: row.first_name || '',
    lastName: row.last_name ? row.last_name.charAt(0) + '.' : '',
    city: row.city || '',
    area: row.area || '',
    lookingFor: row.looking_for || row.helper_types || '',
    jobDescription: row.job_description || '',
    arrangementPreference: row.arrangement_preference || null,
    preferredAgeRange: row.preferred_age_range || null,
    source, // 'account' | 'registration'
    createdAt: row.created_at || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceSupabase();

    // Fetch full accounts
    const { data: accounts, error: accErr } = await supabase
      .from('employer_accounts')
      .select(
        'employer_ref, first_name, last_name, city, area, ' +
        'looking_for, arrangement_preference, preferred_age_range, ' +
        'job_description, created_at'
      )
      .order('created_at', { ascending: false });

    if (accErr) {
      console.error('Employer accounts list error:', accErr);
      return res.status(500).json({ error: 'Failed to load employers' });
    }

    // Fetch registrations (leads)
    const { data: regs, error: regErr } = await supabase
      .from('employer_registrations')
      .select(
        'first_name, last_name, city, area, helper_types, created_at'
      )
      .order('created_at', { ascending: false });

    if (regErr) {
      console.error('Employer registrations list error:', regErr);
      return res.status(500).json({ error: 'Failed to load employers' });
    }

    // Deduplicate: if an account exists for the same name+city, skip the registration
    const accountKeys = new Set(
      (accounts || []).map(a =>
        `${(a.first_name || '').toLowerCase()}|${(a.city || '').toLowerCase()}`
      )
    );

    const accountCards = (accounts || []).map(a => toPublicCard(a, 'account'));
    const regCards = (regs || [])
      .filter(r => !accountKeys.has(
        `${(r.first_name || '').toLowerCase()}|${(r.city || '').toLowerCase()}`
      ))
      .map(r => toPublicCard(r, 'registration'));

    // Merge and sort by createdAt descending
    const employers = [...accountCards, ...regCards]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ employers });
  } catch (err) {
    console.error('Employers list error:', err);
    return res.status(500).json({ error: 'Failed to load employers' });
  }
}
