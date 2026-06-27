// Signed tokens for the invite-gated company onboarding flow.
//
// Two distinct purposes, so a token issued for one step can never be
// replayed at another:
//   - 'company-approve' : in the ADMIN email. One click approves the
//     application and triggers the company's invite email.
//   - 'company-invite'  : in the COMPANY email. Opens the onboarding page
//     where the company sets its password and fills its listing.
//
// Both encode the company_accounts.id and share the session secret, failing
// closed if JWT_SECRET is missing/weak (same policy as lib/auth.js).

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

const APPROVE_PURPOSE = 'company-approve';
const INVITE_PURPOSE = 'company-invite';
// Admin may sit on an application for a while; invite link should survive a
// company taking days to act. Both generous but not unbounded.
const APPROVE_LIFETIME = '60d';
const INVITE_LIFETIME = '30d';

async function sign(id, purpose, lifetime) {
  return new SignJWT({ id, purpose })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(lifetime)
    .sign(SECRET);
}

async function verify(token, purpose) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.purpose !== purpose || !payload.id) return null;
    return { id: payload.id };
  } catch {
    return null;
  }
}

/** Token for the admin's one-click "Approve & send access" link. */
export const createApproveToken = (id) => sign(id, APPROVE_PURPOSE, APPROVE_LIFETIME);
export const verifyApproveToken = (token) => verify(token, APPROVE_PURPOSE);

/** Token for the company's onboarding (set password + fill listing) link. */
export const createInviteToken = (id) => sign(id, INVITE_PURPOSE, INVITE_LIFETIME);
export const verifyInviteToken = (token) => verify(token, INVITE_PURPOSE);
