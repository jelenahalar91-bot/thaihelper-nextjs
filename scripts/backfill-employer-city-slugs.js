#!/usr/bin/env node
/**
 * Convert `employer_accounts.city` from display names to slugs.
 *
 * The employer forms were built against CITIES (the display-name array,
 * "Chiang Mai") while the helper forms use CITY_OPTIONS[].slug
 * ("chiang_mai"). Every city comparison between the two tables therefore
 * failed, which is what kept match notifications silent from launch until
 * 2026-09-13. The forms and the API now write slugs; this backfills the
 * rows written before that.
 *
 * Usage:
 *   node scripts/backfill-employer-city-slugs.js          # dry run
 *   node scripts/backfill-employer-city-slugs.js --write  # actually update
 *
 * Prereqs (must be in .env.local or env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)
 *
 * Safe to re-run: rows already holding a canonical slug are skipped.
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

// Mirrors lib/constants/cities.js — duplicated because this is CommonJS and
// the constants module is ESM. Only the display names the employer forms
// ever offered (CITIES) can appear here, but the full province list is
// included so a hand-edited row still resolves.
const NAME_TO_SLUG = new Map();
const SLUGS = [
  ['bangkok', 'Bangkok'], ['chiang_mai', 'Chiang Mai'], ['phuket', 'Phuket'],
  ['pattaya', 'Pattaya'], ['hua_hin', 'Hua Hin'], ['krabi', 'Krabi'],
  ['ao_nang', 'Ao Nang'], ['koh_samui', 'Koh Samui'], ['koh_phangan', 'Koh Phangan'],
  ['koh_tao', 'Koh Tao'], ['koh_lanta', 'Koh Lanta'], ['koh_chang', 'Koh Chang'],
  ['chonburi', 'Chonburi'], ['rayong', 'Rayong'], ['nonthaburi', 'Nonthaburi'],
  ['samut_prakan', 'Samut Prakan'], ['chiang_rai', 'Chiang Rai'], ['pai', 'Pai'],
  ['khon_kaen', 'Khon Kaen'], ['udon_thani', 'Udon Thani'],
  ['amnat_charoen', 'Amnat Charoen'], ['ang_thong', 'Ang Thong'],
  ['ayutthaya', 'Ayutthaya'], ['bueng_kan', 'Bueng Kan'], ['buriram', 'Buriram'],
  ['chachoengsao', 'Chachoengsao'], ['chai_nat', 'Chai Nat'],
  ['chaiyaphum', 'Chaiyaphum'], ['chanthaburi', 'Chanthaburi'],
  ['chumphon', 'Chumphon'], ['kalasin', 'Kalasin'],
  ['kamphaeng_phet', 'Kamphaeng Phet'], ['kanchanaburi', 'Kanchanaburi'],
  ['lampang', 'Lampang'], ['lamphun', 'Lamphun'], ['loei', 'Loei'],
  ['lopburi', 'Lopburi'], ['mae_hong_son', 'Mae Hong Son'],
  ['maha_sarakham', 'Maha Sarakham'], ['mukdahan', 'Mukdahan'],
  ['nakhon_nayok', 'Nakhon Nayok'], ['nakhon_pathom', 'Nakhon Pathom'],
  ['nakhon_phanom', 'Nakhon Phanom'], ['nakhon_ratchasima', 'Nakhon Ratchasima'],
  ['nakhon_sawan', 'Nakhon Sawan'], ['nakhon_si_thammarat', 'Nakhon Si Thammarat'],
  ['nan', 'Nan'], ['narathiwat', 'Narathiwat'],
  ['nong_bua_lamphu', 'Nong Bua Lamphu'], ['nong_khai', 'Nong Khai'],
  ['pathum_thani', 'Pathum Thani'], ['pattani', 'Pattani'],
  ['phang_nga', 'Phang Nga'], ['phatthalung', 'Phatthalung'], ['phayao', 'Phayao'],
  ['phetchabun', 'Phetchabun'], ['phetchaburi', 'Phetchaburi'],
  ['phichit', 'Phichit'], ['phitsanulok', 'Phitsanulok'], ['phrae', 'Phrae'],
  ['prachinburi', 'Prachinburi'], ['prachuap_khiri_khan', 'Prachuap Khiri Khan'],
  ['ranong', 'Ranong'], ['ratchaburi', 'Ratchaburi'], ['roi_et', 'Roi Et'],
  ['sa_kaeo', 'Sa Kaeo'], ['sakon_nakhon', 'Sakon Nakhon'],
  ['samut_sakhon', 'Samut Sakhon'], ['samut_songkhram', 'Samut Songkhram'],
  ['saraburi', 'Saraburi'], ['satun', 'Satun'], ['sing_buri', 'Sing Buri'],
  ['sisaket', 'Sisaket'], ['songkhla', 'Songkhla'], ['sukhothai', 'Sukhothai'],
  ['suphan_buri', 'Suphan Buri'], ['surat_thani', 'Surat Thani'],
  ['surin', 'Surin'], ['tak', 'Tak'], ['trang', 'Trang'], ['trat', 'Trat'],
  ['ubon_ratchathani', 'Ubon Ratchathani'], ['uthai_thani', 'Uthai Thani'],
  ['uttaradit', 'Uttaradit'], ['yala', 'Yala'], ['yasothon', 'Yasothon'],
];
const VALID = new Set(SLUGS.map(([slug]) => slug));
for (const [slug, name] of SLUGS) NAME_TO_SLUG.set(name.toLowerCase(), slug);

function toSlug(value) {
  const lower = String(value || '').trim().toLowerCase();
  if (!lower) return '';
  if (VALID.has(lower)) return lower;
  if (NAME_TO_SLUG.has(lower)) return NAME_TO_SLUG.get(lower);
  const underscored = lower.replace(/\s+/g, '_');
  return VALID.has(underscored) ? underscored : null;
}

(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: rows, error } = await supabase
    .from('employer_accounts')
    .select('employer_ref, city');
  if (error) throw error;

  const planned = [];
  const skipped = [];

  for (const row of rows) {
    const raw = row.city;
    if (!raw || !String(raw).trim()) continue;
    if (VALID.has(raw)) continue; // already a canonical slug

    const slug = toSlug(raw);
    if (!slug) {
      skipped.push({ ref: row.employer_ref, raw });
      continue;
    }
    planned.push({ ref: row.employer_ref, from: raw, to: slug });
  }

  console.log(`Scanned ${rows.length} employers.`);
  const byChange = new Map();
  for (const p of planned) {
    const k = `${p.from} -> ${p.to}`;
    byChange.set(k, (byChange.get(k) || 0) + 1);
  }
  console.log(`\n${planned.length} row(s) to convert:`);
  for (const [k, n] of [...byChange.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}x  ${k}`);
  }

  if (skipped.length) {
    console.log(`\n${skipped.length} row(s) left alone — decide by hand:`);
    for (const s of skipped) console.log(`  ${s.ref}  "${s.raw}"`);
  }

  if (!WRITE) {
    console.log('\nDry run — nothing written. Re-run with --write to apply.');
    return;
  }

  let updated = 0;
  for (const p of planned) {
    const { error: upErr } = await supabase
      .from('employer_accounts')
      .update({ city: p.to })
      .eq('employer_ref', p.ref);
    if (upErr) {
      console.error(`  FAILED ${p.ref}: ${upErr.message}`);
      continue;
    }
    updated++;
  }
  console.log(`\nUpdated ${updated} of ${planned.length} row(s).`);
})();
