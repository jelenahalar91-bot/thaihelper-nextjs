-- Directory pricing (2026-10-14)
--
-- What a family wants to know before calling an agency is what it costs, and
-- the three questions behind that: one-off or recurring? who pays the
-- helper? what happens if it does not work out? Agencies answer these on
-- their own websites in a dozen different shapes, so the data is a JSON
-- array of packages rather than three fixed columns.
--
--   pricing: [
--     { "name": "Standard placement",
--       "name_th": "...",                     -- optional
--       "price_thb": 6000,                    -- null = "on request"
--       "price_max_thb": null,                -- set for a published range
--       "period": "one_time",                 -- one_time | monthly | hourly | daily | per_visit
--       "includes": "Up to 3 candidates, 90-day replacement",
--       "includes_th": "...",                 -- optional
--       "replacement_days": 90,               -- optional
--       "min_months": null }                  -- optional minimum contract
--   ]
--
--   payment_flow: who the family actually pays.
--     helper_direct — family pays the helper's salary itself; the agency's
--                     fee is a separate placement fee.
--     via_agency    — family pays the agency, the agency pays the helper
--                     (outsourcing / payroll model).
--     both          — differs by package; the packages say which.
--
--   pricing_url        the page these numbers were read from
--   pricing_checked_at the day someone last compared them with that page
--   pricing_note(_th)  one free-text line shown under the table
--
-- Everything is "as published by the agency". The UI says so and links the
-- source; we never promise a price. Run once in the Supabase SQL editor;
-- all statements are idempotent.

ALTER TABLE directory_listings
  ADD COLUMN IF NOT EXISTS pricing            JSONB,
  ADD COLUMN IF NOT EXISTS payment_flow       TEXT,
  ADD COLUMN IF NOT EXISTS pricing_url        TEXT,
  ADD COLUMN IF NOT EXISTS pricing_checked_at DATE,
  ADD COLUMN IF NOT EXISTS pricing_note       TEXT,
  ADD COLUMN IF NOT EXISTS pricing_note_th    TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'directory_listings_payment_flow_check'
  ) THEN
    ALTER TABLE directory_listings
      ADD CONSTRAINT directory_listings_payment_flow_check
      CHECK (payment_flow IS NULL OR payment_flow IN ('helper_direct', 'via_agency', 'both'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'directory_listings_pricing_is_array'
  ) THEN
    ALTER TABLE directory_listings
      ADD CONSTRAINT directory_listings_pricing_is_array
      CHECK (pricing IS NULL OR jsonb_typeof(pricing) = 'array');
  END IF;
END $$;
