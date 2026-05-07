# Directory Outreach — overview

21 firms in the directory after the 2026-05-07 cleanup (5 firms removed
because their actual practice didn't match the household-helper /
work-permit pitch — see "Removed firms" below).

Two outreach paths:
- **2 firms** have verified direct emails → today's batch.
- **19 firms** go via website contact form, LINE, or general inbox →
  handle over the next few days using the master template.

**Send from:** `jelena@thaihelper.app`
**Track replies in:** `Anwaltsverzeichnis-Recherche.xlsx` → "Outreach
Tracking" sheet (date sent, follow-up date, listing-created status).

---

## Today — 2 direct-email firms

Open each file, copy the body, paste into your mail client.

| # | Firm | File | To |
|---|------|------|----|
| 1 | Siam Legal International (3 offices) | [01-siam-legal-international.md](01-siam-legal-international.md) | info@siam-legal.com |
| 2 | Legal Services Hua Hin              | [02-legal-services-hua-hin.md](02-legal-services-hua-hin.md) | legalserviceshuahin@gmail.com |

> Each email links to the firm's already-live listing on
> thaihelper.app/directory — that's the hook. The placeholder
> listing is real, so when they click through, they see we mean
> business.

## Next few days — 19 contact-form / inbox firms

Use the shared template:
**[`_master-template-contact-form.md`](_master-template-contact-form.md)**

It includes:
- a short version of the message (works in tight contact forms)
- a table mapping each firm → contact channel + listing URL
- one row per firm so you can tick them off

> Pace tip: 4–5 contact forms per day. Each takes ~2 minutes once
> you have the template open.

## Removed firms — do not outreach (5)

These were in the original 23 but removed on 2026-05-07 because their
actual practice didn't match the household-helper / work-permit pitch:

| Firm | Why removed |
|------|-------------|
| Forvis Mazars Thailand | Audit / tax / advisory — corporate B2B, not households |
| Manpower Thailand | B2B staffing (banking, IT, engineering) — not for domestic workers |
| Virasin Partners | US-licensed immigration (K-1, EB-5) — wrong country |
| Siam GP Law Firm | Civil / criminal litigation focus, no work-permit practice |
| Absolute Lawyer Hua Hin | Real estate / corporate — no immigration services on their site |

## After replies come in

When a firm replies with their preferred name + description + logo:

1. Open `scripts/directory-seed.json`
2. Find the firm by `slug`
3. Update `name`, `description`, `description_th`, `phone`, `email`,
   `website` as they sent
4. Set `verified: true`
5. Run `node scripts/seed-directory.js` — that upserts the changes
   into Supabase
6. Within ~1h ISR refresh, the live directory page shows the new
   info plus a green "Verified" badge instead of "Unverified"

Pro tip: keep a screenshot or copy of the original email in a folder
in case you ever need to show consent to the listing.
