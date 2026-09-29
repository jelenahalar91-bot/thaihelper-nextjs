/**
 * Supabase client setup.
 * - Client-side: anon key (for Realtime subscriptions)
 * - Server-side: service role key (for API routes, bypasses RLS)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client-side Supabase (anon key) — use for Realtime subscriptions only
let clientInstance = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase client credentials not configured');
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
}

// Server-side Supabase (service role key) — use in API routes
let serviceInstance = null;

export function getServiceSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase service credentials not configured');
  }
  if (!serviceInstance) {
    serviceInstance = createClient(supabaseUrl, supabaseServiceKey);
  }
  return serviceInstance;
}

// PostgREST answers every request with at most 1000 rows (Supabase's
// `db-max-rows`). It does not error and it sets no flag you can check from
// the JS client — the list simply stops, and the caller cannot tell a
// complete answer from a truncated one.
//
// The browse page found that out the hard way: helper #1001 registered and
// the three oldest profiles quietly vanished from /helpers.
//
// Any query that must return *every* matching row goes through selectAll()
// instead of a bare .select().
export const SUPABASE_MAX_ROWS = 1000;

/**
 * Run a query page by page until the table is exhausted.
 *
 * Takes a *factory*, not a query: a PostgREST builder is a one-shot
 * thenable, so each page needs a freshly built one.
 *
 * The factory must impose a total order — `.order()` on a unique column, or
 * on a sort key plus a unique tiebreaker. Rows tied under the sort key can
 * otherwise land in a different relative position on each request, which
 * makes a page boundary drop one row and repeat another.
 *
 * Returns the same `{ data, error }` shape as the query itself, so callers
 * keep their existing error handling.
 */
export async function selectAll(buildQuery, { pageSize = SUPABASE_MAX_ROWS } = {}) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    if (data && data.length) rows.push(...data);
    // A short page means we reached the end. An exactly-full one is
    // ambiguous, so it costs one more round trip to find out.
    if (!data || data.length < pageSize) return { data: rows, error: null };
  }
}
