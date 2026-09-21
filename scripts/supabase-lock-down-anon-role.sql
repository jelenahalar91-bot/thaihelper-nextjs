-- Lock the anon / authenticated Postgres roles out of the public schema.
--
-- WHY
-- ---
-- The 2026-09-14 audit found GRANTs and RLS policies pointing in opposite
-- directions, with every table protected by only ONE of the two layers:
--
--   helper_profiles, employer_accounts
--     Permissive SELECT policies for role `public` covering ALL columns
--     ("Public can view employer profiles" is simply USING (true)).
--     They don't leak today only because anon holds no table GRANT here.
--     One `GRANT SELECT ... TO anon` exposes email, whatsapp, phone_number,
--     date_of_birth, verification_token and phone_otp_hash for 946 helpers
--     and 159 families — straight past the field filtering in toPublicCard().
--
--   the other 18 tables (messages, conversations, documents,
--   magic_login_tokens, helper_ratings, ...)
--     Exactly the reverse: full SELECT/INSERT/UPDATE/DELETE/TRUNCATE grants
--     for anon AND authenticated, held back only by "RLS on, zero policies".
--     One `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` (a single toggle in
--     the Supabase dashboard) opens 3,066 messages — and magic_login_tokens,
--     which is account takeover.
--
-- Neither layer is load-bearing on purpose. This makes both of them closed.
--
-- WHY THIS IS SAFE HERE
-- ---------------------
-- The app never talks to Postgres as anon. Every API route goes through
-- getServiceSupabase() (service_role, which bypasses RLS and GRANTs alike).
-- getSupabaseClient() — the only anon-key consumer in the codebase — is
-- exported from lib/supabase.js and imported nowhere. Verified 2026-09-14:
--   - anon GET /rest/v1/helper_profiles -> 401, 42501 permission denied
--   - anon GET /rest/v1/messages        -> 200, [] (RLS filtered)
-- so nothing is reading through this path already.
--
-- IF YOU EVER ADD SUPABASE REALTIME on the browser side, it authenticates as
-- anon and will need its own narrow GRANT plus a matching RLS policy. Add
-- them deliberately, per table and per column — don't undo this file.
--
-- Rollback: re-run the GRANTs Supabase ships by default, i.e.
--   GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
-- (and re-create the two policies from supabase-schema.sql if needed).

begin;

-- 1. Drop the two permissive all-column policies. Nothing reads through
--    them; they exist only as a trap for a future GRANT.
drop policy if exists "Public can view active helper profiles" on public.helper_profiles;
drop policy if exists "Public can view employer profiles"      on public.employer_accounts;

-- 2. Take the blanket table privileges away from both anon roles, and stop
--    new tables from inheriting them.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

alter default privileges in schema public
  revoke all on tables    from anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges in schema public
  revoke all on functions from anon, authenticated;

-- 3. Pin search_path on the four SECURITY-relevant functions the Supabase
--    linter flagged. A mutable search_path lets a caller's own schema
--    shadow the tables these functions write to.
alter function public.update_updated_at()              set search_path = public, pg_temp;
alter function public.update_helper_rating_aggregate() set search_path = public, pg_temp;
alter function public.increment_view_counts(uuid[])    set search_path = public, pg_temp;
alter function public.increment_click_count(uuid)      set search_path = public, pg_temp;

commit;

-- Verification — run after committing. Both should come back empty.
--
--   select table_name, grantee
--     from information_schema.role_table_grants
--    where table_schema = 'public' and grantee in ('anon','authenticated');
--
--   select tablename, policyname, roles
--     from pg_policies
--    where schemaname = 'public' and 'public' = any(roles);
