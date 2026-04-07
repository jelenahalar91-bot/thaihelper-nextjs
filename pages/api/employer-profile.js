// GET  /api/employer-profile — Get the current employer's profile
// PUT  /api/employer-profile — Update the current employer's profile

import { getEmployerSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';

const EDITABLE_FIELDS = [
  'first_name',
  'last_name',
  'phone',
  'city',
  'area',
  'looking_for',
  'job_description',
  'preferred_language',
];

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
        'looking_for, job_description, preferred_language, created_at, last_login_at'
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

    // Sanitize job description
    if ('job_description' in patch && patch.job_description) {
      patch.job_description = patch.job_description
        .replace(/(\+?\d[\d\s\-().]{7,}\d)/g, '[phone hidden]')
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email hidden]');
    }

    patch.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('employer_accounts')
      .update(patch)
      .eq('employer_ref', ref);

    if (error) {
      console.error('Employer profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
