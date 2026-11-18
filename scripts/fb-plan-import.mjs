#!/usr/bin/env node
/**
 * Redaktionsplan aus einem marketing/fb-plan-<monat>-Ordner (plan.mjs) in die
 * Tabelle fb_scheduled_posts spielen. Danach uebernimmt /api/cron/fb-post.
 *
 *   node scripts/fb-plan-import.mjs                      # Vorschau, schreibt nichts
 *   node scripts/fb-plan-import.mjs --commit             # schreibt
 *   node scripts/fb-plan-import.mjs --plan marketing/fb-plan-2026-11/plan.mjs
 *
 * Upsert laeuft ueber `slug`. Eine Zeile, die schon 'posted' ist, wird nicht
 * angefasst — ein zweiter Import kann also nichts doppelt veroeffentlichen und
 * auch keinen bereits gelaufenen Post ruecksetzen. Offene Zeilen werden mit
 * Text und Datum aus dem Plan ueberschrieben, damit eine Korrektur am Plan
 * wirklich ankommt.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// .env.local laden (wie in den anderen Skripten hier).
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const args = process.argv.slice(2);
const COMMIT = args.includes('--commit');
const planArg = args[args.indexOf('--plan') + 1];
const PLAN = args.includes('--plan') && planArg
  ? path.resolve(ROOT, planArg)
  : path.join(ROOT, 'marketing', 'fb-plan-2026-11', 'plan.mjs');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen in .env.local');
  process.exit(1);
}

/**
 * "2026-11-20 19:00" in Bangkok ist 12:00 UTC. Thailand hat keine Sommerzeit,
 * der Versatz ist ganzjaehrig +07:00 — deshalb reicht das feste Suffix und es
 * braucht keine Zeitzonen-Bibliothek.
 */
function bangkokToUtc(local) {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!m) throw new Error(`Datum nicht im Format YYYY-MM-DD HH:MM: ${local}`);
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+07:00`).toISOString();
}

const { buildPlan } = await import(pathToFileURL(PLAN).href);
const plan = buildPlan();

// Sanity-Checks, bevor irgendetwas in die Datenbank geht.
const problems = [];
const seen = new Set();
for (const p of plan) {
  if (seen.has(p.slug)) problems.push(`doppelter slug: ${p.slug}`);
  seen.add(p.slug);
  if (!p.message || !p.message.trim()) problems.push(`${p.slug}: kein Text`);
  if (p.link && p.image_url) problems.push(`${p.slug}: link UND image_url — Facebook nimmt nur eins`);
  if (p.link && !p.link.startsWith('https://www.thaihelper.app')) {
    problems.push(`${p.slug}: Link ohne www.thaihelper.app — ${p.link}`);
  }
  if (p.message.length > 5000) problems.push(`${p.slug}: Text laenger als 5000 Zeichen`);
  try {
    bangkokToUtc(p.date);
  } catch (e) {
    problems.push(`${p.slug}: ${e.message}`);
  }
}
if (problems.length) {
  console.error('Plan fehlerhaft:');
  problems.forEach((p) => console.error('  - ' + p));
  process.exit(1);
}

const supabase = createClient(url, key);

const { data: existing, error: readErr } = await supabase
  .from('fb_scheduled_posts')
  .select('slug, status, scheduled_at')
  .in('slug', plan.map((p) => p.slug));
if (readErr) {
  console.error('Lesen fehlgeschlagen:', readErr.message);
  process.exit(1);
}
const byStatus = new Map((existing || []).map((r) => [r.slug, r.status]));

const toWrite = [];
let untouched = 0;
for (const p of plan) {
  const status = byStatus.get(p.slug);
  if (status === 'posted') {
    untouched++;
    continue;
  }
  toWrite.push({
    slug: p.slug,
    scheduled_at: bangkokToUtc(p.date),
    message: p.message,
    link: p.link,
    image_url: p.image_url,
    audience: p.audience,
    // Ein zuvor gescheiterter Post bekommt mit dem Import eine neue Chance.
    status: 'pending',
    attempts: 0,
    last_error: null,
    updated_at: new Date().toISOString(),
  });
}

console.log(`Plan:      ${PLAN.replace(ROOT + '/', '')}`);
console.log(`Posts:     ${plan.length}`);
console.log(`Zeitraum:  ${plan[0].date} → ${plan[plan.length - 1].date} (Bangkok)`);
console.log(`Schreiben: ${toWrite.length}   bereits gepostet, unangetastet: ${untouched}`);
console.log();
for (const p of plan) {
  const mark = byStatus.get(p.slug) === 'posted' ? '✓ raus ' : '· offen';
  const kind = p.link ? 'Link ' : p.image_url ? 'Bild ' : 'Text ';
  console.log(`${mark} ${p.date}  ${kind} ${p.audience.padEnd(8)} ${p.slug}`);
}

if (!COMMIT) {
  console.log('\nVorschau — nichts geschrieben. Mit --commit ausfuehren.');
  process.exit(0);
}

const { error: upErr } = await supabase
  .from('fb_scheduled_posts')
  .upsert(toWrite, { onConflict: 'slug' });
if (upErr) {
  console.error('\nSchreiben fehlgeschlagen:', upErr.message);
  process.exit(1);
}
console.log(`\n${toWrite.length} Zeile(n) geschrieben.`);
