// POST /api/company-photo — Upload a company logo to Supabase Storage.
// Mirrors /api/employer-photo. Stores under "company/<ref>/" in the shared
// profile-photos bucket and writes the public URL into the company's owned
// directory_listings.logo_url.

import { getCompanySession } from '../../lib/auth';
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
      if (tooLarge) return reject(new Error('Logo too large (max 5 MB)'));
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

  const session = await getCompanySession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  const supabase = getServiceSupabase();
  const { ref } = session;

  // Resolve the owned listing up front — no listing, nowhere to attach a logo.
  const { data: account } = await supabase
    .from('company_accounts')
    .select('id')
    .eq('company_ref', ref)
    .maybeSingle();
  if (!account) return res.status(401).json({ error: 'Account not found' });

  const { data: listing } = await supabase
    .from('directory_listings')
    .select('id')
    .eq('owner_account_id', account.id)
    .maybeSingle();
  if (!listing) return res.status(404).json({ error: 'No listing to attach a logo to.' });

  try {
    const { fileBuffer, mimeType } = await parsePhoto(req);

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: 'Only JPG, PNG, and WEBP images are allowed.' });
    }
    if (!bufferMatchesMime(fileBuffer, mimeType)) {
      return res.status(400).json({ error: 'File contents do not match the declared image type.' });
    }

    const ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1];
    const storagePath = `company/${ref}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });

    if (uploadError) {
      console.error('Company logo upload error:', uploadError);
      return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
    }

    // Clean up stale logos in other extensions (non-fatal).
    const stalePaths = ['jpg', 'png', 'webp']
      .filter((e) => e !== ext)
      .map((e) => `company/${ref}/logo.${e}`);
    if (stalePaths.length > 0) {
      const { error: removeErr } = await supabase.storage.from(BUCKET).remove(stalePaths);
      if (removeErr) console.warn('Company logo cleanup failed:', removeErr.message);
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    const { error: dbError } = await supabase
      .from('directory_listings')
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', listing.id);

    if (dbError) {
      console.error('Company logo DB update error:', dbError);
      return res.status(500).json({ error: 'Failed to save logo URL' });
    }

    return res.status(200).json({ url: publicUrl });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
