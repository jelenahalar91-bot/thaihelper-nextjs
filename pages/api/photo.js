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

    // Upload first (upsert overwrites the same extension's file). Only
    // AFTER the upload succeeds do we remove the OTHER extensions —
    // that way if the upload fails the helper still has their previous
    // photo. The old "delete-then-upload" sequence had a data-loss race:
    // if the upload step failed after the delete succeeded, the helper
    // was left with nothing.
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

    // Now clean up any old photos with a DIFFERENT extension. We don't
    // touch the path we just wrote to (the upsert handled that). Errors
    // here are non-fatal — orphan files are a minor storage cost, not
    // a user-visible problem.
    const stalePaths = ['jpg', 'png', 'webp']
      .filter((e) => e !== ext)
      .map((e) => `${ref}/profile-photo.${e}`);
    if (stalePaths.length > 0) {
      const { error: removeErr } = await supabase.storage.from(BUCKET).remove(stalePaths);
      if (removeErr) {
        console.warn('Photo cleanup (old extensions) failed:', removeErr.message);
      }
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
