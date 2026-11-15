-- Applied to production on 2026-11-15.
--
-- True once the company itself has entered or changed its price table in its
-- dashboard. Until then the table is something we copied from its website,
-- and the public page must keep saying "taken from the company's price page"
-- rather than "entered by the company itself".
alter table public.directory_listings
  add column if not exists pricing_by_owner boolean not null default false;
