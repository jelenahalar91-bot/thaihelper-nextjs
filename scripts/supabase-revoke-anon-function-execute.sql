-- Take EXECUTE away from anon on the four functions that still had it.
--
-- WHY THIS WAS FOUND
-- The lockdown of 2026-09-14 removed every table GRANT from anon and has held
-- since: the audit of 2026-11-18 confirmed all 23 tables deny anon outright.
-- Functions were never part of that sweep, and Postgres grants EXECUTE on a
-- new function to PUBLIC by default — which includes anon. So four functions
-- were callable by anyone holding the publishable key, which is everyone who
-- can open the site.
--
-- WHY IT WAS NOT A HOLE
-- All four are SECURITY INVOKER, so a call from anon runs as anon, and anon
-- owns no table rights. Measured rather than assumed: calling
-- increment_view_counts as anon returns 42501, "permission denied for table
-- directory_listings". Nothing leaked and no counter could be inflated.
--
-- WHY CLOSE IT ANYWAY
-- It only stayed harmless because of a second lock. Anyone adding a GRANT to
-- anon later, or writing one of these as SECURITY DEFINER, turns a reachable
-- function into a writable one — and nothing in the code would look wrong.
-- rate_limit_hit (2026-10-14) was locked down at creation for exactly this
-- reason; these four predate that habit.
--
-- increment_view_counts / increment_click_count are only ever called from
-- pages/api/directory/[id]/view.js and click.js, both with the service-role
-- client, so nothing legitimate loses access.
--
-- update_updated_at and update_helper_rating_aggregate return `trigger` and
-- cannot be called over PostgREST at all. Triggers fire regardless of EXECUTE
-- grants — the privilege is checked when the trigger is created, not each time
-- it runs — so trg_helper_ratings_aggregate on helper_ratings and
-- helper_profiles_updated_at on helper_profiles keep working. Verified after
-- applying, not assumed.

revoke all on function public.increment_view_counts(uuid[])      from public, anon, authenticated;
revoke all on function public.increment_click_count(uuid)        from public, anon, authenticated;
revoke all on function public.update_updated_at()                from public, anon, authenticated;
revoke all on function public.update_helper_rating_aggregate()   from public, anon, authenticated;

grant execute on function public.increment_view_counts(uuid[]) to service_role;
grant execute on function public.increment_click_count(uuid)   to service_role;
