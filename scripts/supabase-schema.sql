-- ThaiHelper Supabase Schema
-- Run this in Supabase SQL Editor to create all tables

-- User Preferences (links Google Sheets helper_ref to Supabase)
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  helper_ref TEXT UNIQUE NOT NULL,
  email TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documents & Certificates
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  helper_ref TEXT REFERENCES user_preferences(helper_ref) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('certificate','id','reference','other')) DEFAULT 'other',
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_documents_helper ON documents(helper_ref);

-- Professional References
CREATE TABLE helper_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  helper_ref TEXT REFERENCES user_preferences(helper_ref) ON DELETE CASCADE,
  reference_name TEXT NOT NULL,
  relationship TEXT CHECK (relationship IN ('employer','colleague','trainer','other')) DEFAULT 'other',
  contact_info TEXT,
  reference_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_references_helper ON helper_references(helper_ref);

-- Conversations (one per employer-helper pair)
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  helper_ref TEXT REFERENCES user_preferences(helper_ref) ON DELETE CASCADE,
  employer_id TEXT NOT NULL,
  employer_name TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(helper_ref, employer_id)
);
CREATE INDEX idx_conversations_helper ON conversations(helper_ref);
CREATE INDEX idx_conversations_employer ON conversations(employer_id);

-- Messages
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('helper','employer')) NOT NULL,
  sender_ref TEXT,
  content_original TEXT NOT NULL,
  content_translated TEXT,
  source_language TEXT,
  target_language TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE NOT is_read;

-- Helper Favorites (employer saves a helper to their favorites list)
CREATE TABLE IF NOT EXISTS helper_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_ref TEXT NOT NULL,
  helper_ref TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employer_ref, helper_ref)
);
CREATE INDEX IF NOT EXISTS idx_favorites_employer ON helper_favorites(employer_ref);
CREATE INDEX IF NOT EXISTS idx_favorites_helper ON helper_favorites(helper_ref);

-- Enable RLS on all tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_favorites ENABLE ROW LEVEL SECURITY;

-- Since we use custom JWT auth (not Supabase Auth), all access goes
-- through API routes with the service role key. No RLS policies needed
-- for the service role (it bypasses RLS automatically).
