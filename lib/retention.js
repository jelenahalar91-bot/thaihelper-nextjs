/**
 * Prune the two tables that only ever grow.
 *
 * Neither is user data anybody asked us to keep, and both carry rows that no
 * code path can read any more:
 *
 *   rate_limit_attempts — one row per throttled action since 2026-05-19.
 *     7,501 rows on 2026-10-14, up from 3,322 two weeks earlier. The table has
 *     a proper index on (bucket, key, created_at DESC), so this was never a
 *     speed problem; it is simply ballast that nothing will ever look at again.
 *
 *   magic_login_tokens — every login link ever issued, with the recipient's
 *     email address and the IP it was requested from. 1,099 rows, of which
 *     zero are still valid: a link lives fifteen minutes.
 *
 * THE TWO RETENTION WINDOWS ARE NOT ARBITRARY.
 *
 * 35 days for rate limits, because the longest window any caller asks for is
 * 30 (OUTREACH_WINDOW_DAYS and CONTACT_SPREAD_WINDOW_DAYS in
 * lib/spam-signals.js; everything else is 24h or less). Deleting inside 30
 * days would quietly lower the outreach caps that hold the spam defence
 * together — an account's counter would reset without anyone changing a
 * threshold. The extra five days are margin for a cron that fails to run.
 * If a longer window is ever introduced, this number has to move first.
 *
 * 30 days for magic links, and deliberately not the one day their function
 * would justify. scripts/restore-jiranan-profile.js rebuilt a wrongly deleted
 * profile partly out of this table — helper_ref and email survived there when
 * the delete script missed it. That was luck rather than design, and there is
 * a real off-site backup since 2026-10-06, but a month of accidental recovery
 * value costs nothing and the PII is still bounded instead of permanent.
 *
 * Only rows that are already spent are removed: used_at set, or expired. A
 * live token is never touched regardless of age.
 *
 * BATCHED, because of the 1000-row cap (reference_supabase_1000_row_cap).
 * These deletes ask for the deleted rows back so they can be counted, and that
 * response is subject to the cap like any other. Whether PostgREST applies the
 * limit to the DELETE itself or only to what it hands back is not something to
 * guess at with 2,112 rows due on the first run: either we would delete a
 * thousand and believe we were done, or delete everything and report a
 * thousand. Looping until a batch comes back empty is correct under both.
 *
 * Called from the daily reminder cron, at both of its exits, after the mail is
 * sent: housekeeping must never be the reason a helper's reminder does not go
 * out. Nothing in here throws.
 */

export const RATE_LIMIT_RETENTION_DAYS = 35;
export const MAGIC_TOKEN_RETENTION_DAYS = 30;

// A ceiling, not a target. 20 batches is at least 20k rows — multiples of any
// plausible day's accumulation — and it stops a bug in the filter from turning
// into an endless loop inside a cron with a function timeout.
const MAX_BATCHES = 20;

function cutoff(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Run `buildDelete()` until it deletes nothing, and return the total.
 * @returns {Promise<number>}
 */
async function deleteInBatches(label, buildDelete) {
  let total = 0;
  for (let i = 0; i < MAX_BATCHES; i += 1) {
    const { data, error } = await buildDelete();
    if (error) throw new Error(error.message);
    const n = (data || []).length;
    total += n;
    if (n === 0) return total;
  }
  console.warn(
    `[retention] ${label}: hit the ${MAX_BATCHES}-batch ceiling at ${total} rows; the rest waits for tomorrow`
  );
  return total;
}

/**
 * @param {object} supabase service-role client
 * @returns {Promise<{rateLimits: number|null, magicTokens: number|null}>}
 *   Counts deleted, or null for a step that failed. Never throws.
 */
export async function pruneExpiredRows(supabase) {
  const result = { rateLimits: null, magicTokens: null };

  try {
    result.rateLimits = await deleteInBatches('rate_limit_attempts', () =>
      supabase
        .from('rate_limit_attempts')
        .delete()
        .lt('created_at', cutoff(RATE_LIMIT_RETENTION_DAYS))
        .select('id')
    );
  } catch (err) {
    console.error('[retention] rate_limit_attempts prune failed:', err.message);
  }

  try {
    result.magicTokens = await deleteInBatches('magic_login_tokens', () =>
      supabase
        .from('magic_login_tokens')
        .delete()
        .lt('created_at', cutoff(MAGIC_TOKEN_RETENTION_DAYS))
        // Spent only: consumed, or past its expiry. A token still live is left
        // alone even if the row somehow predates the window. Re-evaluated per
        // batch on purpose — `now` moving forward can only ever widen this.
        .or(`used_at.not.is.null,expires_at.lt.${new Date().toISOString()}`)
        .select('token')
    );
  } catch (err) {
    console.error('[retention] magic_login_tokens prune failed:', err.message);
  }

  return result;
}
