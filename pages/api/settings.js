// GET /api/settings — Get user preferences
// PUT /api/settings — Update language preference

import { getSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const { ref } = session;

  // GET settings
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('preferred_language')
      .eq('helper_ref', ref)
      .single();

    if (error || !data) {
      return res.status(200).json({ preferred_language: 'en' });
    }

    return res.status(200).json({ preferred_language: data.preferred_language });
  }

  // UPDATE settings
  if (req.method === 'PUT') {
    const { preferred_language } = req.body;
    const validLangs = ['en', 'th', 'ru'];

    if (!validLangs.includes(preferred_language)) {
      return res.status(400).json({ error: 'Invalid language' });
    }

    const { error } = await supabase
      .from('user_preferences')
      .update({ preferred_language, updated_at: new Date().toISOString() })
      .eq('helper_ref', ref);

    if (error) {
      console.error('Settings update error:', error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }

    return res.status(200).json({ success: true, preferred_language });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
