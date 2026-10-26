/**
 * Lightweight email typo detector — same idea as the `mailcheck`
 * library but inlined so we don't pull in a dependency.
 *
 * The detector is deliberately asymmetric: a missed typo costs us one
 * unverified signup (the verification mail bounces and nobody clicks
 * it), while a false positive costs us the whole registration — the
 * person cannot create an account at all. So every rule here errs
 * towards staying quiet.
 *
 * Strategy:
 *  1. Known-good domain → no suggestion.
 *  2. The domain's first label is a mail provider we recognise
 *     ("hotmail", "gmx", "yahoo", …) and its suffix is a real public
 *     suffix → no suggestion. This is what keeps `hotmail.ch`,
 *     `gmx.at`, `yahoo.it` and `protonmail.ch` registerable: a
 *     provider's country variants are not typos of its .com.
 *     Providers that only ever exist on one suffix (gmail, icloud, …)
 *     are pinned, so `gmail.co` and `gmail.cm` are still caught.
 *  3. Otherwise fall back to edit distance against the known domains
 *     and suggest only at distance 1 — counting an adjacent swap as
 *     one edit, so "gmial.com" and "hotmial.com" are caught while
 *     "qq.com" and "mail.de" (distance 2 from anything) are left
 *     alone.
 *
 * Usage:
 *   import { suggestEmail } from '@/lib/email-typo';
 *   const suggestion = suggestEmail('foo@gmaip.com');
 *   // → 'foo@gmail.com'
 */

// Domains that account for the vast majority of real signups in
// Thailand: global webmail + Thai/EU/Russian providers we've seen on
// the platform. Adding a domain here means one-edit typos of it will
// be auto-suggested.
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

// Mail providers keyed by the first label of their domain. `ANY` means
// the provider runs mailboxes on many country suffixes, so any real
// suffix is accepted as-is. An array means the provider only exists on
// those suffixes — anything else is a confident typo and gets
// corrected to the first entry.
const ANY = '*';
const PROVIDERS = {
  // .com-only: a different suffix here is always a typo.
  gmail: ['com'],
  googlemail: ['com'],
  icloud: ['com'],
  me: ['com'],
  mac: ['com'],
  // Run on many ccTLDs — hotmail.ch, gmx.at, yahoo.it, protonmail.ch …
  hotmail: ANY, outlook: ANY, live: ANY, msn: ANY,
  yahoo: ANY, ymail: ANY, rocketmail: ANY,
  aol: ANY, gmx: ANY, web: ANY, mail: ANY,
  proton: ANY, protonmail: ANY,
  't-online': ANY, freenet: ANY, arcor: ANY, posteo: ANY,
  yandex: ANY, rambler: ANY, inbox: ANY, bk: ANY, list: ANY,
};

// ISO 3166-1 alpha-2 country codes (plus `eu`, `su`, `uk`) — every
// two-letter suffix a real address can end in.
const CC_TLDS = new Set(('ac ad ae af ag ai al am ao aq ar as at au aw ax az ba bb bd be bf bg bh bi bj bm bn bo br bs bt '
  + 'bw by bz ca cc cd cf cg ch ci ck cl cm cn co cr cu cv cw cx cy cz de dj dk dm do dz ec ee eg eh er es et eu fi fj fk '
  + 'fm fo fr ga gb gd ge gf gg gh gi gl gm gn gp gq gr gt gu gw gy hk hn hr ht hu id ie il im in io iq ir is it je jm jo '
  + 'jp ke kg kh ki km kn kp kr kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md me mg mh mk ml mm mn mo mp mq mr ms mt '
  + 'mu mv mw mx my mz na nc ne nf ng ni nl no np nr nu nz om pa pe pf pg ph pk pl pm pn pr ps pt pw py qa re ro rs ru rw '
  + 'sa sb sc sd se sg sh si sk sl sm sn so sr ss st su sv sx sy sz tc td tg th tj tk tl tm tn to tr tt tv tw tz ua ug uk '
  + 'us uy uz va vc ve vg vi vn vu wf ws ye yt za zm zw').split(' '));

// The generic suffixes people actually hold mailboxes on.
const GENERIC_TLDS = new Set(('com net org info biz edu gov mil int pro name mobi asia email mail cloud online site xyz '
  + 'dev app page link live life world today team group work agency company tech digital media house studio global '
  + 'network solutions services shop store blog one plus club').split(' '));

// Labels that legitimately sit in front of a country code, as in
// `hotmail.co.uk` or `yahoo.com.au`.
const SECOND_LEVEL = new Set('co com or ne net org ac gov edu in id'.split(' '));

// Two-letter suffixes that are real country codes but, on a global
// webmail provider, are overwhelmingly a slipped ".com".
const SUSPECT_SUFFIXES = new Set('co cm om on'.split(' '));

/**
 * Does `suffix` look like a real public suffix ("de", "co.uk", "com")?
 */
function isPublicSuffix(suffix) {
  const parts = suffix.split('.');
  if (parts.length === 1) {
    return CC_TLDS.has(parts[0]) || GENERIC_TLDS.has(parts[0]);
  }
  if (parts.length === 2) {
    return SECOND_LEVEL.has(parts[0]) && CC_TLDS.has(parts[1]);
  }
  return false;
}

/**
 * Judge a domain by its provider label.
 * @returns {{ok: true} | {fix: string} | null} `ok` when the domain is a
 *   real provider variant, `fix` when the label is a one-suffix
 *   provider used with the wrong suffix, `null` when we don't
 *   recognise the label at all.
 */
function providerVerdict(domain) {
  const dot = domain.indexOf('.');
  if (dot <= 0) return null;
  const label = domain.slice(0, dot);
  const suffix = domain.slice(dot + 1);

  const allowed = Object.prototype.hasOwnProperty.call(PROVIDERS, label)
    ? PROVIDERS[label]
    : null;
  if (!allowed) return null;

  if (allowed === ANY) {
    // A real suffix on a multi-country provider is not a typo; a
    // ".com" near-miss still is.
    if (!isPublicSuffix(suffix) || SUSPECT_SUFFIXES.has(suffix)) return null;
    return { ok: true };
  }

  if (allowed.includes(suffix)) return { ok: true };
  // e.g. gmail.co, gmail.cm, gmail.de — the label pins the domain.
  return { fix: `${label}.${allowed[0]}` };
}

// Optimal string alignment distance — Levenshtein plus adjacent
// transpositions, so a swapped pair ("gmial") counts as one typo.
function editDistance(a, b) {
  if (a === b) return 0;
  const rows = [];
  for (let i = 0; i <= a.length; i++) rows.push(new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) rows[i][0] = i;
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(
        rows[i - 1][j] + 1,        // deletion
        rows[i][j - 1] + 1,        // insertion
        rows[i - 1][j - 1] + cost, // substitution
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d = Math.min(d, rows[i - 2][j - 2] + 1); // transposition
      }
      rows[i][j] = d;
    }
  }
  return rows[a.length][b.length];
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

  const verdict = providerVerdict(domain);
  if (verdict && verdict.ok) return null;
  if (verdict && verdict.fix) return `${local}@${verdict.fix}`;

  // Unrecognised label: only correct a single slip of the finger. Two
  // edits is where the false positives live — "qq.com" is two edits
  // from "me.com" and perfectly real.
  let best = null;
  let bestDist = Infinity;
  for (const candidate of COMMON_DOMAINS) {
    const d = editDistance(domain, candidate);
    if (d < bestDist) { bestDist = d; best = candidate; }
  }
  if (best && bestDist === 1) return `${local}@${best}`;
  return null;
}
