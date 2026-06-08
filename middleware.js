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

export async function middleware(request) {
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
