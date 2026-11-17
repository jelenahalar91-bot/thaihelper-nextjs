-- Areas: the clickable second level under a city (17.11.2026).
--
-- `area_slugs` is a CSV of slugs from lib/constants/areas.js, valid for the
-- row's own city. Empty means "anywhere in the city". The existing free-text
-- `area` column stays and now holds only what the list does not cover (the
-- "Other" line). The directory never had an area at all, so it gets both.
--
-- Additive only. Existing rows are sorted into the list by
-- scripts/backfill-area-slugs.mjs, AFTER the code that reads area_slugs is live.

alter table helper_profiles    add column if not exists area_slugs text;
alter table employer_accounts  add column if not exists area_slugs text;
alter table directory_listings add column if not exists area_slugs text;
alter table directory_listings add column if not exists area_other text;
