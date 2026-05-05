#!/usr/bin/env node
/**
 * Backfill `work_permit_status = 'thai_national'` for existing helpers
 * who almost certainly are Thai nationals based on their language list.
 *
 * Two heuristics:
 *
 *  --strict (default): match ONLY helpers whose `languages` field
 *  contains "thai" and nothing else. Most conservative — no risk of
 *  flagging a Myanmar/Filipino worker as Thai. Misses bilingual Thai
 *  helpers who listed English/Chinese alongside Thai.
 *
 *  --heuristic: match if Thai is in slot 0 or 1 AND no MOU-source
 *  language (Burmese, Tagalog, Lao, Khmer, Vietnamese) appears
 *  anywhere. More inclusive but accepts a few helpers whose self-
 *  reported language list might not match their actual nationality.
 *
 * Skips helpers who already have a work_permit_status set (manual
 * choice always wins).
 *
 * Usage:
 *   node scripts/backfill-thai-national.js                     # dry run, strict
 *   node scripts/backfill-thai-national.js --heuristic         # dry run, heuristic
 *   node scripts/backfill-thai-national.js --write             # write, strict
 *   node scripts/backfill-thai-national.js --heuristic --write # write, heuristic
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const writeMode = process.argv.includes('--write');
const heuristicMode = process.argv.includes('--heuristic');

// "MOU source" = languages that signal the helper is FROM that country.
const FOREIGN_SOURCE = ['burmese', 'myanmar', 'tagalog', 'filipino', 'lao', 'khmer', 'cambodian', 'vietnamese'];

function parseLanguages(raw) {
  return (raw || '')
    .toLowerCase()
    .split(/[,;|/]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

// Strict: language list is exactly ["thai"]. No bilinguals.
function isStrictThai(langs) {
  return langs.length === 1 && langs[0].includes('thai');
}

// Heuristic: Thai in slot 0/1, no MOU-source language anywhere.
function isHeuristicThai(langs) {
  if (langs.length === 0) return false;
  const thaiPos = langs.findIndex(l => l.includes('thai'));
  if (thaiPos === -1 || thaiPos > 1) return false;
  return !langs.some(l => FOREIGN_SOURCE.some(f => l.includes(f)));
}

const isThaiNational = heuristicMode ? isHeuristicThai : isStrictThai;

(async () => {
  const { data: helpers, error } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, last_name, languages, work_permit_status, status, email_verified');
  if (error) { console.error(error); process.exit(1); }

  const eligible = (helpers || []).filter(h => h.email_verified && !h.work_permit_status);

  const toMark = [];
  const skipped = [];
  for (const h of eligible) {
    const langs = parseLanguages(h.languages);
    if (isThaiNational(langs)) toMark.push(h);
    else skipped.push(h);
  }

  console.log(`\nMatcher: ${heuristicMode ? 'HEURISTIC (Thai in slot 0/1, no MOU-source language)' : 'STRICT (only "thai" listed, no other language)'}`);
  console.log(`Mode:    ${writeMode ? 'WRITE' : 'DRY RUN'} (use --write to commit)`);
  console.log(`Verified helpers without WP status: ${eligible.length}`);
  console.log(`  → would mark as thai_national: ${toMark.length}`);
  console.log(`  → leave untouched: ${skipped.length}\n`);

  console.log('Marking as thai_national:');
  toMark.forEach(h =>
    console.log(`  ${h.helper_ref}  ${h.first_name} ${h.last_name?.[0] || ''}.   langs: "${h.languages}"`)
  );

  console.log('\nLeaving untouched (no Thai, or Thai paired with MOU-source language):');
  skipped.forEach(h =>
    console.log(`  ${h.helper_ref}  ${h.first_name} ${h.last_name?.[0] || ''}.   langs: "${h.languages}"`)
  );

  if (!writeMode) {
    console.log('\nDry run complete. Re-run with --write to commit.');
    return;
  }
  if (toMark.length === 0) {
    console.log('\nNothing to write.');
    return;
  }

  // Update in a single batch — Supabase's upsert is the easiest way.
  const refs = toMark.map(h => h.helper_ref);
  const { error: upErr } = await supabase
    .from('helper_profiles')
    .update({ work_permit_status: 'thai_national' })
    .in('helper_ref', refs);

  if (upErr) {
    console.error('\nUpdate failed:', upErr);
    process.exit(1);
  }
  console.log(`\n✓ Updated ${refs.length} helpers to work_permit_status='thai_national'.`);
})();
