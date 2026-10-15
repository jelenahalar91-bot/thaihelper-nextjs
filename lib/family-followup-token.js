// Signed one-click links for the "are you still looking?" email.
//
// Same shape and secret as lib/unsubscribe.js and lib/review-dispute.js, with
// its own `purpose` claim so a token from one flow can never be replayed in
// another.
//
// No login, on purpose. The whole point of the email is to reach the 131
// families who signed up more than a month ago and have not come back since
// — asking them to remember a ref number and log in first is asking them to
// do nothing, which is exactly what we already have.
//
// The token names the family, never the answer: one token makes all four
// buttons, and the answer travels in the query string where the API checks
// it against a whitelist. A leaked link can set that one family's search
// status, which is the same thing the link is for.

import { SignJWT, jwtVerify } from 'jose';

function loadJwtSecret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      'JWT_SECRET environment variable is missing or shorter than 32 characters. '
      + 'Set a strong random secret in .env.local (or Vercel env vars). '
      + 'See .env.local.example for the expected format.'
    );
  }
  return new TextEncoder().encode(value);
}

const SECRET = loadJwtSecret();
const PURPOSE = 'family-followup';
// Long-lived like the other mail tokens: people answer old email, and a link
// that has quietly expired looks like a broken site rather than an old one.
const LIFETIME = '3650d';

const BASE = 'https://thaihelper.app';

/** The four answers a family can give from the email. */
export const FOLLOWUP_ANSWERS = ['still_searching', 'found_here', 'found_elsewhere', 'not_looking'];

export async function createFollowupToken(employerRef) {
  return new SignJWT({ ref: employerRef, purpose: PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(LIFETIME)
    .sign(SECRET);
}

/** Returns { ref } or null. */
export async function verifyFollowupToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.purpose !== PURPOSE) return null;
    if (typeof payload.ref !== 'string' || !payload.ref) return null;
    return { ref: payload.ref };
  } catch {
    return null;
  }
}

/**
 * Where an email button points. A PAGE, never the API.
 *
 * Mail gateways and security scanners fetch every link in an incoming
 * message before the recipient sees it, so a link that changes something on
 * GET gets pressed by a robot. /search-status does nothing on load; it posts
 * the answer once a real browser has it open. See pages/api/family-followup.js.
 */
export function buildFollowupUrl(token, answer) {
  return `${BASE}/search-status?t=${encodeURIComponent(token)}&a=${encodeURIComponent(answer)}`;
}
