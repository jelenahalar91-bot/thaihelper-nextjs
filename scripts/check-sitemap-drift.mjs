#!/usr/bin/env node
/**
 * Report pages that exist but are missing from the live sitemap.
 *
 * Why this is needed: vercel.json builds with `next build && next-sitemap`,
 * so next-sitemap DOES run on every deploy -- but `next build` has already
 * collected public/ by the time it writes there, so its fresh sitemap never
 * reaches the deployment. The file that gets served is the COMMITTED
 * public/sitemap-0.xml. A new page therefore stays out of the sitemap until
 * someone runs a build and commits the regenerated file.
 *
 * Proven on 2026-11-02: the live sitemap carried lastmod 2026-10-29T05:30:07Z
 * -- the timestamp of a local build -- an hour older than the deploy that
 * followed it. /press and eight other pages had been missing for weeks.
 *
 * Counting entries does not catch this (222 vs 231 both clear any threshold),
 * so this compares the actual URL set against three sources of truth:
 * the pages directory, the blog post list, and Supabase directory listings.
 *
 *   node scripts/check-sitemap-drift.mjs
 *   node scripts/check-sitemap-drift.mjs --local   # check the committed file
 *
 * Exits 1 when something is missing, so it can gate a release if wanted.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE = 'https://thaihelper.app';
const require = createRequire(import.meta.url);

for (const line of fs.existsSync(path.join(ROOT, '.env.local'))
  ? fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')
  : []) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const useLocal = process.argv.includes('--local');

// Exclusions come from the generator's own config, so the two can never
// disagree about what is deliberately left out.
const sitemapConfig = require(path.join(ROOT, 'next-sitemap.config.js'));
const EXCLUDED = new Set(sitemapConfig.exclude.filter((p) => !p.includes('*')));
// transform() additionally returns null for this one (noindex since
// 2026-06-16, GSC Soft 404), which `exclude` does not express.
EXCLUDED.add('/employers-browse');

/** Top-level routes that next-sitemap discovers from the build output. */
function staticRoutes() {
  return fs.readdirSync(path.join(ROOT, 'pages'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => '/' + f.replace(/\.js$/, ''))
    .filter((r) => !r.startsWith('/_'))
    .filter((r) => !['/404', '/500', '/index'].includes(r))
    .filter((r) => !r.includes('['))
    .filter((r) => !EXCLUDED.has(r));
}

/** Blog slugs, read the same way next-sitemap.config.js reads them. */
function blogRoutes() {
  const src = fs.readFileSync(path.join(ROOT, 'content/blog/posts.js'), 'utf8');
  return [...src.matchAll(/^\s*slug:\s*['"]([a-z0-9-]+)['"]/gm)].map((m) => `/blog/${m[1]}`);
}

/** Active directory listings live in Supabase, not in the repo. */
async function directoryRoutes() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { routes: [], skipped: true };
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('directory_listings')
    .select('slug')
    .eq('status', 'active');
  if (error) return { routes: [], skipped: true, error: error.message };
  return { routes: data.filter((r) => r.slug).map((r) => `/directory/${r.slug}`), skipped: false };
}

async function liveSitemap() {
  const res = await fetch(`${SITE}/sitemap-0.xml`, { headers: { 'User-Agent': 'thaihelper-sitemap-check' } });
  if (!res.ok) throw new Error(`sitemap-0.xml antwortete ${res.status}`);
  return res.text();
}

function committedSitemap() {
  return fs.readFileSync(path.join(ROOT, 'public/sitemap-0.xml'), 'utf8');
}

const xml = useLocal ? committedSitemap() : await liveSitemap();
const inSitemap = new Set(
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '') || '/'),
);

const dir = await directoryRoutes();
const expected = [...staticRoutes(), ...blogRoutes(), ...dir.routes];
const missing = expected.filter((r) => !inSitemap.has(r));

const lastmod = [...new Set([...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1].slice(0, 10)))];

console.log(`\nSitemap: ${useLocal ? 'public/sitemap-0.xml (committet)' : SITE + '/sitemap-0.xml (live)'}`);
console.log(`  ${inSitemap.size} URLs, erzeugt am ${lastmod.join(', ')}`);
console.log(`  geprüft: ${expected.length} erwartete Seiten${dir.skipped ? ' (ohne Verzeichnis — Supabase nicht erreichbar)' : ''}`);

if (missing.length === 0) {
  console.log('\n✅ Keine Lücken.\n');
  process.exit(0);
}

console.log(`\n❌ ${missing.length} Seite(n) fehlen im Sitemap:\n`);
for (const r of missing) console.log(`   ${r}`);
console.log('\nSo behebst du das:');
console.log('   npm run build && git add public/sitemap-0.xml && git commit && git push');
console.log('(Die Datei MUSS committet werden — der Vercel-Build erzeugt sie zwar neu,');
console.log(' aber zu spät: next build hat public/ da schon eingesammelt.)\n');
process.exit(1);
