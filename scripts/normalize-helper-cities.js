#!/usr/bin/env node
/**
 * Normalise `helper_profiles.city` to canonical slugs.
 *
 * helper_profiles.city is supposed to hold a slug from CITY_OPTIONS /
 * THAI_PROVINCES ("chiang_mai"). Legacy rows — written before the register
 * form restricted the field — hold display names ("Chiang Mai"), stray
 * whitespace ("Bangkok "), Thai script, district names, or several cities
 * crammed into one free-text field.
 *
 * Those rows fall out of city matching and the browse filter. Since
 * 2026-09-13 the comparison code normalises defensively (toCitySlug), so
 * this script is about cleaning the stored data, not about restoring
 * matching — a row with a trailing space still escapes an `.in('city', …)`
 * query, which is what the digest cron uses.
 *
 * Usage:
 *   node scripts/normalize-helper-cities.js          # dry run — shows what would change
 *   node scripts/normalize-helper-cities.js --write  # actually update the DB
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

// Mirrors lib/constants/cities.js. Duplicated rather than imported because
// this is a plain CommonJS script and the constants module is ESM.
const KNOWN_SLUGS = new Set([
  'bangkok', 'chiang_mai', 'phuket', 'pattaya', 'hua_hin', 'krabi', 'ao_nang',
  'koh_samui', 'koh_phangan', 'koh_tao', 'koh_lanta', 'koh_chang', 'chonburi',
  'rayong', 'nonthaburi', 'samut_prakan', 'chiang_rai', 'pai', 'khon_kaen',
  'udon_thani', 'amnat_charoen', 'ang_thong', 'ayutthaya', 'bueng_kan',
  'buriram', 'chachoengsao', 'chai_nat', 'chaiyaphum', 'chanthaburi',
  'chumphon', 'kalasin', 'kamphaeng_phet', 'kanchanaburi', 'lampang',
  'lamphun', 'loei', 'lopburi', 'mae_hong_son', 'maha_sarakham', 'mukdahan',
  'nakhon_nayok', 'nakhon_pathom', 'nakhon_phanom', 'nakhon_ratchasima',
  'nakhon_sawan', 'nakhon_si_thammarat', 'nan', 'narathiwat',
  'nong_bua_lamphu', 'nong_khai', 'pathum_thani', 'pattani', 'phang_nga',
  'phatthalung', 'phayao', 'phetchabun', 'phetchaburi', 'phichit',
  'phitsanulok', 'phrae', 'prachinburi', 'prachuap_khiri_khan', 'ranong',
  'ratchaburi', 'roi_et', 'sa_kaeo', 'sakon_nakhon', 'samut_sakhon',
  'samut_songkhram', 'saraburi', 'satun', 'sing_buri', 'sisaket', 'songkhla',
  'sukhothai', 'suphan_buri', 'surat_thani', 'surin', 'tak', 'trang', 'trat',
  'ubon_ratchathani', 'uthai_thani', 'uttaradit', 'yala', 'yasothon', 'other',
]);

// Values that need a human decision rather than a rule. Each entry says what
// the row becomes: `city` is the new primary slug, `extra` is merged into
// additional_cities (the helper named several places in one free-text field).
//
// Districts are mapped to their province, which is the granularity the rest
// of the app works at. Rows whose free-text conflicts with their `area` are
// noted in the comment — the declared city wins, `area` is left untouched.
const MANUAL = {
  // Districts / alternate romanisations
  'khanom':            { city: 'nakhon_si_thammarat' }, // area: "Khanom, Nakhon Si Thammarat"
  'nakornrachasima':   { city: 'nakhon_ratchasima' },
  'suphanburi':        { city: 'suphan_buri' },         // area says Sukhumvit — city field wins
  'เกษตรสมบูรณ์':        { city: 'chaiyaphum' },           // Kaset Sombun district; area_en "Chaiyaphum"
  'บึงกาฬ':              { city: 'bueng_kan' },
  'เมืองชุมพร':          { city: 'chumphon' },             // Mueang Chumphon; area_en "Chumphon"

  // Several cities in one field — first becomes primary, rest become extras
  'bangkok,pattaya':                      { city: 'bangkok', extra: ['pattaya'] }, // area says Phuket — conflict left alone
  'pattaya, bangkok':                     { city: 'pattaya', extra: ['bangkok'] },
  'samut sakhon,om noi':                  { city: 'samut_sakhon' },                // Om Noi is in Samut Sakhon
  'other...pattaya ,phuker,chiangmai, bkk,': {
    city: 'pattaya',
    extra: ['phuket', 'chiang_mai', 'bangkok'], // "phuker" and "bkk" read as typos
  },
};

// Free-text locations outside Thailand. The platform is Thailand-only and
// these predate the restricted dropdown, but reassigning someone to a Thai
// province would be inventing data — report and skip.
const OUTSIDE_THAILAND = new Set(['dubai', 'johannesburg south africa']);

function toSlug(value) {
  const lower = String(value || '').trim().toLowerCase();
  if (!lower) return '';
  if (KNOWN_SLUGS.has(lower)) return lower;
  const underscored = lower.replace(/\s+/g, '_');
  if (KNOWN_SLUGS.has(underscored)) return underscored;
  return null; // needs a manual decision
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
    .from('helper_profiles')
    .select('helper_ref, city, additional_cities, area');
  if (error) throw error;

  const planned = [];
  const skipped = [];

  for (const row of rows) {
    const raw = row.city;
    if (!raw || !String(raw).trim()) continue;
    if (KNOWN_SLUGS.has(raw)) continue; // already canonical, untouched

    const lower = String(raw).trim().toLowerCase();

    if (OUTSIDE_THAILAND.has(lower)) {
      skipped.push({ ref: row.helper_ref, raw, why: 'outside Thailand' });
      continue;
    }

    const manual = MANUAL[lower];
    const slug = manual ? manual.city : toSlug(raw);

    if (!slug) {
      skipped.push({ ref: row.helper_ref, raw, why: 'no rule' });
      continue;
    }

    // Merge any extra cities the helper crammed into the city field, keeping
    // what they already listed and never duplicating the new primary.
    let additional = row.additional_cities || null;
    if (manual?.extra?.length) {
      const existing = String(row.additional_cities || '')
        .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const merged = [...new Set([...existing, ...manual.extra])].filter(c => c !== slug);
      additional = merged.join(', ');
    }

    planned.push({
      ref: row.helper_ref,
      from: raw,
      to: slug,
      additionalFrom: row.additional_cities || '',
      additionalTo: additional || '',
    });
  }

  console.log(`Scanned ${rows.length} helpers.`);
  console.log(`\n${planned.length} row(s) to normalise:`);
  for (const p of planned) {
    const extra = p.additionalTo !== p.additionalFrom
      ? `   (+ additional_cities: "${p.additionalFrom}" -> "${p.additionalTo}")`
      : '';
    console.log(`  ${p.ref}  "${p.from}" -> "${p.to}"${extra}`);
  }

  if (skipped.length) {
    console.log(`\n${skipped.length} row(s) left alone — decide by hand:`);
    for (const s of skipped) console.log(`  ${s.ref}  "${s.raw}"  (${s.why})`);
  }

  if (!WRITE) {
    console.log('\nDry run — nothing written. Re-run with --write to apply.');
    return;
  }

  let updated = 0;
  for (const p of planned) {
    const patch = { city: p.to };
    if (p.additionalTo !== p.additionalFrom) patch.additional_cities = p.additionalTo;
    const { error: upErr } = await supabase
      .from('helper_profiles')
      .update(patch)
      .eq('helper_ref', p.ref);
    if (upErr) {
      console.error(`  FAILED ${p.ref}: ${upErr.message}`);
      continue;
    }
    updated++;
  }
  console.log(`\nUpdated ${updated} of ${planned.length} row(s).`);
})();
