-- Applied to production on 2026-11-13.
--
-- Free-text "Other" next to the fixed language / nationality chips on a
-- company's directory listing. The chips stay the filterable part; these two
-- columns only add what a company offers beyond them.
alter table public.directory_listings
  add column if not exists languages_other text,
  add column if not exists nationalities_other text;

-- The detail page has had WhatsApp and LINE buttons for months, but the
-- event log only knew five kinds of click, so both were filed as 'website'.
alter table public.directory_click_events
  drop constraint if exists directory_click_events_cta_type_check;
alter table public.directory_click_events
  add constraint directory_click_events_cta_type_check
  check (cta_type = any (array['website','phone','email','details','maps','whatsapp','line']));
