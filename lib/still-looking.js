// "Yes, I'm still looking" links for the reactivation letter.
//
// Same shape as lib/unsubscribe.js — a signed JWT carrying (ref) plus a
// `purpose` claim so it can never be mistaken for a session or for an
// unsubscribe token, and so a leaked one does exactly one thing.
//
// WHAT ONE CLICK IS ALLOWED TO DO, and why it is not a login. The letter goes
// to helpers who may well have lost their way into the account, so the
// temptation is to make the link sign them in. It does not: a link that mints
// a session lives in an inbox, gets forwarded, sits in a mail provider's link
// scanner and in whatever backup that inbox has. What this one does instead
// is say "there is still somebody here" — it marks the profile active and
// puts it back in the directory. If the worst happens and somebody else
// clicks it, a helper who stopped looking is visible again for a while. That
// is a nuisance, not a breach.
//
// Thirty days, not seven. The deadline in the letter is a week, but a link
// that dies with the deadline turns a late click — exactly the click we want
// most, from someone who finally opened her mail — into an error page.

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

const PURPOSE = 'still-looking-reactivate';
const LIFETIME = '30d';

/** @param {string} ref - helper_ref */
export async function createStillLookingToken(ref) {
  return new SignJWT({ ref, purpose: PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(LIFETIME)
    .sign(SECRET);
}

/** Verify a token. Returns { ref } on success or null. */
export async function verifyStillLookingToken(token) {
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

export function buildStillLookingUrl(token, baseUrl = 'https://www.thaihelper.app') {
  return `${baseUrl}/api/still-looking?t=${encodeURIComponent(token)}`;
}
