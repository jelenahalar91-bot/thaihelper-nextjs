import { SignJWT, jwtVerify } from 'jose';
import { getServiceSupabase } from './supabase';

// Loaded once at module import. Throws immediately if JWT_SECRET is
// missing or too short — better the app refuses to boot than silently
// signs tokens with a known-public default, which would let an attacker
// forge sessions for any helper or employer.
function loadJwtSecret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      'JWT_SECRET environment variable is missing or shorter than 32 characters. '
      + 'Set a strong random secret in .env.local (or Vercel env vars) before '
      + 'starting the app. See .env.local.example for the expected format.'
    );
  }
  return new TextEncoder().encode(value);
}

const SECRET = loadJwtSecret();

// Session lifetime: 365 days. Long-running session is intentional —
// helpers and families log in rarely (every few days/weeks) and getting
// kicked out is high-friction in the native app. Spotify/Instagram do
// the same. Browsers cap cookie Max-Age at ~400 days (RFC 6265bis), so
// 365 is the practical maximum that survives a year of inactivity.
const SESSION_DAYS = 365;

// Cookie names — helpers and employers get separate cookies so the same
// browser can be logged in as both roles at the same time (useful for testing,
// and for employers who are also helpers).
const HELPER_COOKIE = 'th_session';
const EMPLOYER_COOKIE = 'th_emp_session';
// Companies are the 3rd role (directory listings). Separate cookie so a
// browser can be logged in as helper / employer / company independently.
const COMPANY_COOKIE = 'th_biz_session';

// last_login_at powers the "Recently active" sort on /helpers and
// /employers-browse. It used to be written ONLY from the credential-login
// endpoints (POST /api/auth, /api/employer-auth) — but with 365-day
// sessions (see SESSION_DAYS above), a genuinely daily-active user never
// hits that endpoint again after their first login, so their timestamp
// froze at signup while people who happened to sign up recently floated
// to the top of "Recently active" regardless of whether they'd been back.
// Found 2026-07-13: Michael A. (registered 31d ago) ranked #1 "Recently
// active" purely because his one-time post-signup auto-login was, by
// chance, the most recent last_login_at value across all 57 employers —
// 43 of them (75%) had no value at all.
//
// Fix: touch last_login_at from inside session validation itself, so it
// reflects ANY authenticated request, not just the login form. Throttled
// to once per hour per user via a conditional UPDATE (only writes when
// the existing value is missing or >1h stale) — this runs on nearly
// every request across the whole site, so an unconditional write would
// be needless DB load.
const LAST_ACTIVE_THROTTLE_MS = 60 * 60 * 1000;
const LAST_ACTIVE_TABLE_BY_ROLE = {
  helper: 'helper_profiles',
  employer: 'employer_accounts',
};
const LAST_ACTIVE_REF_COLUMN_BY_ROLE = {
  helper: 'helper_ref',
  employer: 'employer_ref',
};

// Fire-and-forget — callers must NOT await this. Session validation is on
// the hot path of every authenticated request; blocking it on a DB write
// (even a cheap one) would add latency site-wide for a signal nobody is
// watching in real time.
function touchLastActive(ref, role) {
  const table = LAST_ACTIVE_TABLE_BY_ROLE[role];
  if (!table || !ref) return;
  const refColumn = LAST_ACTIVE_REF_COLUMN_BY_ROLE[role];
  const staleCutoff = new Date(Date.now() - LAST_ACTIVE_THROTTLE_MS).toISOString();
  getServiceSupabase()
    .from(table)
    .update({ last_login_at: new Date().toISOString() })
    .eq(refColumn, ref)
    .or(`last_login_at.is.null,last_login_at.lt.${staleCutoff}`)
    .then(({ error }) => {
      if (error) console.error(`touchLastActive(${role}) failed:`, error.message);
    });
}

/**
 * Create a signed JWT.
 * @param {object} payload - { ref, email, firstName, role }
 *   role: 'helper' | 'employer' | 'company'  (defaults to 'helper' for backwards compat)
 */
