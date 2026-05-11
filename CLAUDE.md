# ThaiHelper — Project Guide

## What is ThaiHelper?
A direct-hiring marketplace connecting household professionals (nannies, chefs, drivers, housekeepers, caregivers, tutors) with families in Thailand. No agency middlemen, no hidden fees.

**URL:** thaihelper.app
**Status:** Launched April 2026. Helpers and families can register and message each other directly.

## Tech Stack
- **Framework:** Next.js 14 (Pages Router) + React 18
- **Styling:** Tailwind CSS 3.4 with custom Material Design 3 colour system
- **UI:** Radix UI primitives, Lucide icons, Framer Motion
- **Auth:** JWT via `jose` (30-day sessions, HttpOnly cookies, separate cookies for helper vs employer roles)
- **Backend:** Supabase (Postgres + Storage). Auth, helper/employer accounts, messaging, documents, references, push subscriptions.
- **Email:** Resend API (verification, match digests, message reminders)
- **Captcha:** Cloudflare Turnstile (fail-closed in production)
- **Translation:** Google Cloud Translation (Thai→English for names, bios, area)
- **Push:** Web Push + VAPID
- **LINE:** Bot-link flow for new-message notifications
- **Error monitoring:** Sentry (production only)
- **Hosting:** Vercel (cron schedule in `vercel.json`)
- **Languages:** English (primary), Thai

## Project Structure

```
├── pages/                  # Next.js pages (routes)
│   ├── api/                # Server-side API routes (talk to Supabase)
│   │   ├── register.js              # POST helper signup
│   │   ├── employer-signup.js       # POST employer account signup
│   │   ├── auth.js                  # POST helper login / DELETE logout
│   │   ├── employer-auth.js         # POST employer login / DELETE logout
│   │   ├── verify-email.js          # GET email verification callback
│   │   ├── forgot-ref.js            # POST ref-number reminder email
│   │   ├── profile.js               # GET/PUT helper profile (auth required)
│   │   ├── employer-profile.js      # GET/PUT employer profile (auth required)
│   │   ├── helpers.js               # GET public helper list
│   │   ├── employers.js             # GET public employer list
│   │   ├── recent-helpers.js        # GET 4–8 most recent verified helpers (homepage panels)
│   │   ├── helper-documents.js      # GET certificate signed URLs (employer-only)
│   │   ├── helper-references.js     # GET helper references (employer-only)
│   │   ├── documents.js             # CRUD helper's own certificate uploads
│   │   ├── references.js            # CRUD helper's own references
│   │   ├── conversations.js         # GET/POST conversation list + create
│   │   ├── messages.js              # GET/POST/PUT messages within a conversation
│   │   ├── favorites.js             # POST/DELETE employer-side favourites
│   │   ├── photo.js                 # POST helper profile photo upload
│   │   ├── employer-photo.js        # POST employer profile photo upload
│   │   ├── push/subscribe.js        # POST/DELETE push subscription
│   │   ├── line/link.js             # POST issue LINE link token
│   │   ├── line/webhook.js          # POST LINE bot incoming-message hook
│   │   ├── unsubscribe.js           # GET/POST email unsubscribe (signed token)
│   │   ├── cron/match-digest.js     # Weekly digest cron (CRON_SECRET-guarded)
│   │   ├── cron/message-reminders.js# Daily reminder cron
│   │   ├── wizard-analytics.js      # POST work-permit-wizard step tracking
│   │   ├── directory.js             # GET legal-expert directory
│   │   └── sitemap.js               # XML sitemap generator
│   ├── index.js            # Helper landing page (hero + recently-joined panel)
│   ├── employers.js        # Family landing page (hero + latest-signups grid)
│   ├── register.js         # Helper registration form (3 steps)
│   ├── employer-register.js# Family signup form
│   ├── helpers.js          # Browse helpers (SSR; uses HelperCard)
│   ├── employers-browse.js # Browse families
│   ├── login.js            # Login (email + ref number)
│   ├── profile.js          # Helper dashboard (auth required, large file)
│   ├── employer-dashboard.js # Family dashboard (auth required, large file)
│   ├── employer-profile.js # Employer profile preview
│   ├── verify.js           # Email verification confirmation page
│   ├── unsubscribe.js      # Unsubscribe confirmation page
│   ├── work-permit-wizard.js # Multi-step legal-info wizard
│   ├── directory/          # /hire/[slug] city pages + legal-expert directory
│   ├── hire/[slug].js      # SEO city landing pages (ISR)
│   ├── blog/[slug].js      # Static blog posts (MD content)
│   ├── privacy.js          # Privacy policy
│   ├── terms.js            # Terms of service
│   └── _app.js             # LangContext + analytics + service worker
├── lib/
│   ├── api/                # Client-side fetch wrappers (used by some pages)
│   ├── constants/          # categories, cities, work-permit, nationalities
│   ├── auth.js             # Server JWT helpers (createToken, getSession, …)
│   ├── unsubscribe.js      # Tokenised unsubscribe link signing
│   ├── supabase.js         # Supabase clients (anon + service role)
│   ├── translate.js        # Google Translate wrapper + romanizeThaiName
│   ├── file-magic.js       # Upload magic-byte validation
│   ├── send-confirmation-email.js # Resend email templates
│   ├── match-notifications.js     # Match-digest helpers
│   ├── messaging-filter.js        # PII strip for free-text messages
│   ├── recent-helpers-display.js  # Shared role/city/time formatters
│   └── utils.js            # cn() classname utility
├── components/
│   ├── SEOHead.jsx         # Meta tags + JSON-LD schemas
│   ├── HelperCard.jsx      # Shared helper-card layout (browse + modal)
│   ├── AvailabilityPill.jsx# Helper status pill (available / open / working)
│   ├── LangSwitcher.jsx    # EN / TH switcher
│   ├── MobileMenu.jsx      # Mobile nav + resource dropdown
│   └── messaging/          # Conversation + profile-modal components
├── scripts/                # SQL migrations + one-off Node scripts
│   ├── supabase-schema.sql                  # Base schema
│   ├── supabase-area-en.sql                 # area_en column
│   ├── supabase-availability-status.sql     # availability_status column
│   ├── supabase-email-verified-at.sql       # email_verified_at column
│   ├── backfill-area-en.js                  # Translate existing areas (one-off)
│   ├── backfill-thai-national.js            # Mark Thai-language helpers
│   └── …                                    # Other migration / report scripts
├── styles/globals.css      # Tailwind + custom CSS variables
└── public/                 # Static assets, /sw.js service worker
```

