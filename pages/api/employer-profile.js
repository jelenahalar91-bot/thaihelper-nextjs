// GET  /api/employer-profile — Get the current employer's profile
// PUT  /api/employer-profile — Update the current employer's profile

import { getEmployerSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import { notifyHelpersOfNewEmployer } from '../../lib/match-notifications';

const EDITABLE_FIELDS = [
  'first_name',
  'last_name',
  'phone',
  'city',
  'area',
  'looking_for',
  'needed_skills',
  'schedule_days',
  'schedule_time',
  'duration',
  'child_age_groups',
  'arrangement_preference',
  'preferred_age_range',
  'job_description',
  'preferred_language',
  'notify_on_message',
];

// Fields that may arrive as either an array (from chip toggles) or a CSV
// string. We normalise both into a comma-separated string for storage so
// reads always look the same.
const ARRAY_OR_CSV_FIELDS = ['looking_for', 'needed_skills', 'schedule_days', 'schedule_time', 'child_age_groups'];

const ARRANGEMENT_VALUES = ['live_in', 'live_out', 'either'];

export default async function handler(req, res) {
  const session = await getEmployerSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const { ref } = session;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('employer_accounts')
      .select(
        'employer_ref, first_name, last_name, email, phone, city, area, ' +
        'looking_for, needed_skills, schedule_days, schedule_time, duration, ' +
        'child_age_groups, arrangement_preference, preferred_age_range, ' +
        'job_description, preferred_language, photo_url, notify_on_message, ' +
        'access_until, access_tier, email_verified, created_at, last_login_at'
      )
      .eq('employer_ref', ref)
      .single();

    if (error || !data) {
      console.error('Employer profile load error:', error);
      return res.status(404).json({ error: 'Employer not found' });
    }

    return res.status(200).json({ success: true, profile: data });
  }

  if (req.method === 'PUT') {
    const body = req.body || {};

    // Only allow known fields to be updated
    const patch = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        const value = body[field];
        patch[field] =
          typeof value === 'string' ? value.trim() || null : value;
      }
    }

    // Whitelist arrangement preference (matches DB CHECK constraint)
    if ('arrangement_preference' in patch && patch.arrangement_preference) {
      if (!ARRANGEMENT_VALUES.includes(patch.arrangement_preference)) {
        patch.arrangement_preference = null;
      }
    }

    // looking_for / needed_skills / schedule_* / child_age_groups can come
    // as either array or CSV string — normalise to CSV.
    for (const field of ARRAY_OR_CSV_FIELDS) {
      if (field in body && Array.isArray(body[field])) {
        patch[field] = body[field].join(', ') || null;
      }
    }

    // Sanitize job description
    if ('job_description' in patch && patch.job_description) {
      patch.job_description = patch.job_description
        .replace(/(\+?\d[\d\s\-().]{7,}\d)/g, '[phone hidden]')
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email hidden]');
    }

    patch.updated_at = new Date().toISOString();

    // Read previous city/looking_for so we can detect material changes after
    // the update and re-fire the match notifier (existing helpers in the
    // employer's new city / new categories should hear about them).
    let prev = null;
    if ('city' in patch || 'looking_for' in patch) {
      const { data } = await supabase
        .from('employer_accounts')
        .select('city, looking_for, first_name, email_verified')
        .eq('employer_ref', ref)
        .single();
      prev = data || null;
    }

    const { error } = await supabase
      .from('employer_accounts')
      .update(patch)
      .eq('employer_ref', ref);

    if (error) {
      console.error('Employer profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    // Re-trigger match notifications when the employer actually moved or
    // changed which categories they're looking for. Skip while unverified.
    if (prev?.email_verified) {
      const cityChanged    = 'city' in patch         && patch.city         !== prev.city;
      const lookingChanged = 'looking_for' in patch  && patch.looking_for  !== prev.looking_for;
      if (cityChanged || lookingChanged) {
        try {
          await notifyHelpersOfNewEmployer({
            employer_ref: ref,
            first_name:  prev.first_name || '',
            city:        patch.city        ?? prev.city,
            looking_for: patch.looking_for ?? prev.looking_for,
          });
        } catch (err) {
          console.error('Match re-trigger on employer profile update failed:', err.message);
        }
      }
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