export async function createToken({ ref, email, firstName, role = 'helper' }) {
  return new SignJWT({ ref, email, firstName, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(SECRET);
}

function parseCookie(req, name) {
  const cookies = req.headers.cookie || '';
  const re = new RegExp(`${name}=([^;]+)`);
  const match = cookies.match(re);
  return match ? match[1] : null;
}

// The native mobile app can't use HttpOnly cookies, so it sends the same
// JWT as an Authorization: Bearer header instead.
function parseBearer(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  return match ? match[1] : null;
}

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

// Try each candidate token in order and return the first valid payload
// matching the expected role. Cookie comes before bearer so existing web
// sessions are unaffected when both happen to be present (e.g. WebViews).
async function sessionFromCandidates(tokens, role) {
  for (const token of tokens) {
    if (!token) continue;
    const payload = await verifyToken(token);
    if (!payload) continue;
    if ((payload.role || 'helper') === role) {
      touchLastActive(payload.ref, role);
      return payload;
    }
  }
  return null;
}

/**
 * Get the helper session from the request (legacy function name kept for
 * backwards compatibility with all existing helper API routes).
 * Accepts the session cookie (web) or a Bearer token (mobile app).
 */
export async function getSession(req) {
  return sessionFromCandidates(
    [parseCookie(req, HELPER_COOKIE), parseBearer(req)],
    'helper'
  );
}

/**
 * Get the employer session from the request.
 * Accepts the session cookie (web) or a Bearer token (mobile app).
 */
export async function getEmployerSession(req) {
  return sessionFromCandidates(
    [parseCookie(req, EMPLOYER_COOKIE), parseBearer(req)],
    'employer'
  );
}

/**
 * Get the company session from the request.
 * Accepts the session cookie (web) or a Bearer token (mobile app).
 */
export async function getCompanySession(req) {
  return sessionFromCandidates(
    [parseCookie(req, COMPANY_COOKIE), parseBearer(req)],
    'company'
  );
}

/**
 * Get whichever session is present (helper or employer).
 *
 * Role precedence:
 *   - If the caller passes a hint (req.query.role or req.body.role), that
 *     role is loaded first.
 *   - Without a hint, employer is checked before helper. This is the safe
 *     default for shared-browser scenarios where one user has BOTH a
 *     helper cookie (legacy testing account) and an employer cookie (the
 *     real account they're using right now): the previous helper-first
 *     default would silently hijack employer requests onto the stale
 *     helper account. Helper-only callers should pass ?role=helper.
 */
export async function getAnySession(req) {
  const hint =
    req.query?.role === 'employer' || req.body?.role === 'employer'
      ? 'employer'
      : req.query?.role === 'helper' || req.body?.role === 'helper'
      ? 'helper'
      : null;

  if (hint === 'helper') {
    const helper = await getSession(req);
    if (helper) return { ...helper, role: 'helper' };
    const employer = await getEmployerSession(req);
    if (employer) return { ...employer, role: 'employer' };
    return null;
  }

  // Default + hint==='employer': employer first.
  const employer = await getEmployerSession(req);
  if (employer) return { ...employer, role: 'employer' };
  const helper = await getSession(req);
  if (helper) return { ...helper, role: 'helper' };
  return null;
}

function buildCookie(name, value, maxAge) {
  const isProduction = process.env.NODE_ENV === 'production';
  // SameSite=Lax: cookie is sent on top-level navigation from other sites
  // (e.g. bookmarks, Google search results) — required so users stay logged in
  // when they return to the site via external links.
  return `${name}=${value}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Max-Age=${maxAge}; Path=/`;
}

function cookieForRole(role) {
  if (role === 'employer') return EMPLOYER_COOKIE;
  if (role === 'company') return COMPANY_COOKIE;
  return HELPER_COOKIE;
}

export function setSessionCookie(res, token, role = 'helper') {
  const maxAge = 60 * 60 * 24 * SESSION_DAYS;
  res.setHeader('Set-Cookie', buildCookie(cookieForRole(role), token, maxAge));
}

export function clearSessionCookie(res, role = 'helper') {
  res.setHeader('Set-Cookie', buildCookie(cookieForRole(role), '', 0));
}
