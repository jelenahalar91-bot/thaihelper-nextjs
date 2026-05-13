-- Magic-link login tokens.
--
-- Replaces "email + helper_ref / employer_ref" as the primary login flow.
-- User types their email, we generate a short-lived single-use token and
-- email a link to thaihelper.app/api/auth/magic-login?token=...
-- They click → we set the session cookie → they're in. No memorising IDs.
--
-- Existing ref-number login stays as a fallback for users who prefer it
-- or whose email delivery is slow.
--
-- Run in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS magic_login_tokens (
  -- 64 hex chars of crypto-randomBytes(32). Token is the PK so duplicate
  -- inserts (e.g. retried sends) collide harmlessly.
  token         TEXT PRIMARY KEY,
  -- Which side of the marketplace the click logs in as.
  role          TEXT NOT NULL CHECK (role IN ('helper', 'employer')),
  -- helper_ref or employer_ref — captured at issue time so a later
  -- email change doesn't break the link.
  user_ref      TEXT NOT NULL,
  -- Email at issue time, for audit / abuse review.
  email         TEXT NOT NULL,
  -- 15 minutes from creation — covers email delivery lag plus a small
  -- buffer for "let me grab my phone" without giving an attacker who
  -- intercepts the link any meaningful window.
  expires_at    TIMESTAMPTZ NOT NULL,
  -- Set when the token is consumed. Replay attempts after this is set
  -- are rejected. Keeping the row instead of deleting it gives us an
  -- audit trail.
  used_at       TIMESTAMPTZ,
  -- The IP the request came from. Cheap signal for abuse review.
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lookups by email when issuing (to throttle / detect repeat sends).
CREATE INDEX IF NOT EXISTS idx_magic_tokens_email ON magic_login_tokens(email);

-- Periodic cleanup: tokens older than 7 days are useless even if
-- expired — keep the table small. Run this once a week via a cron, or
-- inline whenever we issue a new token.
-- DELETE FROM magic_login_tokens WHERE created_at < NOW() - INTERVAL '7 days';
