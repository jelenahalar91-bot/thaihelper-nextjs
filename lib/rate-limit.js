// Persistent rate limiter backed by Supabase.
//
// Required because Vercel serverless functions have isolated memory
// per instance — an in-memory Map resets on every cold start, so an
// attacker just keeps hitting a new instance and bypasses the limit.
// A real store (Supabase / KV) is the only correct fix.
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

/**
 * Returns true if the request should be allowed, false if rate-limited.
 * Also records the attempt when allowed, so subsequent calls in the
 * window contribute to the count.
 *
 * @param {object} opts
 * @param {string} opts.bucket    — endpoint / action name ('magic-link', 'login', etc.)
 * @param {string} opts.key       — identifier (IP address, email, user-ref)
 * @param {number} opts.max       — maximum allowed attempts in the window
 * @param {number} opts.windowMs  — window length in milliseconds
 */
export async function checkRateLimit({ bucket, key, max, windowMs }) {
  // Defensive: if we can't identify the caller, allow but log. Blocking
  // requests with a missing IP/key would block legitimate traffic from
  // edge networks where the header is occasionally absent.
  if (!key) {
    console.warn(`[rate-limit] no key for bucket=${bucket} — allowing`);
    return true;
  }

  let supabase;
  try {
    supabase = getServiceSupabase();
  } catch (err) {
    // Misconfigured env — fail open so the app stays available, but log.
    console.error(`[rate-limit] supabase unavailable: ${err.message} — allowing`);
    return true;
  }

  const since = new Date(Date.now() - windowMs).toISOString();

  // Count attempts in the window.
  const { count, error: countErr } = await supabase
    .from('rate_limit_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('bucket', bucket)
    .eq('key', key)
    .gt('created_at', since);

  if (countErr) {
    // DB hiccup — fail open. Better one missed throttle than a totally
    // blocked endpoint during a Supabase blip.
    console.error(`[rate-limit] count failed: ${countErr.message} — allowing`);
    return true;
  }

  if ((count ?? 0) >= max) {
    return false;
  }

  // Record this attempt. We don't await this in the critical path
  // strictly — but doing so keeps the count accurate for the next
  // call. The insert is cheap (single row, indexed).
  const { error: insertErr } = await supabase
    .from('rate_limit_attempts')
    .insert({ bucket, key, created_at: new Date().toISOString() });
  if (insertErr) {
    console.error(`[rate-limit] insert failed: ${insertErr.message}`);
  }

  return true;
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
