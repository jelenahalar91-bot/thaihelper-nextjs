# ThaiHelper — Project Guide

## What is ThaiHelper?
A direct-hiring marketplace connecting household professionals (nannies, chefs, drivers, housekeepers, caregivers, tutors) with families in Thailand. No agency middlemen, no hidden fees.

**URL:** thaihelper.app
**Status:** Launching April 2026. Helpers can register now, employers are on a waitlist.

## Tech Stack
- **Framework:** Next.js 14 (Pages Router) + React 18
- **Styling:** Tailwind CSS 3.4 with custom Material Design 3 color system
- **UI:** Radix UI primitives, Lucide icons, Embla Carousel, Framer Motion
- **Auth:** JWT via `jose` (7-day sessions, HttpOnly cookies)
- **Email:** Resend API
- **Backend:** Google Sheets via Google Apps Script (temporary MVP backend)
- **Hosting:** Vercel
- **Languages:** English (primary), Thai, Russian

## Project Structure

```
├── pages/                  # Next.js pages (routes)
│   ├── api/                # Server-side API routes
│   │   ├── register.js     # POST helper registration → Google Sheet
│   │   ├── employer-register.js  # POST employer registration
│   │   ├── auth.js         # POST login / DELETE logout
│   │   ├── profile.js      # GET/PUT helper profile (auth required)
│   │   ├── helpers.js      # GET helper listings
│   │   └── sitemap.js      # XML sitemap generator
│   ├── index.js            # Helper landing page
│   ├── register.js         # Helper registration form (3 steps)
│   ├── employers.js        # Employer landing + waitlist form
│   ├── helpers.js          # Browse helpers (employer view)
│   ├── login.js            # Helper login (email + ref number)
│   ├── profile.js          # Helper dashboard (auth required)
│   ├── privacy.js          # Privacy policy
│   ├── terms.js            # Terms of service
│   └── _app.js             # LangContext provider (en/th/ru)
├── lib/                    # Shared logic (monorepo-ready)
│   ├── api/                # Client-side API functions
│   │   ├── helpers.js      # registerHelper, fetchHelpers, fetchProfile, updateProfile
│   │   ├── employers.js    # registerEmployer
│   │   └── auth-client.js  # login, logout
│   ├── i18n/               # Internationalization
│   │   ├── index.js        # useTranslation hook
│   │   ├── en.js           # English strings (all namespaces)
│   │   └── th.js           # Thai strings
│   ├── constants/          # Shared constants
│   │   ├── categories.js   # Service categories + skills
│   │   └── cities.js       # Supported cities
│   ├── auth.js             # Server-side JWT helpers (createToken, getSession)
│   ├── send-confirmation-email.js  # Resend email templates
│   └── utils.js            # cn() classname utility
├── components/
│   ├── SEOHead.jsx         # Meta tags + JSON-LD schemas
│   └── ui/                 # Reusable UI components (Radix-based)
├── styles/globals.css      # Tailwind + custom CSS variables
└── public/                 # Static assets (favicons, images)
```

## Monorepo Roadmap
This project is structured to migrate into a Turborepo monorepo:

```
thaihelper/                 # Future structure
├── apps/
│   ├── web/                # This Next.js app
│   └── mobile/             # Expo React Native app
├── packages/
│   ├── shared/             # lib/api/ + lib/constants/ + lib/i18n/
│   └── ui/                 # Shared design tokens (optional)
└── turbo.json
```

**What moves to `packages/shared`:** Everything in `lib/api/`, `lib/i18n/`, `lib/constants/`.
**What stays in `apps/web`:** Pages, components, styles, API routes.

## Architecture Decisions
- **Google Sheets as backend** — Intentional MVP choice. Will migrate to Supabase/PostgreSQL when scaling.
- **Pages Router** (not App Router) — Simpler, well-supported, sufficient for current needs.
- **No ORM/database** yet — All data flows through Google Apps Script endpoints.
- **Translations inline** → extracted to `lib/i18n/` — Shared between web and future mobile app.
- **API client layer** (`lib/api/`) — Abstracts fetch calls so mobile app can reuse the same functions.

## Environment Variables
```
GOOGLE_SHEETS_URL=       # Google Apps Script URL (helper data)
EMPLOYER_SHEET_URL=      # Google Apps Script URL (employer data)
RESEND_API_KEY=          # Resend email service key
RESEND_FROM_EMAIL=       # Sender address (e.g., ThaiHelper <noreply@thaihelper.app>)
JWT_SECRET=              # Min 32 chars, used for session tokens
```

## Dev Setup
```bash
npm install
cp .env.local.example .env.local  # Fill in values
npm run dev                        # Runs on port 3001
```

## Coding Conventions
- Bilingual: all user-facing text goes through `lib/i18n/`, never hardcode strings in components
- API calls: use functions from `lib/api/`, never raw fetch in pages
- Shared data (categories, cities, skills): import from `lib/constants/`
- Tailwind for styling, use `cn()` from `lib/utils.js` for conditional classes
- Color palette: primary teal `#006a62`, navy `#1B3A4B`, gold `#F4A261`
- Fonts: Manrope/Plus Jakarta Sans (Latin), Sarabun (Thai)

## Key Flows
1. **Helper Registration:** `/register` → `lib/api/helpers.js:registerHelper()` → `/api/register` → Google Sheet + Email
2. **Employer Registration:** `/employers` → `lib/api/employers.js:registerEmployer()` → `/api/employer-register` → Google Sheet + Email
3. **Helper Login:** `/login` → `lib/api/auth-client.js:login()` → `/api/auth` → JWT cookie → redirect `/profile`
4. **Profile Edit:** `/profile` → `lib/api/helpers.js:fetchProfile()` / `updateProfile()` → `/api/profile` → Google Sheet
