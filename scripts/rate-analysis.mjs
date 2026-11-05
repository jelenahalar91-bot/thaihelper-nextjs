#!/usr/bin/env node
/**
 * Hourly asking rates across verified helper profiles, for press enquiries.
 *
 * What this is NOT: agreed wages. helper_profiles.rate is what a helper asks
 * for when they register, and hiring_outcomes has no wage column, so the
 * platform holds no record of what anyone was actually paid. It is also not
 * the monthly figure the blog quotes -- RATES in lib/constants/categories.js
 * is explicitly "THB / hour".
 *
 * Writes rate-analysis.json next to itself for the press report.
 *
 *   node scripts/rate-analysis.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const require = createRequire(import.meta.url);

for (const line of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Bands in ascending order. "negotiable" is deliberately outside the scale --
// it is an answer, but not a number, and averaging it in would invent data.
const BANDS = ['under_150', '150_200', '200_300', '300_500', '500_700', '700_1000', 'over_1000'];
const LABEL = {
  under_150: 'unter 150', '150_200': '150–200', '200_300': '200–300', '300_500': '300–500',
  '500_700': '500–700', '700_1000': '700–1.000', over_1000: 'über 1.000',
};
// Midpoints only for ordering and a rough centre of gravity. Never presented
// as a precise figure -- the underlying answer is a band, not a value.
const MID = { under_150: 125, '150_200': 175, '200_300': 250, '300_500': 400, '500_700': 600, '700_1000': 850, over_1000: 1200 };

const norm = (v) => String(v ?? '').trim().replace(/-/g, '_');

async function selectAll(build) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build().range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

const medianBand = (list) => {
  const idx = list.map((b) => BANDS.indexOf(b)).filter((i) => i >= 0).sort((a, b) => a - b);
  return idx.length ? BANDS[idx[Math.floor(idx.length / 2)]] : null;
};
const share = (list, pred) => (list.filter(pred).length / list.length) * 100;

function group(rows, keyFn) {
  const out = {};
  for (const r of rows) {
    for (const k of [].concat(keyFn(r))) {
      if (!k) continue;
      (out[k] = out[k] || []).push(r);
    }
  }
  return out;
}

function summarise(rows, minN) {
  return Object.entries(rows)
    .map(([key, list]) => {
      const banded = list.map((r) => r.band).filter((b) => BANDS.includes(b));
      return {
        key,
        n: list.length,
        nBanded: banded.length,
        negotiableShare: +share(list, (r) => r.band === 'negotiable').toFixed(1),
        median: medianBand(banded),
        // Centre of gravity across band midpoints -- a shape indicator, not a price.
        centre: banded.length ? Math.round(banded.reduce((s, b) => s + MID[b], 0) / banded.length) : null,
        dist: BANDS.map((b) => ({ band: b, n: banded.filter((x) => x === b).length })),
      };
    })
    .filter((g) => g.nBanded >= minN)
    .sort((a, b) => b.nBanded - a.nBanded);
}

const raw = await selectAll(() =>
  supabase.from('helper_profiles')
    .select('rate, city, category, nationality, experience')
    .eq('email_verified', true)
    .order('created_at').order('id'));

const rows = raw.map((r) => ({ ...r, band: norm(r.rate) }));
const answered = rows.filter((r) => r.band);
const banded = rows.filter((r) => BANDS.includes(r.band));
const negotiable = rows.filter((r) => r.band === 'negotiable');
const malformed = answered.filter((r) => !BANDS.includes(r.band) && r.band !== 'negotiable');

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    verified: rows.length,
    answered: answered.length,
    banded: banded.length,
    negotiable: negotiable.length,
    noAnswer: rows.length - answered.length,
    malformed: malformed.length,
    malformedValues: [...new Set(malformed.map((r) => r.rate))],
    bandedShare: +((banded.length / rows.length) * 100).toFixed(1),
    negotiableShare: +((negotiable.length / rows.length) * 100).toFixed(1),
  },
  overall: BANDS.map((b) => ({
    band: b, label: LABEL[b],
    n: banded.filter((r) => r.band === b).length,
    share: +((banded.filter((r) => r.band === b).length / banded.length) * 100).toFixed(1),
  })),
  // A helper may offer several roles; their one rate counts towards each of
  // them, so role groups overlap and sum to more than the total.
  byRole: summarise(group(rows, (r) => String(r.category || '').split(',').map((s) => s.trim())), 20),
  byCity: summarise(group(rows, (r) => r.city), 20),
  byNationality: summarise(group(rows, (r) => (r.nationality === 'prefer_not_say' ? null : r.nationality)), 20),
  byExperience: summarise(group(rows, (r) => r.experience), 20),
  labels: LABEL,
};

fs.writeFileSync(path.join(__dirname, 'rate-analysis.json'), JSON.stringify(report, null, 2));

const t = report.totals;
console.log(`\nVerifizierte Profile : ${t.verified}`);
console.log(`  mit Spanne         : ${t.banded} (${t.bandedShare} %)`);
console.log(`  "verhandelbar"     : ${t.negotiable} (${t.negotiableShare} %)`);
console.log(`  ohne Angabe        : ${t.noAnswer}`);
console.log(`  fehlerhaft         : ${t.malformed}${t.malformed ? ' → ' + t.malformedValues.join(', ') : ''}`);
console.log('\nGesamtverteilung:');
report.overall.forEach((b) => console.log(`  ${b.label.padEnd(10)} ${String(b.n).padStart(4)}  ${String(b.share).padStart(5)} %`));
for (const [title, key] of [['Rolle', 'byRole'], ['Stadt', 'byCity'], ['Nationalität', 'byNationality'], ['Erfahrung', 'byExperience']]) {
  console.log(`\nNach ${title} (n≥20 mit Spanne):`);
  report[key].forEach((g) => console.log(
    `  ${g.key.padEnd(14)} n=${String(g.nBanded).padStart(4)}  Median ${String(LABEL[g.median] || '—').padStart(10)}  Schwerpunkt ${String(g.centre || '—').padStart(4)}  verhandelbar ${String(g.negotiableShare).padStart(5)} %`));
}
console.log(`\n→ scripts/rate-analysis.json geschrieben\n`);
