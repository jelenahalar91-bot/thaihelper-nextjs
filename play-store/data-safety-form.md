# Data Safety Form — Google Play Console

Required for every app on the Play Store. In Play Console:
**App content → Data safety → Manage**.

All answers below are the truthful, conservative version. Google
randomly audits these — answering correctly avoids takedowns later.

---

## Section 1 · Data collection and security

| Question | Answer | Why |
|---|---|---|
| Does your app collect or share any of the required user data types? | **Yes** | We collect email, name, city, profile photo, messages. |
| Is all of the user data collected by your app encrypted in transit? | **Yes** | All API calls go over HTTPS (Vercel + Supabase enforce TLS). |
| Do you provide a way for users to request that their data is deleted? | **Yes** | Users can email support@thaihelper.app and we delete their profile + messages within 30 days. We also have a self-service path: helpers can mark `status = inactive` from their profile; we hard-delete after a follow-up support email. |

---

## Section 2 · Data types collected

For each row: **Collected? Shared with third parties? Ephemeral? Optional?**

### Personal info

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| **Name** | Yes | No | Account management, Personalisation, App functionality | Required |
| **Email address** | Yes | No | Account management, Communications | Required |
| **User IDs** (internal ref like TH-XXXXXX / EMP-XXXXXX) | Yes | No | Account management | Required |
| **Address** (city/area only — no street) | Yes | No | App functionality (search/filter) | Required |
| **Phone number** | Yes | No | Account management, Communications | Optional |
| **Race / ethnicity** | No | — | — | — |
| **Political or religious beliefs** | No | — | — | — |
| **Sexual orientation** | No | — | — | — |
| **Other personal info** (date of birth → derived age) | Yes | No | App functionality (display age range) | Required |

### Financial info

| Data type | Collected |
|---|---|
| Any of the financial info types | **No** — we don't process payments. The platform is free. |

### Health and fitness

| Data type | Collected |
|---|---|
| Any | **No** |

### Messages

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| **Messages** (in-platform DMs between family ↔ helper) | Yes | No | App functionality (the core feature) | Required for messaging feature |
| Emails | No | — | — | — |
| SMS or MMS | No | — | — | — |

### Photos and videos

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| **Photos** (profile photo) | Yes | No | App functionality, Account management | Optional |
| Videos | No | — | — | — |

### Audio files | No

### Files and docs

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| **Files and docs** (helper certificates: ID, references, training certs) | Yes | No | App functionality (verify experience to employers) | Optional |

### Calendar | No

### Contacts | No

### App activity

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| **App interactions** (which pages viewed, which helpers favourited, button clicks) | Yes | No | Analytics, App functionality | Required |
| **In-app search history** (filters: city, category, language) | Yes | No | App functionality, Analytics | Required |
| **Installed apps** | No | — | — | — |
| **Other user-generated content** (helper bio, employer job description) | Yes | No | App functionality | Required |
| **Other actions** | No | — | — | — |

### Web browsing | No

### App info and performance

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| **Crash logs** (via Sentry) | Yes | Yes (Sentry GmbH, data processor) | Crash reporting | Required |
| **Diagnostics** (performance metrics) | Yes | Yes (Sentry, Vercel) | Performance monitoring | Required |
| **Other app performance data** | No | — | — | — |

### Device or other identifiers

| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| **Device or other IDs** (FCM token for push notifications) | Yes | Yes (Google FCM — required to deliver push) | App functionality (push notifications) | Optional (user can opt out of push) |

---

## Section 3 · Data usage and handling

| Question | Answer |
|---|---|
| Is your app independently validated against a global security standard? | **No** (we're a small platform; SOC2/ISO27001 audits are Phase 2+) |

---

## Privacy policy URL

```
https://thaihelper.app/privacy
```

---

## Quick mental model for filling out the form

When in doubt, ask: *"If a journalist tested this and found we collect X, would they call us out?"*

- ✅ **Yes, we collect it** → declare it. Always more honest than hoping nobody checks.
- 🚫 **We don't collect it** → mark No. Don't be vague; reviewers reject hedge answers.
- 🤝 **Shared with third parties** → only Sentry (crash reports) and Google FCM (push tokens). We don't sell data, no ad networks, no analytics resellers.

---

## When you hit the form in Play Console

Workflow:

1. Open Play Console → All apps → ThaiHelper → **App content** (left sidebar) → **Data safety**
2. Click **Manage** → walk through the four sections
3. For each data type listed above: tick the box, then on the follow-up screen pick the purposes shown
4. Save each section before moving to the next
5. Final **Submit** at the end

The form auto-saves drafts, so you can do it in chunks.

---

## What to do if Google rejects the submission

Common reasons + fix:

- **"Privacy policy doesn't match form answers"** → re-read `thaihelper.app/privacy` and make sure every data type declared above is mentioned in the policy. If something's missing in the policy, update the policy first, then resubmit the form.
- **"Encryption answer requires evidence"** → cite "All traffic served over HTTPS via Vercel; database access over TLS to Supabase EU region; passwordless cookie auth via JWT signed with HS256."
- **"Deletion path not provided in app"** → add an "Delete my account" button in profile settings (Phase 2 fix; for now point to the email path in the policy).
