// GET /api/helper-references?ref=TH-XXXX
// Public endpoint: returns references for a specific helper.
// Used by employer dashboard to show recommendations in the profile modal.
// Only returns name + relationship + text — never contact_info (private).

import { getAnySession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Must be authenticated (either helper or employer)
  const session = await getAnySession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const { ref } = req.query;
  if (!ref) return res.status(400).json({ error: 'ref is required' });

  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('helper_references')
    .select('id, reference_name, relationship, reference_text, created_at')
    .eq('helper_ref', ref)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Helper references fetch error:', error);
    return res.status(500).json({ error: 'Failed to load references' });
  }

  return res.status(200).json({ references: data || [] });
}
