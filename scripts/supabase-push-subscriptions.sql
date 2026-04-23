-- Web Push Notifications — subscription storage
-- Run this in the Supabase SQL Editor.
--
-- Each row is ONE device/browser that opted in to push notifications.
-- A single user can have multiple subscriptions (phone + laptop + TWA).
-- Endpoints are globally unique across all users.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_role    TEXT NOT NULL CHECK (user_role IN ('helper', 'employer')),
  user_ref     UUID NOT NULL,
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT NOT NULL,
  auth_secret  TEXT NOT NULL,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Fast lookup: "give me all subscriptions for this user"
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions (user_role, user_ref);

-- We read/write this table exclusively from the API routes using the
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS — so no RLS policies needed.
-- Enable RLS anyway to block accidental anon-key access:
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Deny-all policy (service role bypasses this)
DROP POLICY IF EXISTS "deny all" ON push_subscriptions;
CREATE POLICY "deny all" ON push_subscriptions FOR ALL USING (false);
