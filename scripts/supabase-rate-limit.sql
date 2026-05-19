-- Persistent rate-limit store. Used by lib/rate-limit.js to throttle
-- request volume per IP / per user across endpoints. Required because
-- in-memory Maps don't persist across Vercel serverless cold starts
-- and so are bypassed in seconds by attackers spamming requests.
--
-- Schema is intentionally simple: one row per attempt. Counts in a
-- window are done by `WHERE bucket=$1 AND key=$2 AND created_at > $3`.
-- The index makes that fast even with millions of rows.
--
-- Old rows are pruned by a Postgres scheduled task (see bottom).

CREATE TABLE IF NOT EXISTS rate_limit_attempts (
  id           BIGSERIAL PRIMARY KEY,
  bucket       TEXT NOT NULL,                                  -- 'magic-link', 'login', etc.
  key          TEXT NOT NULL,                                  -- usually an IP, or email
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rate_limit_attempts_lookup_idx
  ON rate_limit_attempts (bucket, key, created_at DESC);

-- Service-role only; clients never query this directly.
ALTER TABLE rate_limit_attempts ENABLE ROW LEVEL SECURITY;
