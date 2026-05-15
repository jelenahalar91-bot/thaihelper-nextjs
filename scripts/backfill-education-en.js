#!/usr/bin/env node
/**
 * Backfill `education_en` for existing helpers whose education field
 * is in a non-Latin script (typically Thai abbreviations like "ปวส.",
 * "ป.ตรี"). Mirrors the area_en / bio_en pattern.
 *
 * Usage:
 *   node scripts/backfill-education-en.js          # dry run
 *   node scripts/backfill-education-en.js --write  # apply
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    });
  }
} catch {}

const WRITE = process.argv.includes('--write');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const TRANSLATE_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !TRANSLATE_KEY) {
  console.error('Missing one of: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_TRANSLATE_API_KEY');
  process.exit(1);
}

const FOREIGN_SCRIPT_RE = /[฀-๿က-႟ក-៿຀-໿　-鿿가-힯֐-׿؀-ۿЀ-ӿऀ-ॿ]/;

async function translate(text) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${TRANSLATE_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, target: 'en', format: 'text' }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.translations?.[0]?.translatedText?.trim() || null;
}

async function main() {
  console.log(`backfill-education-en — ${WRITE ? 'WRITE' : 'dry run'}`);
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: rows, error } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, education, education_en')
    .not('education', 'is', null)
    .is('education_en', null);

  if (error) { console.error(error); process.exit(1); }

  const todo = rows.filter(r => FOREIGN_SCRIPT_RE.test(r.education || ''));
  console.log(`Found ${rows.length} rows missing education_en. ${todo.length} have non-Latin script.\n`);

  let translated = 0, failed = 0;
  for (const row of todo) {
    const en = await translate(row.education);
    if (!en || en === row.education) {
      console.log(`  ✗ ${row.helper_ref} (${row.first_name}): "${row.education}" — translation failed`);
      failed += 1; continue;
    }
    console.log(`  ✓ ${row.helper_ref} (${row.first_name}): "${row.education}" → "${en}"`);
    if (WRITE) {
      const { error: e } = await supabase.from('helper_profiles').update({ education_en: en }).eq('helper_ref', row.helper_ref);
      if (e) { console.error(`    update failed: ${e.message}`); failed += 1; continue; }
    }
    translated += 1;
    await new Promise(r => setTimeout(r, 100));
  }
  console.log(`\nDone. Translated: ${translated}. Failed: ${failed}.`);
  if (!WRITE) console.log('Dry run — re-run with --write to apply.');
}

main().catch(err => { console.error(err); process.exit(1); });
