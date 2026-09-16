// Signed one-click links for disputing a review.
//
// The helper gets these in the "someone rated you" email. A logged-in-only
// flow would have been simpler, but the people most likely to need it are
// the ones least likely to still know their ref number — and a helper who
// has just been publicly called a thief should not have to fight a login
// form first.
//
// Same shape and secret as lib/unsubscribe.js, with its own `purpose` claim
// so a token from one flow can never be replayed in the other.

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

const PURPOSE = 'review-dispute';
// Long-lived on purpose: a review does not stop being wrong after 30 days,
// and helpers do not read their email on our schedule.
const LIFETIME = '3650d';

/**
 * Create a dispute token for one specific review.
 * @param {string} ratingId - helper_ratings.id
 * @param {string} helperRef - who the review is about (checked on redeem)
 */
export async function createDisputeToken(ratingId, helperRef) {
  return new SignJWT({ ratingId, helperRef, purpose: PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(LIFETIME)
    .sign(SECRET);
}

/**
 * Verify a dispute token. Returns { ratingId, helperRef } or null.
 */
export async function verifyDisputeToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.purpose !== PURPOSE) return null;
    if (typeof payload.ratingId !== 'string' || !payload.ratingId) return null;
    if (typeof payload.helperRef !== 'string' || !payload.helperRef) return null;
    return { ratingId: payload.ratingId, helperRef: payload.helperRef };
  } catch {
    return null;
  }
}

export function buildDisputeUrl(token, baseUrl = 'https://thaihelper.app') {
  return `${baseUrl}/review-dispute?t=${encodeURIComponent(token)}`;
}
