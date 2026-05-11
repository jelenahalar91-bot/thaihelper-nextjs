// POST /api/employer-photo — Upload employer profile photo to Supabase Storage
// Mirrors /api/photo (helper photo) but for employer accounts.
// Stores the photo in the same `profile-photos` bucket under an "employer/<ref>"
// prefix so we don't collide with helper refs, and writes the public URL into
// employer_accounts.photo_url.

import { getEmployerSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import Busboy from 'busboy';
import { bufferMatchesMime } from '../../lib/file-magic';

export const config = { api: { bodyParser: false } };

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET = 'profile-photos';

function parsePhoto(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: MAX_SIZE, files: 1 },
    });
    let fileBuffer = null;
    let mimeType = '';
    let tooLarge = false;

    busboy.on('file', (fieldname, stream, info) => {
      mimeType = info.mimeType;
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('limit', () => { tooLarge = true; });
      stream.on('end', () => {
        if (!tooLarge) fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', () => {
      if (tooLarge) return reject(new Error('Photo too large (max 5 MB)'));
      if (!fileBuffer) return reject(new Error('No file provided'));
      resolve({ fileBuffer, mimeType });
    });

    busboy.on('error', reject);
    req.pipe(busboy);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getEmployerSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const { ref } = session;

  try {
    const { fileBuffer, mimeType } = await parsePhoto(req);

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: 'Only JPG, PNG, and WEBP images are allowed.' });
    }

    // Verify magic bytes — see lib/file-magic.js. Prevents an attacker
    // from uploading HTML/JS/SVG with Content-Type: image/jpeg.
    if (!bufferMatchesMime(fileBuffer, mimeType)) {
      return res.status(400).json({ error: 'File contents do not match the declared image type.' });
    }

    const ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
    const storagePath = `employer/${ref}/profile-photo.${ext}`;

    // Delete old photo (any extension) before uploading the new one
    await supabase.storage.from(BUCKET).remove([
      `employer/${ref}/profile-photo.jpg`,
      `employer/${ref}/profile-photo.png`,
      `employer/${ref}/profile-photo.webp`,
    ]);

    // Upload new photo
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Employer photo upload error:', uploadError);
      return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
    }

    // Get public URL and save it on the employer record
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    const { error: dbError } = await supabase
      .from('employer_accounts')
      .update({
        photo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('employer_ref', ref);

    if (dbError) {
      console.error('Employer photo DB update error:', dbError);
      return res.status(500).json({ error: 'Failed to save photo URL' });
    }

    return res.status(200).json({ url: publicUrl });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
