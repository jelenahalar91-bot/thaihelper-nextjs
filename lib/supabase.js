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
