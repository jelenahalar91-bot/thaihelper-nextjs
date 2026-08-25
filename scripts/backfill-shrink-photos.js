#!/usr/bin/env node
/**
 * One-off: shrink existing profile photos in Supabase Storage.
 *
 * Older uploads were stored at full camera resolution (up to a few MB) even
 * though they're displayed at a few hundred px. New uploads are shrunk at
 * upload time (lib/image-resize.js); this backfills the existing ones so they
 * stop dominating page weight + Supabase egress.
 *
 * For each helper/employer photo hosted on Supabase: download, and if it's
 * larger than the display cap, resize (longest edge 640px, same format) and
 * re-upload to the SAME storage path (so the public URL is unchanged).
 * Idempotent: photos already <=640px are skipped, so re-running is safe.
 *
 *   node scripts/backfill-shrink-photos.js          # dry run
 *   node scripts/backfill-shrink-photos.js --write   # actually re-upload
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.join(__dirname, '..');
try {
  fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
} catch {}

const WRITE = process.argv.includes('--write');
const MAX_DIM = 640;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

function mimeFromPath(p) {
  const ext = p.split('.').pop().toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

async function shrink(buffer, mimeType) {
  const pipeline = sharp(buffer).rotate().resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true });
  if (mimeType === 'image/png') return pipeline.png({ compressionLevel: 9 }).toBuffer();
  if (mimeType === 'image/webp') return pipeline.webp({ quality: 78 }).toBuffer();
  return pipeline.jpeg({ quality: 78 }).toBuffer();
}

// Parse a Supabase public URL into { bucket, path }.
function parseStorageUrl(url) {
  const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!m) return null;
  return { bucket: m[1], path: decodeURIComponent(m[2].split('?')[0]) };
}

async function collect() {
  const rows = [];
  const { data: helpers } = await supabase.from('helper_profiles').select('helper_ref, photo_url').not('photo_url', 'is', null);
  for (const h of helpers || []) rows.push({ who: h.helper_ref, url: h.photo_url });
  const { data: emps } = await supabase.from('employer_accounts').select('employer_ref, photo_url').not('photo_url', 'is', null);
  for (const e of emps || []) rows.push({ who: e.employer_ref, url: e.photo_url });
  return rows;
}

async function main() {
  console.log(`backfill-shrink-photos — ${WRITE ? 'WRITE' : 'dry run'} (max ${MAX_DIM}px)\n`);
  const rows = (await collect()).filter((r) => /supabase\.co/.test(r.url));
  console.log(`${rows.length} Supabase-hosted photos to inspect.\n`);

  let shrunk = 0, skipped = 0, failed = 0, savedBytes = 0;
  for (const r of rows) {
    const loc = parseStorageUrl(r.url);
    if (!loc) { skipped++; continue; }
    try {
      const resp = await fetch(r.url.split('?')[0]);
      if (!resp.ok) { console.log(`  ✗ ${r.who}: download ${resp.status}`); failed++; continue; }
      const orig = Buffer.from(await resp.arrayBuffer());
      const meta = await sharp(orig).metadata();
      if ((meta.width || 0) <= MAX_DIM && (meta.height || 0) <= MAX_DIM) { skipped++; continue; }
      const mimeType = mimeFromPath(loc.path);
      const out = await shrink(orig, mimeType);
      if (out.length >= orig.length) { skipped++; continue; } // no gain
      savedBytes += orig.length - out.length;
      console.log(`  ${WRITE ? '✓' : '·'} ${r.who}: ${meta.width}x${meta.height} ${Math.round(orig.length/1024)}KB → ${Math.round(out.length/1024)}KB`);
      if (WRITE) {
        const { error } = await supabase.storage.from(loc.bucket).upload(loc.path, out, { contentType: mimeType, upsert: true });
        if (error) { console.log(`    upload err: ${error.message}`); failed++; continue; }
        await new Promise((res) => setTimeout(res, 60));
      }
      shrunk++;
    } catch (err) {
      console.log(`  ✗ ${r.who}: ${err.message}`);
      failed++;
    }
  }
  console.log(`\nDone. Shrunk: ${shrunk} · Skipped (already small): ${skipped} · Failed: ${failed}`);
  console.log(`Approx saved: ${Math.round(savedBytes / 1024 / 1024)} MB${WRITE ? '' : ' (dry run — nothing written)'}`);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
