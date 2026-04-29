-- Enable Row-Level Security on the two remaining public tables that
-- Supabase flagged in the security advisor.
--
-- All app code goes through API routes that use the service-role key
-- (lib/supabase.js getServiceSupabase), which bypasses RLS — so enabling
-- RLS without policies blocks the public anon key and locks the data
-- down without breaking the application.

ALTER TABLE contact_reveals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_saved_helpers ENABLE ROW LEVEL SECURITY;