## Architecture Decisions
- **Supabase as backend** — Postgres for relational data, Storage for photos + documents. RLS enabled with deny-by-default policies; API routes use the service-role key.
- **Pages Router** (not App Router) — Simpler, well-supported, sufficient for current needs.
- **Helpers and families have separate cookies** (`th_session` + `th_emp_session`) so the same browser can be logged in as both roles. `getAnySession` reads a `?role=` hint to pick the right one when both exist; default is employer-first.
- **Translations are inline per page** — each page has `const T = { en: {...}, th: {...} }`. Shared display utilities (role labels, city names, relative time) live in `lib/recent-helpers-display.js`.
- **Cron via Vercel** — `vercel.json` schedules `/api/cron/match-digest` (weekly) and `/api/cron/message-reminders` (daily). Both require `CRON_SECRET`.
- **API client layer** (`lib/api/`) — Some pages use these wrappers; others call `fetch` directly. Convention is partial — long-term we should consolidate.

## Environment Variables
See `.env.local.example` for the full list. Required for the app to boot:
- `JWT_SECRET` (≥32 chars) — session + unsubscribe token signing
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_EMAIL`
- `GOOGLE_TRANSLATE_API_KEY`
- `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (required in prod)
- `CRON_SECRET` (required in prod)
- `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, `LINE_OA_BASIC_ID`

## Dev Setup
```bash
npm install
cp .env.local.example .env.local  # Fill in values
npm run dev                        # Runs on port 3000
```
Before first run, execute every `scripts/supabase-*.sql` in the Supabase SQL editor.

## Coding Conventions
- Bilingual: all user-facing text via per-page `T` objects or `lib/recent-helpers-display.js`. Don't hardcode user-visible strings.
- Shared data (categories, cities, skills): import from `lib/constants/`
- Tailwind for styling, use `cn()` from `lib/utils.js` for conditional classes
- Brand colours: primary teal `#006a62`, navy `#1B3A4B`, gold `#F4A261`
- Helper page accent: teal. Family page accent: gold (for at-a-glance side recognition).
- Fonts: Manrope/Plus Jakarta Sans (Latin), Sarabun (Thai)
- Photo uploads must pass `bufferMatchesMime()` from `lib/file-magic.js`

## Key Flows
1. **Helper Registration:** `/register` → `/api/register` → Supabase + verification email
2. **Email Verification:** click link → `/api/verify-email` → flips `email_verified` + fires match notifications
3. **Helper Login:** `/login` → `/api/auth` → sets `th_session` cookie → redirects to `/profile`
4. **Family Signup:** `/employer-register` → `/api/employer-signup` → Supabase + verification email
5. **Family Login:** `/login` → `/api/employer-auth` → sets `th_emp_session` cookie → `/employer-dashboard`
6. **Family browses helpers:** `/helpers` (SSR + filters) → click profile → `HelperProfileModal` (loads references + certificates from employer-only endpoints)
7. **Messaging:** family opens helper modal → "Message" → `/api/conversations` + `/api/messages` (paywall checks for free-tier employer)
8. **Helper updates availability:** dashboard toggle → `/api/profile` (optimistic update + rollback)
