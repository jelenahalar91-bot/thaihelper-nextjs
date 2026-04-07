// GET /api/profile — Fetch helper profile from Supabase
// PUT /api/profile — Update helper profile in Supabase

import { getSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

// Map Supabase snake_case → frontend camelCase
function toFrontend(row) {
  return {
    ref: row.helper_ref,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    age: row.age || '',
    category: row.category || '',
    skills: row.skills || '',
    city: row.city || '',
    area: row.area || '',
    experience: row.experience || '',
    languages: row.languages || '',
    rate: row.rate || '',
    education: row.education || '',
    certificates: row.certificates || '',
    bio: row.bio || '',
    whatsapp: row.whatsapp || '',
    hasWhatsApp: row.has_whatsapp ? 'Yes' : 'No',
    photo: row.photo_url || '',
    source: row.source || '',
    timestamp: row.created_at || '',
    status: row.status || 'active',
  };
}

// Map frontend camelCase → Supabase snake_case
const fieldMap = {
  firstName: 'first_name',
  lastName: 'last_name',
  age: 'age',
  category: 'category',
  skills: 'skills',
  city: 'city',
  area: 'area',
  experience: 'experience',
  languages: 'languages',
  rate: 'rate',
  education: 'education',
  certificates: 'certificates',
  bio: 'bio',
  whatsapp: 'whatsapp',
  hasWhatsApp: 'has_whatsapp',
  photo: 'photo_url',
};

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const supabase = getServiceSupabase();

  // GET — Fetch profile
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('helper_profiles')
        .select('*')
        .eq('helper_ref', session.ref)
        .eq('email', session.email)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      return res.status(200).json({ success: true, profile: toFrontend(data) });
    } catch (err) {
      console.error('Profile fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  // PUT — Update profile
  if (req.method === 'PUT') {
    try {
      const incoming = req.body;

      // Build update object with snake_case keys
      const updates = {};
      for (const [frontKey, value] of Object.entries(incoming)) {
        const dbKey = fieldMap[frontKey];
        if (dbKey) {
          // Special handling for hasWhatsApp boolean
          if (frontKey === 'hasWhatsApp') {
            updates[dbKey] = value === 'Yes' || value === true;
          } else {
            updates[dbKey] = value;
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const { error } = await supabase
        .from('helper_profiles')
        .update(updates)
        .eq('helper_ref', session.ref)
        .eq('email', session.email);

      if (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Profile update error:', err);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
