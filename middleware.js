// Rolling-session middleware.
//
// Every authenticated request bumps the session cookie's expiry back to
// SESSION_DAYS in the future, so as long as the user opens the app even
// once a year they never get logged out. Mirrors how Spotify/Instagram
// stay logged in forever.
//
// What this does on each request:
//   - For both helper (th_session) and employer (th_emp_session) cookies,
//     verify the JWT; if valid, re-sign with a fresh expiry and set a
//     new cookie. Invalid/expired/missing tokens are left alone — the
//     downstream API route handles them as before.
//
// What it deliberately doesn't do:
//   - It does NOT gate access to anything. Auth checks still happen in
//     the API routes themselves (getSession / getEmployerSession). The
//     middleware just keeps the cookie fresh.
//   - It does NOT issue cookies for unauthenticated users.
//
// Runs in Next.js Edge Runtime; jose works there because it uses the
// Web Crypto API.

import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

// Keep these in sync with lib/auth.js. (Can't import from lib/ in edge
// runtime without bundling, and duplicating two constants is cheaper
// than restructuring.)
const SESSION_DAYS = 365;
const HELPER_COOKIE = 'th_session';
const EMPLOYER_COOKIE = 'th_emp_session';

const SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

async function refreshCookie(request, response, name) {
  const token = request.cookies.get(name)?.value;
  if (!token || !SECRET) return;

  let payload;
  try {
    const verified = await jwtVerify(token, SECRET);
    payload = verified.payload;
  } catch {
    // Expired or tampered — leave it; the API route will reject the
    // request and the user re-logs in. Don't clear the cookie here:
    // a transient secret rotation or clock skew shouldn't kick people
    // out on a page view.
    return;
  }

  // Re-issue with the same claims but a fresh exp.
  // Strip the auto-managed JWT registered claims so SignJWT can set
  // them cleanly; keep the app-specific payload.
  const { iat, exp, nbf, jti, iss, sub, aud, ...claims } = payload;
  const newToken = await new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(SECRET);

  response.cookies.set({
    name,
    value: newToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
    path: '/',
  });
}

// Countries barred from CREATING anything — comma-separated ISO codes.
//
// Defaults to NG: every IP ever tied to this scam family resolves to Nigeria
// (105.119.9.236, 105.119.14.210 and 197.211.63.156 for EMP-B4MUCP,
// 105.119.9.151 for EMP-3THHAA), and no legitimate account has ever been
// traced there. Set BLOCKED_SIGNUP_COUNTRIES in Vercel to change the list, or
// to an empty string to turn the whole thing off.
//
// Reading stays open to everyone. What is closed is signing up, logging in and
// messaging, because those are the only actions a fraudster abroad needs and
// the only ones a genuine visitor from that country has no use for on a
// Thailand-only hiring site.
//
// BE HONEST ABOUT WHAT THIS BUYS. It is a speed bump: a VPN defeats it in
// under a minute, and the scam family behind EMP-B4MUCP already rotates IPs
// (105.119.9.236, 105.119.14.210, 105.119.9.151, 197.211.63.156). It raises
// the cost of the next re-registration; it does not stop a determined person,
// and nothing else should be relaxed on the assumption that it does.
const BLOCKED_COUNTRIES = new Set(
  (process.env.BLOCKED_SIGNUP_COUNTRIES ?? 'NG')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
);

// Account creation, authentication, and outbound contact. Deliberately NOT the
// whole site: a blanket block would also hit crawlers and anyone reading a
// city page, which costs SEO and gains nothing.
const GUARDED_PREFIXES = [
  '/api/register',
  '/api/employer-signup',
  '/api/auth',
  '/api/employer-auth',
  '/api/conversations',
  '/api/messages',
];

function blockedByCountry(request) {
  if (!BLOCKED_COUNTRIES.size) return null;
  const path = request.nextUrl.pathname;
  if (!GUARDED_PREFIXES.some((p) => path.startsWith(p))) return null;
  // Vercel sets this on every incoming request; absent locally and on any
  // other host, where the check simply does not apply.
  const country = request.headers.get('x-vercel-ip-country');
  return country && BLOCKED_COUNTRIES.has(country.toUpperCase()) ? country : null;
}

export async function middleware(request) {
  const country = blockedByCountry(request);
  if (country) {
    // Logged so the Vercel function logs can answer "did this ever fire, and
    // at whom" — there is no other record of a request's country anywhere.
    console.warn(`[geo] blocked ${request.method} ${request.nextUrl.pathname} from ${country}`);
    return NextResponse.json({ error: 'unavailable_in_region' }, { status: 403 });
  }

  const response = NextResponse.next();

  // Refresh both cookies in parallel. Each call is independent.
  await Promise.all([
    refreshCookie(request, response, HELPER_COOKIE),
    refreshCookie(request, response, EMPLOYER_COOKIE),
  ]);

  return response;
}

// Skip middleware on static assets, the service worker, image
// optimization, and the Next.js internals. Running on /api and pages is
// enough to keep the cookie fresh whenever the user actually interacts.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|robots.txt|sitemap.xml|manifest.json|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|css|js|map)).*)',
  ],
};
