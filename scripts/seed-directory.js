#!/usr/bin/env node
/**
 * Seeds directory_listings with the researched lawyers, visa agents and
 * MOU agencies from scripts/directory-seed.json.
 *
 * Usage:
 *   node scripts/seed-directory.js [--dry-run]
 *
 * Re-runnable: uses upsert on the unique slug, so re-running with a
 * tweaked JSON file updates existing rows in place rather than duplicating
 * them.
 *
 * Source data: scripts/directory-seed.json (originally extracted from
 * "Anwaltsverzeichnis-Recherche.xlsx" — Sheet "Verzeichnis"). Edit the
 * JSON, re-run this script, and Supabase reflects the change. Listings
 * default to tier='free' and verified=false; promote them via the admin
 * dashboard once they confirm interest.
 *
 * Requires the same env vars as the rest of the app:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (or SUPABASE_SERVICE_KEY)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local if present so this script works when run directly.
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!m) return;
      const [, k, raw] = m;
      if (!process.env[k]) {
        // Strip surrounding quotes if present.
        process.env[k] = raw.replace(/^['"]|['"]$/g, '');
      }
    });
  }
} catch (err) {
  console.warn('Could not load .env.local:', err.message);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const SEED_PATH = path.join(__dirname, 'directory-seed.json');

if (!fs.existsSync(SEED_PATH)) {
  console.error(`Seed file not found: ${SEED_PATH}`);
  process.exit(1);
}

const listings = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));

// Validate before we touch the DB — fail loud rather than insert garbage.
const ALLOWED_TYPES   = ['lawyer', 'visa_agent', 'mou_agency', 'agency'];
const ALLOWED_TIERS   = ['free', 'premium', 'featured'];
const ALLOWED_STATUS  = ['active', 'inactive', 'pending'];

const errors = [];
listings.forEach((l, i) => {
  if (!l.slug) errors.push(`#${i + 1}: missing slug`);
  if (!l.name) errors.push(`#${i + 1}: missing name`);
  if (!l.city) errors.push(`#${i + 1}: missing city`);
  if (!ALLOWED_TYPES.includes(l.type))    errors.push(`#${i + 1}: bad type "${l.type}"`);
  if (l.tier && !ALLOWED_TIERS.includes(l.tier))     errors.push(`#${i + 1}: bad tier "${l.tier}"`);
  if (l.status && !ALLOWED_STATUS.includes(l.status)) errors.push(`#${i + 1}: bad status "${l.status}"`);
});

if (errors.length) {
  console.error('Validation errors:');
  errors.forEach(e => console.error('  ' + e));
  process.exit(1);
}

(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Seeding ${listings.length} directory listings (${dryRun ? 'DRY RUN' : 'WRITE'})...`);

  if (dryRun) {
    listings.forEach(l => console.log(`  ✔ ${l.slug.padEnd(40)} ${l.type.padEnd(10)} ${l.city}`));
    console.log('Dry run complete. No changes written.');
    return;
  }

  // Upsert by slug so the script is idempotent.
  const { data, error } = await supabase
    .from('directory_listings')
    .upsert(listings, { onConflict: 'slug' })
    .select('id, slug');

  if (error) {
    console.error('Upsert failed:', error);
    process.exit(1);
  }

  console.log(`✓ Upserted ${data.length} listings.`);
  data.forEach(d => console.log(`  ${d.slug}  →  ${d.id}`));
})();
