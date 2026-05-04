-- ThaiHelper Bonus Projects — Schema migrations
-- Run this in Supabase SQL Editor (idempotent; safe to re-run).
--
-- Covers:
--   Feature 1 — Helper Work-Permit field on helper_profiles
--   Feature 2 — Work Permit Wizard analytics table
--   Feature 3 — Expert Directory (listings + reviews) + RPC functions
--
-- All app code goes through API routes that use the service-role key
-- (lib/supabase.js getServiceSupabase), which bypasses RLS — so enabling
-- RLS without policies on the new tables blocks the public anon key and
-- locks the data down without breaking the application.

-- ──────────────────────────────────────────────────────────────────────
-- Feature 1: Helper Work-Permit Status
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE helper_profiles
  ADD COLUMN IF NOT EXISTS work_permit_status TEXT
  CHECK (work_permit_status IN (
    'thai_national', 'valid_wp', 'wp_in_progress', 'no_wp', 'prefer_not_say'
  ));

CREATE INDEX IF NOT EXISTS idx_helpers_wp_status
  ON helper_profiles(work_permit_status)
  WHERE work_permit_status IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────
-- Feature 2: Work Permit Wizard Analytics
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wizard_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  city TEXT,
  nationality TEXT,
  helper_status TEXT,
  visa_type TEXT,
  duration TEXT,
  result_flow TEXT,     -- 'not_worth_it' | 'worth_it_but_slow' | 'worth_it' | 'no_wp_needed'
  result_track TEXT,    -- 'mou' | 'non_b' | null
  cta_clicked TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wizard_city   ON wizard_analytics(city);
CREATE INDEX IF NOT EXISTS idx_wizard_result ON wizard_analytics(result_flow);

ALTER TABLE wizard_analytics ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────
-- Feature 3: Expert Directory — Listings
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS directory_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_th TEXT,
  type TEXT NOT NULL CHECK (type IN ('lawyer', 'visa_agent', 'mou_agency', 'agency')),
  city TEXT NOT NULL,
  cities_served TEXT,          -- CSV: "bangkok,phuket,chiang-mai"
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  google_maps_url TEXT,
  description TEXT,
  description_th TEXT,
  specialties TEXT,            -- CSV: "work_permit,visa,mou,company_registration"
  languages_spoken TEXT,       -- CSV: "english,thai,german"

  -- Monetization (Phase 3+)
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'featured')),
  ranking_score INTEGER DEFAULT 0,
  listing_expiry TIMESTAMPTZ,

  -- Tracking
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  lead_count INTEGER DEFAULT 0,

  -- Meta
  verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_directory_city ON directory_listings(city);
CREATE INDEX IF NOT EXISTS idx_directory_type ON directory_listings(type);
CREATE INDEX IF NOT EXISTS idx_directory_tier ON directory_listings(tier);
CREATE INDEX IF NOT EXISTS idx_directory_slug ON directory_listings(slug);

ALTER TABLE directory_listings ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────
-- Feature 3: Expert Directory — Reviews (Phase 2)
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS directory_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES directory_listings(id) ON DELETE CASCADE,
  employer_id TEXT NOT NULL,
  employer_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  verified_client BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_listing ON directory_reviews(listing_id);

ALTER TABLE directory_reviews ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────
-- RPC functions for view/click tracking
-- ──────────────────────────────────────────────────────────────────────

-- Increment view counts for multiple listings at once
CREATE OR REPLACE FUNCTION increment_view_counts(listing_ids UUID[])
RETURNS void AS $$
  UPDATE directory_listings
  SET view_count = view_count + 1
  WHERE id = ANY(listing_ids);
$$ LANGUAGE sql;

-- Increment click count for a single listing
CREATE OR REPLACE FUNCTION increment_click_count(p_listing_id UUID)
RETURNS void AS $$
  UPDATE directory_listings
  SET click_count = click_count + 1
  WHERE id = p_listing_id;
$$ LANGUAGE sql;
