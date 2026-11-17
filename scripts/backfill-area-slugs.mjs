#!/usr/bin/env node
/**
 * Sort the existing free-text areas into the clickable list (17.11.2026).
 *
 * Until now `area` was one free-text line. lib/constants/areas.js gives each
 * busy city a list; this script reads every profile's line with the same
 * foldAreaText() the save routes use and fills `area_slugs`:
 *
 *   "rawai/ chalong"        → area_slugs "chalong,rawai", area ""
 *   "Sukhumvit 71"          → area_slugs "sukhumvit",     area "Sukhumvit 71"
 *   "near the coca cola factory" → untouched
 *
 * A token that IS a list entry leaves the text; one that only contains a list
 * name stays, so nothing a person wrote is lost. For helpers the Thai original
 * and its stored translation are both read — that is how ฉลอง is found even
 * though the translation says "celebrate" — and the translation of whatever
 * text is left is made fresh.
 *
 * RUN THIS ONLY AFTER the code that reads area_slugs is deployed: the old
 * pages show `area` as is, and would show nothing for a profile whose whole
 * line moved into area_slugs.
 *
 * Safe to run twice: rows that already have area_slugs are skipped.
 *
 *   node scripts/backfill-area-slugs.mjs            # dry run: counts + examples
 *   node scripts/backfill-area-slugs.mjs --live     # write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { foldAreaText, hasAreas, formatAreas } from '../lib/constants/areas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const live = process.argv.includes('--live');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const citySlug = (c) => String(c || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
const hasThai = (s) => /[฀-๿က-႟ក-៿຀-໿]/.test(s || '');

async function translate(text) {
  if (!text || !hasThai(text) || !process.env.GOOGLE_TRANSLATE_API_KEY) return null;
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, target: 'en', format: 'text' }),
  });
  const j = await res.json().catch(() => null);
  const out = j?.data?.translations?.[0]?.translatedText?.trim();
  return out && out !== text ? out : null;
}

// Supabase returns at most 1000 rows per request.
async function all(table, columns, key) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).order(key).range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

async function run(table, key, withEn) {
  const rows = await all(table, `${key}, city, area, area_slugs${withEn ? ', area_en' : ''}`, key);
  const withText = rows.filter((r) => String(r.area || '').trim());
  const stats = { rows: rows.length, withText: withText.length, noList: 0, already: 0, sorted: 0, fully: 0, untouched: 0, cityOnly: 0 };
  const byCity = {};
  const examples = [];
  const leftovers = {};
  let written = 0;

  for (const r of withText) {
    const city = citySlug(r.city);
    const c = (byCity[city] ||= { total: 0, sorted: 0 });
    if (!hasAreas(city)) { stats.noList++; continue; }
    c.total++;
    if (r.area_slugs) { stats.already++; c.sorted++; continue; }

    const fromText = foldAreaText(city, [], r.area);
    const fromEn = withEn && r.area_en ? foldAreaText(city, [], r.area_en) : { slugs: [], other: '' };
    const slugs = foldAreaText(city, [...fromText.slugs, ...fromEn.slugs], '').slugs;
    // The line was nothing but the city again ("Bangkok" under Bangkok):
    // it says nothing, and showed on cards as "Hua Hin · huahin".
    if (!slugs.length && !fromText.other) {
      stats.cityOnly++;
      if (live) await supabase.from(table).update(withEn ? { area: null, area_en: null } : { area: null }).eq(key, r[key]);
      continue;
    }
    if (!slugs.length) {
      stats.untouched++;
      const k = `${city}: ${(r.area_en || r.area).toLowerCase().slice(0, 50)}`;
      leftovers[k] = (leftovers[k] || 0) + 1;
      continue;
    }
    stats.sorted++; c.sorted++;

    // The translation only found it ("celebrate" ← ฉลอง is the other way
    // round): keep the original line, the card will not repeat the name.
    const area = fromText.other;
    const patch = { area_slugs: slugs.join(','), area: area || null };
    if (withEn) {
      if (!area) patch.area_en = null;
      else if (area !== String(r.area).trim()) patch.area_en = live ? await translate(area) : '(new translation)';
    }
    if (!area) stats.fully++;
    if (examples.length < 400) {
      examples.push(`  ${city.padEnd(14)} ${JSON.stringify(r.area).slice(0, 46).padEnd(48)} → [${slugs.join(', ')}]${area ? `  + ${JSON.stringify(area)}` : ''}   shows: ${formatAreas(city, slugs, patch.area_en && patch.area_en !== '(new translation)' ? patch.area_en : (area && !hasThai(area) ? area : (fromEn.other || area)), 'en')}`);
    }
    if (live) {
      const { error } = await supabase.from(table).update(patch).eq(key, r[key]);
      if (error) console.log(`  FEHLER ${r[key]}: ${error.message}`); else written++;
    }
  }

  console.log(`\n=== ${table} ===`);
  console.log(`${stats.rows} rows, ${stats.withText} with an area line`);
  console.log(`  city has no list (left as text):   ${stats.noList}`);
  console.log(`  already sorted:                    ${stats.already}`);
  console.log(`  sorted into the list now:          ${stats.sorted}   (of these, line fully absorbed: ${stats.fully})`);
  console.log(`  no list name found (left as text): ${stats.untouched}`);
  console.log(`  only the city name again (cleared): ${stats.cityOnly}`);
  if (live) console.log(`  written: ${written}`);
  console.log('  per city (sorted / with a line):');
  for (const [city, c] of Object.entries(byCity).filter(([, v]) => v.total).sort((a, b) => b[1].total - a[1].total)) {
    console.log(`    ${city.padEnd(22)} ${String(c.sorted).padStart(4)} / ${c.total}`);
  }
  return { examples, leftovers };
}

console.log(live ? 'LIVE — writing area_slugs' : 'DRY RUN — nothing is written');
const h = await run('helper_profiles', 'helper_ref', true);
const e = await run('employer_accounts', 'employer_ref', false);
if (process.argv.includes('--examples')) {
  console.log('\n--- examples (helpers) ---'); console.log(h.examples.join('\n'));
  console.log('\n--- examples (families) ---'); console.log(e.examples.join('\n'));
}
if (process.argv.includes('--leftovers')) {
  const top = Object.entries({ ...h.leftovers, ...e.leftovers }).sort((a, b) => b[1] - a[1]).slice(0, 150);
  console.log('\n--- not sorted (most frequent first) ---');
  for (const [k, n] of top) console.log(`  ${String(n).padStart(3)}  ${k}`);
}
