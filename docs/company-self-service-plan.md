# Company Self-Service — Implementation Plan

**Status:** Stage 2 BUILT 2026-06-27 (invite-gated, password-based) — pending SQL migration + end-to-end test, not yet committed/deployed · **Created:** 2026-06-18

> ## Stage 2 as built (2026-06-27) — differs from the original sketch below
> Jelena chose an **invite-gated, password** flow (not passwordless ref):
> 1. Company applies at `/partners` → `company_accounts` row, status `requested` + admin email with a one-click **Approve** link.
> 2. Admin clicks Approve (`/api/company-approve`) → status `invited`, company gets an email with a private onboarding link.
> 3. `/business-onboarding?t=…` → company sets its own **password** + fills listing → listing goes **live** (`status='active'`, admin already vetted the company), auto-logged-in.
> 4. `/business-login` (email + password) → `/business-dashboard` to edit listing + upload logo.
>
> **Files:** SQL `scripts/supabase-company-accounts.sql` · auth `lib/auth.js` (cookie `th_biz_session`, role `company`) · `lib/company-invite.js` (approve/invite tokens) · `lib/company-listing.js` (field sanitiser) · APIs `company-approve|company-onboard|company-auth|company-listing|company-photo` + rewritten `partner-signup` · pages `business-onboarding|business-dashboard|business-login` · `components/CompanyListingForm.jsx`. New dep: `bcryptjs`.
> **TODO before deploy:** run the SQL in Supabase, then test apply→approve→onboard→login→edit, then commit + deploy.

**Original plan — Created:** 2026-06-18
**Decision so far:** No "verified" badge for self-registration (see *Badge policy* below). Build only when the trigger conditions below are met.

## Goal

Let directory companies (agencies, service companies, lawyers, visa agents, MOU agencies, etc.) manage their own listing — claim it, edit details, upload a logo and photos — instead of the admin (Jelena) doing it by hand in Supabase.

Today: `/partners` is a "register interest" form → admin email → admin creates the listing manually. Listings are read-only and admin-managed.

---

## Two build stages

### 🟢 Stage 1 — "Claim / Edit" request (small, no login)

The cheap bridge that starts the inbound loop without an auth system.

1. Button on every directory detail page: **"Is this your business? Claim or update →"**
2. Links to a form (a variant of `/partners`), pre-filled with the listing name.
3. Company submits requested changes (logo URL, contact, description, …).
4. Admin gets an email → applies the change in Supabase.

- **Effort:** small — 1 button + 1 form + 1 API route, all mirroring the existing `/partners` + `/api/partner-signup` patterns.
- **Value:** companies find themselves and come to you → you only approve, instead of doing cold outreach. This is the "claim your listing" inbound mechanism (how Yelp / Google Business / Clutch bootstrapped).

### 🔵 Stage 2 — Company account + dashboard (large, real Phase 2)

Full self-service. Mirror the existing helper/employer account systems.

| Building block | What | Mirrors |
|---|---|---|
| **Auth (3rd role)** | Company login, cookie `th_biz_session`, JWT via `jose`, login by email + company ref (passwordless, like helpers/employers) | `lib/auth.js`, `pages/api/auth.js` |
| **DB** | `company_accounts` table + `owner_account_id` column on `directory_listings`; `pending`/`approved` status for edits | existing `scripts/supabase-*.sql` migrations |
| **Claim flow** | Company finds its listing → "Claim" → admin approves → listing linked to the account | — |
| **Dashboard** (`/business-dashboard`) | Edit listing (description, LINE, WhatsApp, opening hours, specialties, nationalities…) + **upload logo / photos** | `pages/profile.js`, `pages/api/photo.js` + `bufferMatchesMime()` from `lib/file-magic.js` |
| **Storage** | Logo + gallery → Supabase Storage bucket, magic-byte validation | existing photo uploads |
| **Moderation** | Edits land as `pending` → admin approves (or auto-publish + spot-check) | — |
| **Emails** | Verification email on signup, "edit approved" notification | Resend |

- **Effort:** large — comparable to the whole helper-account system (several API routes, a dashboard page, auth, DB migrations, storage, moderation).

---

## Recommended sequence

1. **Now:** build nothing — manual editing via Supabase is fine at low listing volume.
2. **When manual editing gets painful** (more listings) **or to kick off inbound:** build Stage 1 (claim/edit form) — cheap bridge.
3. **When monetising** (~1 year out): build Stage 2 (accounts + dashboard) — only then does the auth investment pay off.

---

## Badge policy (decided 2026-06-18)

- **No badge for self-registration.** Self-registering is not verification — anyone can fill a form. We removed the old "verified" badge precisely because the site doesn't vet providers and it conflicted with the "we do not endorse" disclaimer. Do not recreate that false-trust signal.
- **Honest options for later:**
  - **"Claimed" / "Managed by the company"** — for any company with an account managing its own profile. Truthful (they literally manage it), useful freshness signal. Free.
  - **"Verified"** — reserve for when something real is checked (DBD company-registration number, a license). This becomes a genuine trust tier **and** a paid "Verified Business" premium feature. The `verified` field is already in the DB (just hidden), so re-enabling it later loses no data.

---

## Related

- Directory + `/partners` funnel, business-tier strategy: see the `strategy_business_tier_for_companies_2026-05-07` memory.
- Tailwind gotcha when building UI here: `teal` is a single colour, not a palette — use `primary` / `primary/10` (see `reference_tailwind_teal_is_single_color` memory).
