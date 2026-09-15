/**
 * Is this account suspended? — asked on the authenticated hot path.
 *
 * Until 2026-09-15 a suspension only closed two doors: the credential-login
 * endpoints, and hasActiveAccess() (messaging). It never touched a session
 * that already existed. With SESSION_DAYS = 365 that meant a suspension did
 * not reach anyone who was already logged in — EMP-3THHAA kept browsing
 * helper profiles for four days after it was suspended, and EMP-572KZV did
 * the same. The sanction existed in the database and nowhere else.
 *
 * So lib/auth.js now checks this on every session validation, which puts a
 * DB read in front of nearly every authenticated request on the site. Hence
 * the cache: the set of suspended refs is tiny (single digits, and it grows
 * by a handful a month), so the whole set is loaded at once and reused for a
 * minute rather than asking about one ref per request.
 *
 * ONE MINUTE OF LAG IS THE DELIBERATE COST. It is affordable here — and only
 * here — because the doors that matter are also checked live and uncached:
 * hasActiveAccess() (lib/access.js) reads the account row on every send, and
 * both magic-link endpoints read `status` straight from the DB. A session
 * surviving 60 extra seconds can read, but it cannot message and it cannot
 * mint a new session. Do NOT reuse this cache for either of those.
 *
 * Company accounts are out of scope: company_accounts.status carries a
 * different vocabulary (approval state), where 'suspended' is not the same
 * claim. Adding them means checking that column's semantics first.
 */
import { getServiceSupabase } from './supabase';

const TTL_MS = 60 * 1000;

// Shared across requests in the same serverless instance. A cold instance
// simply loads it once.
let cached = null;      // Set<string> | null — last successful load
let cachedAt = 0;
let inFlight = null;    // dedupes concurrent loads within one instance

async function fetchSuspendedRefs() {
  const supabase = getServiceSupabase();
  const [helpers, employers] = await Promise.all([
    supabase.from('helper_profiles').select('helper_ref').eq('status', 'suspended'),
    supabase.from('employer_accounts').select('employer_ref').eq('status', 'suspended'),
  ]);
  if (helpers.error) throw new Error(helpers.error.message);
  if (employers.error) throw new Error(employers.error.message);

  const refs = new Set();
  for (const row of helpers.data || []) refs.add(row.helper_ref);
  for (const row of employers.data || []) refs.add(row.employer_ref);
  return refs;
}

async function loadSuspendedRefs() {
  if (cached && Date.now() - cachedAt < TTL_MS) return cached;
  if (inFlight) return inFlight;

  inFlight = fetchSuspendedRefs()
    .then((refs) => {
      cached = refs;
      cachedAt = Date.now();
      return refs;
    })
    .catch((err) => {
      console.error('[suspension] refresh failed:', err.message);
      // Keep serving the last known set rather than failing either way: a
      // transient DB error must not log the whole site out, and it must not
      // hand a suspended account a clean slate either. Only an instance that
      // has never loaded the set falls through to "nobody is suspended", and
      // there the live checks in lib/access.js still hold the line.
      return cached;
    })
    .finally(() => { inFlight = null; });

  return inFlight;
}

/**
 * @param {string} ref  EMP-XXXXXX or TH-XXXXXX
 * @returns {Promise<boolean>} true only when the ref is known to be suspended
 */
export async function isRefSuspended(ref) {
  if (!ref) return false;
  const refs = await loadSuspendedRefs();
  return refs ? refs.has(ref) : false;
}

/** Drop the cache — for scripts and tests that suspend and then assert. */
export function resetSuspensionCache() {
  cached = null;
  cachedAt = 0;
}
