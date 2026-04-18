// Tokenised unsubscribe links for email notifications.
//
// We issue a signed JWT that encodes (role, ref) and a `purpose` claim so it
// can never be confused with a session token. Tokens have a long lifetime
// (10 years) so that old email links never silently stop working — the link
// in an email from a year ago should still unsubscribe the user.
//
// One-click GET /api/unsubscribe?t=<token> toggles the flag to false. The
// /unsubscribe page shows confirmation + a "Resubscribe" button that POSTs
// back to flip the flag the other way.

import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'thaihelper-dev-secret-change-me-in-production'
);

const PURPOSE = 'unsubscribe-message-notifications';
const LIFETIME = '3650d'; // ~10 years

/**
 * Create a signed unsubscribe token.
 * @param {'helper'|'employer'} role
 * @param {string} ref - helper_ref or employer_ref
 */
export async function createUnsubscribeToken(role, ref) {
  return new SignJWT({ role, ref, purpose: PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(LIFETIME)
    .sign(SECRET);
}

/**
 * Verify an unsubscribe token. Returns { role, ref } on success or null.
 */
export async function verifyUnsubscribeToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.purpose !== PURPOSE) return null;
    if (payload.role !== 'helper' && payload.role !== 'employer') return null;
    if (typeof payload.ref !== 'string' || !payload.ref) return null;
    return { role: payload.role, ref: payload.ref };
  } catch {
    return null;
  }
}

/**
 * Build the full unsubscribe URL the email will link to.
 */
export function buildUnsubscribeUrl(token, baseUrl = 'https://thaihelper.app') {
  return `${baseUrl}/api/unsubscribe?t=${encodeURIComponent(token)}`;
}
