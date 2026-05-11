#!/usr/bin/env node
/**
 * Backfill `area_en` for existing helpers whose free-text area is in
 * a non-Latin script (typically Thai). Mirrors the bio/bio_en pattern.
 *
 * Usage:
 *   node scripts/backfill-area-en.js          # dry run — shows what would change
 *   node scripts/backfill-area-en.js --write  # actually update the DB
 *
 * Prereqs (must be in .env.local or env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)
 *   GOOGLE_TRANSLATE_API_KEY
 *
 * Skips rows that already have area_en set (so re-running is safe).
 * Skips rows whose area is already pure Latin (no translation needed).
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ── env loader ────────────────────────────────────────────────────────
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

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}
if (!TRANSLATE_KEY) {
  console.error('Missing GOOGLE_TRANSLATE_API_KEY in env.');
  process.exit(1);
}

// Detect any non-Latin script (Thai, Burmese, Khmer, Lao, CJK, Cyrillic, …).
// If the area is pure ASCII / Latin, nothing to translate.
const FOREIGN_SCRIPT_RE = /[฀-๿က-႟ក-៿຀-໿　-鿿가-힯֐-׿؀-ۿЀ-ӿऀ-ॿ]/;

async function translate(text) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${TRANSLATE_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, target: 'en', format: 'text' }),
  });
  if (!res.ok) {
    console.error(`  Translate API error ${res.status}: ${await res.text()}`);
    return null;
  }
  const json = await res.json();
  return json.data?.translations?.[0]?.translatedText?.trim() || null;
}

async function main() {
  console.log(`backfill-area-en — ${WRITE ? 'WRITE' : 'dry run'}`);
  console.log('');

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, area, area_en')
    .not('area', 'is', null)
    .is('area_en', null);

  if (error) {
    console.error('Query failed:', error);
    process.exit(1);
  }

  console.log(`Found ${rows.length} helper(s) with area set and area_en null.`);

  const needsTranslate = rows.filter(r => FOREIGN_SCRIPT_RE.test(r.area || ''));
  const pureLatin       = rows.filter(r => !FOREIGN_SCRIPT_RE.test(r.area || ''));

  console.log(`  • ${needsTranslate.length} have non-Latin script (will translate)`);
  console.log(`  • ${pureLatin.length} are already Latin (no translation needed)`);
  console.log('');

  let translated = 0;
  let failed = 0;
  for (const row of needsTranslate) {
    const en = await translate(row.area);
    if (!en || en === row.area) {
      console.log(`  ✗ ${row.helper_ref} (${row.first_name}): "${row.area}" — translation failed/no-op`);
      failed += 1;
      continue;
    }
    console.log(`  ✓ ${row.helper_ref} (${row.first_name}): "${row.area}" → "${en}"`);
    if (WRITE) {
      const { error: updateError } = await supabase
        .from('helper_profiles')
        .update({ area_en: en })
        .eq('helper_ref', row.helper_ref);
      if (updateError) {
        console.error(`    DB update failed:`, updateError.message);
        failed += 1;
        continue;
      }
    }
    translated += 1;
    // Be polite to the Translate API — small delay between requests.
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('');
  console.log(`Done. Translated: ${translated}. Failed: ${failed}.`);
  if (!WRITE) {
    console.log('Dry run — no DB changes. Re-run with --write to apply.');
  }
}

main().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
