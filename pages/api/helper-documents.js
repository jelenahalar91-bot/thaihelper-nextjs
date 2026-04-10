// GET /api/helper-documents?ref=TH-XXXX
// Returns certificate documents for a specific helper (signed URLs).
// Used by employer dashboard profile modal to display uploaded certificates.
// Only returns documents of type 'certificate' — not IDs or other private docs.

import { getAnySession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';

const BUCKET = 'helper-documents';
// Signed URLs expire after 30 minutes — enough for viewing in the modal
const SIGNED_URL_EXPIRY = 30 * 60;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Must be authenticated
  const session = await getAnySession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const { ref } = req.query;
  if (!ref) return res.status(400).json({ error: 'ref is required' });

  const supabase = getServiceSupabase();

  // Only fetch certificate-type documents (not IDs or other private docs)
  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, file_name, file_type, storage_path, mime_type, uploaded_at')
    .eq('helper_ref', ref)
    .eq('file_type', 'certificate')
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Helper documents fetch error:', error);
    return res.status(500).json({ error: 'Failed to load documents' });
  }

  if (!docs || docs.length === 0) {
    return res.status(200).json({ documents: [] });
  }

  // Generate signed URLs for each document
  const withUrls = await Promise.all(
    docs.map(async (doc) => {
      const isImage = doc.mime_type?.startsWith('image/');

      if (isImage) {
        const { data: signedData, error: signError } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(doc.storage_path, SIGNED_URL_EXPIRY);

        return {
          id: doc.id,
          fileName: doc.file_name,
          mimeType: doc.mime_type,
          isImage: true,
          url: signError ? null : signedData.signedUrl,
          uploadedAt: doc.uploaded_at,
        };
      }

      // PDFs — just return metadata, no preview
      return {
        id: doc.id,
        fileName: doc.file_name,
        mimeType: doc.mime_type,
        isImage: false,
        url: null,
        uploadedAt: doc.uploaded_at,
      };
    })
  );

  return res.status(200).json({ documents: withUrls });
}
