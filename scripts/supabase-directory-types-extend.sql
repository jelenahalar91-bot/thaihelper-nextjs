-- ============================================================================
-- Extend directory_listings.type CHECK constraint with Helperplace-style
-- categories: training, partner, association.
--
-- The original CHECK in supabase-bonus-projects.sql allowed only
--   ('lawyer', 'visa_agent', 'mou_agency', 'agency')
-- This migration adds three more categories so the tabs in /directory can
-- accept listings in those slots once real providers come in.
--
-- Run once via the Supabase SQL editor. Re-runnable thanks to IF EXISTS
-- on the DROP and the standard CHECK syntax.
-- ============================================================================

ALTER TABLE directory_listings
  DROP CONSTRAINT IF EXISTS directory_listings_type_check;

ALTER TABLE directory_listings
  ADD CONSTRAINT directory_listings_type_check
  CHECK (type IN (
    'lawyer',
    'visa_agent',
    'mou_agency',
    'agency',
    'training',
    'partner',
    'association'
  ));
