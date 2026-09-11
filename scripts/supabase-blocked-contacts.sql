-- Blocklist of contact handles belonging to suspended accounts.
--
-- Why this exists (2026-09-11): EMP-B4MUCP was suspended on 2026-09-09 for
-- pushing a LINE handoff into 111 conversations. One day later the same person
-- was back as EMP-3THHAA with a fresh Gmail address — and pushed the *same*
-- LINE ID, Q6hsHvNY8E. It took a helper's report 28 hours to stop them.
--
-- Nothing in lib/spam-signals.js could have caught that. Every threshold there
-- counts per account over a rolling window, and a new account starts every
-- counter at zero. Email verification costs 30 seconds, so it is not identity.
--
-- The LINE ID is. It is the one thing a scammer cannot cheaply change: it is
-- the destination the whole scheme depends on, and it survives re-registration.
-- So we block the handle rather than the account.
--
-- Rows are harvested automatically by scripts/suspend-employer.js from what the
-- suspended account actually sent, and can be added by hand for a handle known
-- from a report before any account is suspended (source = 'manual').
--
-- Scope is deliberately narrow — only personal identifiers, never plain URLs.
-- A suspended account that once linked google.com must not get google.com
-- blocked for everyone. See HANDLE TYPES in lib/contact-blocklist.js.

CREATE TABLE IF NOT EXISTS blocked_contacts (
  handle       TEXT PRIMARY KEY,              -- normalized: 'line:q6hshvny8e', 'phone:66813334444'
  kind         TEXT NOT NULL                  -- 'line' | 'phone' | 'telegram' | 'email'
                 CHECK (kind IN ('line', 'phone', 'telegram', 'email')),
  source_ref   TEXT,                          -- account it was harvested from, NULL if manual
  source       TEXT NOT NULL DEFAULT 'suspension'
                 CHECK (source IN ('suspension', 'manual')),
  reason       TEXT,
  sample       TEXT,                          -- the message text it came from, for review
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The send path looks up a handful of handles per message; the primary key
-- covers that. This index is for un-blocking everything from one account when
-- a suspension is reversed.
CREATE INDEX IF NOT EXISTS blocked_contacts_source_ref_idx
  ON blocked_contacts (source_ref);

-- Service-role only; clients never query this directly.
ALTER TABLE blocked_contacts ENABLE ROW LEVEL SECURITY;
