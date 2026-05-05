# Directory Outreach — overview

23 firms researched in `Anwaltsverzeichnis-Recherche.xlsx` ("Verzeichnis"
sheet). 5 have direct email addresses (today's batch); 16 only have
website contact forms (handle over the next few days).

**Send from:** `jelena@thaihelper.app`
**Track replies in:** `Anwaltsverzeichnis-Recherche.xlsx` → "Outreach
Tracking" sheet (date sent, follow-up date, listing-created status).

---

## Today — 5 direct-email firms

Open each file, copy the body, paste into your mail client.

| # | Firm | File | To |
|---|------|------|----|
| 1 | Siam Legal International (3 offices) | [01-siam-legal-international.md](01-siam-legal-international.md) | info@siam-legal.com |
| 2 | Baan Thai Immigration (BTI)          | [02-baan-thai-bti.md](02-baan-thai-bti.md) | info@btisolutions.co |
| 3 | 10 Mile Labour Group                 | [03-10-mile-labour-group.md](03-10-mile-labour-group.md) | 10mile.customer@gmail.com |
| 4 | Legal Services Hua Hin               | [04-legal-services-hua-hin.md](04-legal-services-hua-hin.md) | legalserviceshuahin@gmail.com |
| 5 | Absolute Lawyer Hua Hin              | [05-absolute-lawyer-hua-hin.md](05-absolute-lawyer-hua-hin.md) | amita@absolutelawyer-huahin.com |

> Each email links to the firm's already-live listing on
> thaihelper.app/directory — that's the hook. The placeholder
> listing is real, so when they click through, they see we mean
> business.

## Next few days — 16 contact-form firms

Use the shared template:
**[`_master-template-contact-form.md`](_master-template-contact-form.md)**

It includes:
- a short version of the message (works in tight contact forms)
- a table mapping each firm → website + listing URL
- one row per firm so you can tick them off

> Pace tip: 4–5 contact forms per day. Each takes ~2 minutes once
> you have the template open.

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
