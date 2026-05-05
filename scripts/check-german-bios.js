#!/usr/bin/env node
/**
 * Scan helper bios + directory descriptions for German text — used to
 * track down stray German copy that the user noticed on the live site.
 *
 * Usage:  node scripts/check-german-bios.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

// Distinctively-German tokens — chosen so we don't false-positive on
// English text. "Bueros", "Kanzlei", "Mitglied", "verfügbar" are
// reliable; "ich/bin/ist" by themselves match too many false positives,
// so we require at least two distinct German tokens to flag a row.
const GERMAN_TOKENS = [
  /\bbueros?\b/i, /\bkanzlei\b/i, /\bmitglied\b/i, /\bverf(ü|ue)gbar\b/i,
  /\bgeoeffnet\b/i, /\bgeöffnet\b/i, /\bich\b/i, /\bbin\b/i, /\bnicht\b/i,
  /\bsehr\b/i, /\bjahre\b/i, /\bjahren\b/i, /\berfahrung\b/i, /\berfahren\b/i,
  /\bfamilie\b/i, /\bfamilien\b/i, /\bkinder\b/i, /\bstunden\b/i,
  /\bspezialisier(t|t auf)\b/i, /\bbetreuung\b/i, /\bkonzern\b/i,
  /\beher\b/i, /\bgrosse\b/i, /\bgroße\b/i, /\bauch\b/i, /\bf(ü|ue)r\b/i,
  /\b(ä|ae|ö|oe|ü|ue|ß)/i,
];

function germanScore(text) {
  if (!text) return 0;
  return GERMAN_TOKENS.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);
}

(async () => {
  // Helper bios
  const { data: helpers } = await supabase
    .from('helper_profiles')
    .select('helper_ref, first_name, last_name, bio, bio_en, languages, status');

  const flaggedH = (helpers || []).filter(h => {
    const score = germanScore((h.bio || '') + ' ' + (h.bio_en || ''));
    return score >= 2;
  });

  console.log(`Helpers with possibly German bio: ${flaggedH.length} of ${(helpers || []).length}\n`);
  flaggedH.forEach(h => {
    console.log(`  ${h.helper_ref}  ${h.first_name} ${h.last_name?.[0] || ''}.  langs: ${h.languages || ''}`);
    if (h.bio)    console.log(`    bio:    ${h.bio.slice(0, 220).replace(/\s+/g, ' ')}`);
    if (h.bio_en) console.log(`    bio_en: ${h.bio_en.slice(0, 220).replace(/\s+/g, ' ')}`);
    console.log();
  });

  // Directory descriptions
  const { data: listings } = await supabase
    .from('directory_listings')
    .select('slug, name, description, description_th');

  const flaggedD = (listings || []).filter(l => germanScore(l.description) >= 2);
  console.log(`\nDirectory listings with possibly German description: ${flaggedD.length} of ${(listings || []).length}\n`);
  flaggedD.forEach(l => {
    console.log(`  ${l.slug.padEnd(42)} ${l.description?.slice(0, 100)}`);
  });
})();
