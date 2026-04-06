// GET /api/references — List references for authenticated helper
// POST /api/references — Add a reference
// PUT /api/references — Update a reference
// DELETE /api/references?id=X — Delete a reference

import { getSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const { ref } = session;

  // LIST
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('helper_references')
      .select('id, reference_name, relationship, contact_info, reference_text, created_at')
      .eq('helper_ref', ref)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('References list error:', error);
      return res.status(500).json({ error: 'Failed to load references' });
    }

    return res.status(200).json({ references: data || [] });
  }

  // ADD
  if (req.method === 'POST') {
    const { reference_name, relationship, contact_info, reference_text } = req.body;

    if (!reference_name?.trim()) {
      return res.status(400).json({ error: 'Reference name is required' });
    }

    const { data, error } = await supabase
      .from('helper_references')
      .insert({
        helper_ref: ref,
        reference_name: reference_name.trim(),
        relationship: relationship || 'other',
        contact_info: contact_info?.trim() || null,
        reference_text: reference_text?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Reference insert error:', error);
      return res.status(500).json({ error: 'Failed to add reference' });
    }

    return res.status(201).json({ reference: data });
  }

  // UPDATE
  if (req.method === 'PUT') {
    const { id, reference_name, relationship, contact_info, reference_text } = req.body;

    if (!id) return res.status(400).json({ error: 'Reference ID required' });

    const updates = {};
    if (reference_name !== undefined) updates.reference_name = reference_name.trim();
    if (relationship !== undefined) updates.relationship = relationship;
    if (contact_info !== undefined) updates.contact_info = contact_info?.trim() || null;
    if (reference_text !== undefined) updates.reference_text = reference_text?.trim() || null;

    const { data, error } = await supabase
      .from('helper_references')
      .update(updates)
      .eq('id', id)
      .eq('helper_ref', ref)
      .select()
      .single();

    if (error) {
      console.error('Reference update error:', error);
      return res.status(500).json({ error: 'Failed to update reference' });
    }

    return res.status(200).json({ reference: data });
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Reference ID required' });

    const { error } = await supabase
      .from('helper_references')
      .delete()
      .eq('id', id)
      .eq('helper_ref', ref);

    if (error) {
      console.error('Reference delete error:', error);
      return res.status(500).json({ error: 'Failed to delete reference' });
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
