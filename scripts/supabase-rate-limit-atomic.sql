-- Count and record a rate-limit attempt in ONE transaction.
--
-- WHY
-- lib/rate-limit.js used to count the attempts in a window, compare, and then
-- insert — three round-trips' worth of decision made on a number that was
-- already stale by the time it was used. Two requests arriving together both
-- read the same count and both get a slot. Ten do too.
--
-- That matters most on /api/phone/signup-send-otp, where the limits are 3 SMS
-- per number per hour and 6 per IP, and every slot that leaks is a Twilio
-- message somebody paid for. It also matters on login: 30 tries per IP is a
-- sensible number only if it is actually 30.
--
-- The advisory lock makes concurrent callers for the SAME bucket+key queue up
-- instead of racing. Different keys hash to different lock ids and never wait
-- on each other, so this costs nothing in the normal case. The lock is taken
-- for the transaction, and PostgREST gives every RPC call its own, so it is
-- released the moment the function returns.
--
-- Also one round-trip instead of two, which is the direction Vercel's Active
-- CPU budget wants.
--
-- ACCESS
-- Postgres grants EXECUTE on a new function to PUBLIC by default, and PUBLIC
-- includes anon. Left that way, anyone on the internet could call this through
-- PostgREST and write rows into rate_limit_attempts under any key they liked —
-- including somebody else's email address, which is how you would lock a
-- person out of their own login. Hence the REVOKE. service_role only; that is
-- the key the API routes use and the only caller there should ever be.
--
-- SECURITY INVOKER on purpose (the default, not spelled out below). service_role
-- bypasses RLS by itself, so there is nothing a DEFINER would add except a
-- privilege escalation to get wrong. search_path is pinned all the same —
-- a mutable one is the thing Supabase's own linter flags, and the lockdown
-- from 2026-09-14 is at zero of those.

create or replace function public.rate_limit_hit(
  p_bucket    text,
  p_key       text,
  p_max       integer,
  p_window_ms bigint
) returns boolean
language plpgsql
volatile
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  -- Same defensive allow as the JS: no key means we cannot identify the
  -- caller, and blocking anonymous edge traffic is worse than missing a count.
  if p_bucket is null or p_key is null or p_key = '' or p_max is null then
    return true;
  end if;

  -- chr(31) is a unit separator, so ('ab','c') and ('a','bc') cannot collide
  -- on the same lock.
  perform pg_advisory_xact_lock(
    hashtextextended(p_bucket || chr(31) || p_key, 0)
  );

  select count(*) into v_count
    from public.rate_limit_attempts
   where bucket = p_bucket
     and key = p_key
     and created_at > now() - ((p_window_ms::text) || ' milliseconds')::interval;

  if v_count >= p_max then
    return false;
  end if;

  insert into public.rate_limit_attempts (bucket, key, created_at)
  values (p_bucket, p_key, now());

  return true;
end;
$$;

revoke all on function public.rate_limit_hit(text, text, integer, bigint) from public;
revoke all on function public.rate_limit_hit(text, text, integer, bigint) from anon;
revoke all on function public.rate_limit_hit(text, text, integer, bigint) from authenticated;
grant execute on function public.rate_limit_hit(text, text, integer, bigint) to service_role;
