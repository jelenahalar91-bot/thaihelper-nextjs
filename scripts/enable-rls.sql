-- ============================================================
-- Enable Row-Level Security (RLS) on ALL ThaiHelper tables
--
-- SAFE TO RUN: All API routes use the service_role key which
-- bypasses RLS. This only blocks direct access via anon key.
-- ============================================================

-- 1. Enable RLS on all tables
ALTER TABLE helper_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 2. Allow public READ access to helper_profiles (needed for browse page)
--    Only expose safe columns — email/phone are selected server-side only
CREATE POLICY "Public can view active helper profiles"
  ON helper_profiles
  FOR SELECT
  USING (email_verified = true AND (status = 'active' OR status IS NULL));

-- 3. Allow public READ access to employer_accounts (for employer browse)
CREATE POLICY "Public can view active employer profiles"
  ON employer_accounts
  FOR SELECT
  USING (status = 'active' OR status IS NULL);

-- 4. All other tables: NO public access (service_role bypasses RLS)
--    conversations, messages, documents, helper_references,
--    user_preferences, employer_registrations
--    → No policies needed. Service role key handles all access.
