/**
 * Lightweight email typo detector — same idea as the `mailcheck`
 * library but inlined so we don't pull in a dependency for ~30 lines
 * of logic.
 *
 * Strategy:
 *  1. Split on `@`. If the domain is already in the known-good list,
 *     no suggestion.
 *  2. Otherwise, find the closest known domain by Levenshtein
 *     distance. Suggest only if the distance is 1 or 2 — that catches
 *     typos like "gmaip.com", "gmial.com", "yaho.com" without false-
 *     positiving on "myanmar.com" or other intentional uncommon
 *     domains.
 *  3. Return the corrected full address (`user@gmail.com`) so the UI
 *     can offer a one-click "use this instead" button.
 *
 * Usage:
 *   import { suggestEmail } from '@/lib/email-typo';
 *   const suggestion = suggestEmail('foo@gmaip.com');
 *   // → 'foo@gmail.com'
 */

// Domains that account for the vast majority of real signups in
// Thailand: global webmail + Thai/EU/Russian providers we've seen on
// the platform. Adding a domain here means typos that are 1-2 chars
// away from it will be auto-suggested.
const COMMON_DOMAINS = [
  // Global
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'ymail.com',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me',
  'aol.com',
  // Thailand-relevant
  'yahoo.co.th', 'hotmail.co.th',
  // German
  'web.de', 'gmx.de', 'gmx.net', 't-online.de', 'freenet.de',
  // Russian (we get a few RU-speaking expats)
  'mail.ru', 'yandex.ru', 'rambler.ru', 'inbox.ru',
  // Other regional
  'yahoo.es', 'yahoo.fr', 'yahoo.de', 'yahoo.co.uk',
];

// Levenshtein distance — minimal allocation, fine for short strings.
function lev(a, b) {
  if (a === b) return 0;
  if (a.length < b.length) { const t = a; a = b; b = t; }
  let prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 0; i < a.length; i++) {
    const curr = [i + 1];
    for (let j = 0; j < b.length; j++) {
      curr.push(Math.min(
        curr[j] + 1,        // insertion
        prev[j + 1] + 1,    // deletion
        prev[j] + (a[i] === b[j] ? 0 : 1), // substitution
      ));
    }
    prev = curr;
  }
  return prev[b.length];
}

/**
 * @param {string} email
 * @returns {string|null} a corrected email address, or null if the
 *   input looks fine or there's no confident suggestion.
 */
export function suggestEmail(email) {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return null;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);

  // Known-good domain — nothing to suggest.
  if (COMMON_DOMAINS.includes(domain)) return null;

  // Find the closest known domain. Allow distance 1 for short domains
  // (gmail.com → 9 chars) and distance 2 for longer ones; cap at 2 so
  // "myanmar.com" stays unsuggested (it would otherwise pull "yandex.ru"
  // or similar with distance 5+).
  let best = null;
  let bestDist = Infinity;
  for (const candidate of COMMON_DOMAINS) {
    const d = lev(domain, candidate);
    if (d < bestDist) { bestDist = d; best = candidate; }
  }

  // Only suggest when we're confident: edit distance 1 or 2, and the
  // suggested domain is at least as long as the input minus 1 (avoids
  // suggesting "aol.com" for things like "myaol.com.th").
  if (best && bestDist >= 1 && bestDist <= 2 && best.length >= domain.length - 1) {
    return `${local}@${best}`;
  }
  return null;
}
