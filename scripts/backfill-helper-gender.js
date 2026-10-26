#!/usr/bin/env node
/**
 * Seed `helper_profiles.gender` from the Thai polite particles a helper
 * used when writing their own profile.
 *
 * Usage:
 *   node scripts/backfill-helper-gender.js          # dry run
 *   node scripts/backfill-helper-gender.js --write  # actually update
 *
 * Prereqs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * ── Why these particles and not more ────────────────────────────────────
 * Thai marks the speaker's gender in its polite particles, so a helper who
 * wrote their own bio usually told us already. But only some of the obvious
 * markers actually carry the signal, and the near-misses are worse than
 * useless — they are confidently wrong about a real person's gender:
 *
 *   ฉัน  — DROPPED. Looks like the strongest signal in the data (258 of the
 *          1077 unset profiles contain it) and carries none. Those bios are
 *          our own generated template, "ฉันเป็นคนขับรถที่มีประสบการณ์…",
 *          and plenty of them belong to drivers. ฉัน is also a genuinely
 *          mixed-gender pronoun in writing. Using it would have mislabelled
 *          a quarter of the platform.
 *   ผม   — DROPPED. Means both "I" (male) and "hair", and this is a
 *          platform where people write about doing hair.
 *   คะ   — kept, but only with a boundary: bare 'คะ' also opens คะแนน.
 *
 * What is left is small and trustworthy. Everything it can't answer stays
 * NULL and gets asked for in /profile — see the banner there.
 *
 * Safe to re-run: only touches rows where gender IS NULL, and skips any
 * text containing both a female and a male marker.
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

// ค่ะ / นะคะ / ดิฉัน, and คะ only when no Thai letter follows it.
const FEMALE = /ค่ะ|นะคะ|ดิฉัน|คะ(?![ก-ฺเ-๎])/;
// ครับ / กระผม — ครับ has no second meaning, which is the whole point.
const MALE = /ครับ|กระผม/;

function inferGender(row) {
  const txt = [row.bio, row.experience, row.education, row.certificates]
    .filter(Boolean)
    .join(' ');
  if (!txt) return null;
  const fem = FEMALE.test(txt);
  const masc = MALE.test(txt);
  // A profile that uses both is telling us nothing — a quoted reference, a
  // mixed-language paste, or a family member who filled the form in.
  if (fem === masc) return null;
  return fem ? 'female' : 'male';
}

(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  // Paged — the table is past 1000 rows, which is exactly where a bare
  // .select() starts silently dropping the oldest profiles.
  const rows = [];
  const PAGE = 500;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('helper_profiles')
      .select('helper_ref, first_name, bio, experience, education, certificates')
      .is('gender', null)
      .order('helper_ref', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) { console.error('Fetch failed:', error.message); process.exit(1); }
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }

  const planned = [];
  for (const row of rows) {
    const gender = inferGender(row);
    if (gender) planned.push({ ref: row.helper_ref, name: row.first_name, gender });
  }

  const female = planned.filter(p => p.gender === 'female').length;
  console.log(`${rows.length} helpers with no gender set.`);
  console.log(`Inferable from polite particles: ${planned.length} (${female} female, ${planned.length - female} male)`);
  console.log(`Staying NULL (asked for in /profile): ${rows.length - planned.length}`);

  if (!WRITE) {
    console.log('\nDry run. Sample of what would be written:');
    for (const p of planned.slice(0, 15)) console.log(`  ${p.ref}  ${p.name}  → ${p.gender}`);
    console.log('\nRe-run with --write to apply.');
    return;
  }

  let ok = 0, failed = 0;
  for (const p of planned) {
    // Guarded on gender IS NULL as well as the ref, so a helper who answered
    // the /profile banner while this was running keeps their own answer.
    const { error } = await supabase
      .from('helper_profiles')
      .update({ gender: p.gender })
      .eq('helper_ref', p.ref)
      .is('gender', null);
    if (error) { failed++; console.error(`  ${p.ref}: ${error.message}`); }
    else ok++;
  }
  console.log(`\nWrote ${ok}, failed ${failed}.`);
})();
