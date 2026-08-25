import sharp from 'sharp';

/**
 * Downscale + recompress an uploaded image before it's stored.
 *
 * Profile photos / logos are displayed at a few hundred px at most, so we
 * don't want to keep multi-MB camera originals in storage and serve them
 * raw to browsers (Supabase image transforms aren't on our plan, and the
 * Vercel image optimizer is disabled for Supabase URLs). Keeps the SAME
 * format so the storage path / URL convention is unchanged, and bakes in
 * EXIF orientation so portrait photos aren't rendered sideways.
 *
 * Non-fatal: on any sharp error it returns the original buffer so an upload
 * never fails just because resizing did.
 *
 * @param {Buffer} buffer   the validated original image bytes
 * @param {string} mimeType 'image/jpeg' | 'image/png' | 'image/webp'
 * @param {number} maxDim   longest-edge cap in px (default 640)
 */
export async function shrinkImage(buffer, mimeType, maxDim = 640) {
  try {
    const pipeline = sharp(buffer)
      .rotate()
      .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true });
    if (mimeType === 'image/png') return await pipeline.png({ compressionLevel: 9 }).toBuffer();
    if (mimeType === 'image/webp') return await pipeline.webp({ quality: 78 }).toBuffer();
    return await pipeline.jpeg({ quality: 78 }).toBuffer();
  } catch (err) {
    console.error('Image resize failed, keeping original:', err.message);
    return buffer;
  }
}
