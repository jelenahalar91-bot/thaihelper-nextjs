// GET /api/documents — List documents for authenticated helper
// POST /api/documents — Upload a document
// DELETE /api/documents?id=X — Delete a document

import { getSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import Busboy from 'busboy';

export const config = { api: { bodyParser: false } };

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const BUCKET = 'helper-documents';

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: MAX_SIZE, files: 1 } });
    let fileBuffer = null;
    let fileName = '';
    let mimeType = '';
    let fileType = 'other';
    let tooLarge = false;

    busboy.on('file', (fieldname, stream, info) => {
      fileName = info.filename;
      mimeType = info.mimeType;
      const chunks = [];

      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('limit', () => { tooLarge = true; });
      stream.on('end', () => {
        if (!tooLarge) fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('field', (name, value) => {
      if (name === 'fileType') fileType = value;
    });

    busboy.on('finish', () => {
      if (tooLarge) return reject(new Error('File too large (max 10 MB)'));
      if (!fileBuffer) return reject(new Error('No file provided'));
      resolve({ fileBuffer, fileName, mimeType, fileType });
    });

    busboy.on('error', reject);
    req.pipe(busboy);
  });
}

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const { ref } = session;

  // LIST
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('documents')
      .select('id, file_name, file_type, storage_path, file_size, mime_type, uploaded_at')
      .eq('helper_ref', ref)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Documents list error:', error);
      return res.status(500).json({ error: 'Failed to load documents' });
    }

    return res.status(200).json({ documents: data || [] });
  }

  // UPLOAD
  if (req.method === 'POST') {
    try {
      const { fileBuffer, fileName, mimeType, fileType } = await parseMultipart(req);

      if (!ALLOWED_TYPES.includes(mimeType)) {
        return res.status(400).json({ error: 'File type not allowed. Use PDF, JPG, PNG, or WEBP.' });
      }

      // Generate unique storage path
      const ext = fileName.split('.').pop() || 'bin';
      const storagePath = `${ref}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, { contentType: mimeType });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return res.status(500).json({ error: `Storage error: ${uploadError.message}` });
      }

      // Save metadata to database
      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          helper_ref: ref,
          file_name: fileName,
          file_type: fileType,
          storage_path: storagePath,
          file_size: fileBuffer.length,
          mime_type: mimeType,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Document insert error:', dbError);
        // Clean up uploaded file
        await supabase.storage.from(BUCKET).remove([storagePath]);
        return res.status(500).json({ error: `DB error: ${dbError.message}` });
      }

      return res.status(201).json({ document: data });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Document ID required' });

    // Verify ownership
    const { data: doc } = await supabase
      .from('documents')
      .select('id, storage_path')
      .eq('id', id)
      .eq('helper_ref', ref)
      .single();

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Delete from storage
    await supabase.storage.from(BUCKET).remove([doc.storage_path]);

    // Delete from database
    await supabase.from('documents').delete().eq('id', id);

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
