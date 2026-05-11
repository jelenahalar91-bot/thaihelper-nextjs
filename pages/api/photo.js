// POST /api/photo — Upload profile photo to Supabase Storage
// Returns the public URL to store in Google Sheets

import { getSession } from '../../lib/auth';
import { getServiceSupabase } from '../../lib/supabase';
import Busboy from 'busboy';
import { bufferMatchesMime } from '../../lib/file-magic';

export const config = { api: { bodyParser: false } };

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET = 'profile-photos';

function parsePhoto(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: MAX_SIZE, files: 1 } });
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

  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const { ref } = session;

  try {
    const { fileBuffer, mimeType } = await parsePhoto(req);

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: 'Only JPG, PNG, and WEBP images are allowed.' });
    }

    // Verify the actual file content matches the declared MIME — Busboy's
    // mimeType comes from the client-supplied Content-Type, which an
    // attacker can lie about (e.g. upload HTML claiming to be JPEG).
    // Magic bytes are the file's actual signature.
    if (!bufferMatchesMime(fileBuffer, mimeType)) {
      return res.status(400).json({ error: 'File contents do not match the declared image type.' });
    }

    const ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
    const storagePath = `${ref}/profile-photo.${ext}`;

    // Delete old photo if exists (overwrite)
    await supabase.storage.from(BUCKET).remove([
      `${ref}/profile-photo.jpg`,
      `${ref}/profile-photo.png`,
      `${ref}/profile-photo.webp`,
    ]);

    // Upload new photo
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Photo upload error:', uploadError);
      return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    return res.status(200).json({ url: urlData.publicUrl });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
