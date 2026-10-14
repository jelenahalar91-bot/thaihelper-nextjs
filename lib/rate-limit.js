// Persistent rate limiter backed by Supabase.
//
// Required because Vercel serverless functions have isolated memory
// per instance — an in-memory Map resets on every cold start, so an
// attacker just keeps hitting a new instance and bypasses the limit.
// A real store (Supabase / KV) is the only correct fix.
//
// The decision is made inside Postgres, by public.rate_limit_hit() — see
// scripts/supabase-rate-limit-atomic.sql. This file used to count the rows in
// the window, compare, and then insert, which meant the number it decided on
// was already out of date: requests arriving together all read the same count
// and all got a slot, however many of them there were. That is the limit that
// matters least on /api/auth and most on /api/phone/signup-send-otp, where
// every leaked slot is an SMS somebody paid for.
//
// Usage:
//   import { checkRateLimit } from '@/lib/rate-limit';
//   const allowed = await checkRateLimit({
//     bucket: 'magic-link',
//     key: ip,
//     max: 10,
//     windowMs: 15 * 60 * 1000,
//   });
//   if (!allowed) return res.status(429).json({ error: 'Too many requests' });

import { getServiceSupabase } from './supabase';

// PostgREST says PGRST202 when the function is not in its schema cache;
// Postgres says 42883 when it does not exist at all. Either way the migration
// has not been run, which is a different problem from a database hiccup and
// needs saying differently.
const MISSING_FUNCTION = new Set(['PGRST202', '42883']);

/**
 * What to answer when we could not reach a verdict.
 *
 * Fail open by default: better one missed throttle than a login page that is
 * down for everybody because Supabase blinked.
 *
 * Fail closed where a leaked slot costs money. The phone routes pass
 * failClosed because the argument for staying open does not hold there — if
 * the database is unreachable the signup cannot finish anyway (the profile
 * insert needs the same connection), so allowing the send buys nobody a
 * working signup and buys an attacker free SMS.
 */
function onNoVerdict({ bucket, failClosed, reason }) {
  const verdict = failClosed ? 'blocking' : 'allowing';
  console.error(`[rate-limit] ${bucket}: ${reason} — ${verdict}`);
  return !failClosed;
}

/**
 * Returns true if the request should be allowed, false if rate-limited.
 * Records the attempt as part of the same decision, so a request that is
 * allowed counts towards the next one.
 *
 * @param {object} opts
 * @param {string} opts.bucket      — endpoint / action name ('magic-link', 'login', etc.)
 * @param {string} opts.key         — identifier (IP address, email, user-ref)
 * @param {number} opts.max         — maximum allowed attempts in the window
 * @param {number} opts.windowMs    — window length in milliseconds
 * @param {boolean} [opts.failClosed=false] — deny rather than allow when the
 *   limiter itself cannot answer. See onNoVerdict().
 */
export async function checkRateLimit({ bucket, key, max, windowMs, failClosed = false }) {
  // Defensive: if we can't identify the caller, allow but log. Blocking
  // requests with a missing IP/key would block legitimate traffic from
  // edge networks where the header is occasionally absent. Not a failure of
  // the limiter, so failClosed does not apply.
  if (!key) {
    console.warn(`[rate-limit] no key for bucket=${bucket} — allowing`);
    return true;
  }

  let supabase;
  try {
    supabase = getServiceSupabase();
  } catch (err) {
    return onNoVerdict({ bucket, failClosed, reason: `supabase unavailable: ${err.message}` });
  }

  const { data, error } = await supabase.rpc('rate_limit_hit', {
    p_bucket: bucket,
    p_key: key,
    p_max: max,
    p_window_ms: windowMs,
  });

  if (error) {
    if (MISSING_FUNCTION.has(error.code)) {
      return onNoVerdict({
        bucket,
        failClosed,
        reason: 'rate_limit_hit() is missing — run scripts/supabase-rate-limit-atomic.sql',
      });
    }
    return onNoVerdict({ bucket, failClosed, reason: `rpc failed: ${error.message}` });
  }

  // The function returns a plain boolean. Anything else means we did not
  // understand the answer, and guessing "allowed" would be the wrong guess.
  if (typeof data !== 'boolean') {
    return onNoVerdict({ bucket, failClosed, reason: `unexpected reply: ${JSON.stringify(data)}` });
  }

  return data;
}

/**
 * How many attempts are on record for this bucket/key inside the window.
 * Unlike checkRateLimit this records nothing — use it when the caller needs
 * the actual number (e.g. to warn before a threshold is reached).
 *
 * Fails open with 0, for the same reason checkRateLimit fails open: a DB
 * blip must never turn into a blocked endpoint.
 */
export async function countRateLimit({ bucket, key, windowMs }) {
  if (!key) return 0;

  let supabase;
  try {
    supabase = getServiceSupabase();
  } catch (err) {
    console.error(`[rate-limit] supabase unavailable: ${err.message} — counting 0`);
    return 0;
  }

  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await supabase
    .from('rate_limit_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('bucket', bucket)
    .eq('key', key)
    .gt('created_at', since);

  if (error) {
    console.error(`[rate-limit] count failed: ${error.message} — counting 0`);
    return 0;
  }
  return count ?? 0;
}

/**
 * Record one attempt without checking any limit. For flows that decide on
 * their own (via countRateLimit) whether the action is allowed.
 */
export async function recordRateLimit({ bucket, key }) {
  if (!key) return;
  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('rate_limit_attempts')
      .insert({ bucket, key, created_at: new Date().toISOString() });
    if (error) console.error(`[rate-limit] insert failed: ${error.message}`);
  } catch (err) {
    console.error(`[rate-limit] record failed: ${err.message}`);
  }
}
