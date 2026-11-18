#!/usr/bin/env node
/**
 * Prueft, ob FB_PAGE_ID und FB_PAGE_ACCESS_TOKEN funktionieren — ohne etwas
 * zu posten. Vor dem ersten Cron-Lauf einmal ausfuehren, und immer dann, wenn
 * die Alarmmail "Facebook-Token ungueltig" kam.
 *
 *   node scripts/fb-token-check.mjs
 *
 * Zeigt zusaetzlich an, wann das Token ablaeuft. Ein System-User-Token hat
 * kein Ablaufdatum ("never") — steht dort ein Datum, ist es das falsche
 * Token und die Automation stirbt an genau diesem Tag.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const GRAPH = 'https://graph.facebook.com/v21.0';
const pageId = process.env.FB_PAGE_ID;
const token = process.env.FB_PAGE_ACCESS_TOKEN;

if (!pageId || !token) {
  console.error('FB_PAGE_ID oder FB_PAGE_ACCESS_TOKEN fehlt in .env.local');
  process.exit(1);
}

async function get(url) {
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.error) {
    const e = json && json.error ? json.error : {};
    throw new Error(`${e.type || 'HTTP ' + res.status} ${e.code || ''}: ${e.message || ''}`);
  }
  return json;
}

try {
  const page = await get(`${GRAPH}/${pageId}?fields=id,name,fan_count&access_token=${encodeURIComponent(token)}`);
  console.log(`Seite:      ${page.name} (${page.id})`);
  console.log(`Follower:   ${page.fan_count ?? '—'}`);

  // debug_token sagt, welche Rechte das Token hat und ob es ablaeuft.
  const dbg = await get(
    `${GRAPH}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`
  );
  const d = dbg.data || {};
  const expires = d.expires_at ? new Date(d.expires_at * 1000).toISOString().slice(0, 10) : 'never';
  console.log(`Typ:        ${d.type || '—'}`);
  console.log(`Laeuft ab:  ${expires}`);
  console.log(`Rechte:     ${(d.scopes || []).join(', ') || '—'}`);

  const scopes = d.scopes || [];
  if (!scopes.includes('pages_manage_posts')) {
    console.log('\n⚠  pages_manage_posts fehlt — Posten wird scheitern.');
    process.exit(2);
  }
  if (expires !== 'never') {
    console.log(`\n⚠  Dieses Token laeuft am ${expires} ab. Fuer den Dauerbetrieb ein`);
    console.log('   System-User-Token aus dem Business Manager verwenden, das laeuft nie ab.');
    process.exit(2);
  }
  console.log('\n✓ Token ist gueltig und laeuft nicht ab.');
} catch (e) {
  console.error('Fehlgeschlagen:', e.message);
  process.exit(1);
}
