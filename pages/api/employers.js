// GET /api/employers — Public employer browse list
//
// Returns email-verified employers from employer_accounts. We no longer
// surface employer_registrations (legacy quote-request leads) — those
// users only filled out a "request a quote" form and never consented to
// being listed publicly. Strips sensitive info (email, phone).
// Shape mirrors /api/helpers for consistency.

import { getServiceSupabase } from '../../lib/supabase';

function toPublicCard(row) {
  return {
    ref: row.employer_ref || null,
    firstName: row.first_name || '',
    lastName: row.last_name ? row.last_name.charAt(0) + '.' : '',
    city: row.city || '',
    area: row.area || '',
    lookingFor: row.looking_for || '',
    neededSkills: row.needed_skills || '',
    scheduleDays: row.schedule_days || '',
    scheduleTime: row.schedule_time || '',
    duration: row.duration || '',
    childAgeGroups: row.child_age_groups || '',
    jobDescription: row.job_description || '',
    photo: row.photo_url || '',
    arrangementPreference: row.arrangement_preference || null,
    preferredAgeRange: row.preferred_age_range || null,
    source: 'account',
    createdAt: row.created_at || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceSupabase();

    const { data: accounts, error: accErr } = await supabase
      .from('employer_accounts')
      .select(
        'employer_ref, first_name, last_name, city, area, ' +
        'looking_for, needed_skills, schedule_days, schedule_time, duration, ' +
        'child_age_groups, arrangement_preference, preferred_age_range, ' +
        'job_description, photo_url, created_at'
      )
      .eq('email_verified', true)
      .order('created_at', { ascending: false });

    if (accErr) {
      console.error('Employer accounts list error:', accErr);
      return res.status(500).json({ error: 'Failed to load employers' });
    }

    const employers = (accounts || []).map(toPublicCard);

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ employers });
  } catch (err) {
    console.error('Employers list error:', err);
    return res.status(500).json({ error: 'Failed to load employers' });
  }
}
