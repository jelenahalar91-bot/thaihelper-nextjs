/**
 * Proof that a phone number was verified BEFORE an account existed.
 *
 * WHY THIS HAS TO EXIST. Phone verification used to happen after signup: the
 * card on the dashboard, the OTP routes keyed on a session, and the number
 * written onto the account row that was already there. That ordering is what
 * made "no account without a verified number" impossible to state — the
 * account is the thing holding the verification.
 *
 * So the OTP exchange moves in front of the account, and this token is what
 * carries its result across the two requests. Twilio Verify makes that
 * possible: `verifications.create` and `verificationChecks.create` are keyed on
 * the phone number itself, never on anything of ours, so neither call needs a
 * row to write to.
 *
 * WHAT IT IS. A short-lived signed JWT naming one number, nothing else. Signed
 * with JWT_SECRET, like a session, because the claim it carries is exactly as
 * sensitive: whoever holds it skips the SMS step. It is NOT a session — no ref,
 * no role, no cookie, and the signup route is the only thing that accepts it.
 *
 * WHY IT EXPIRES FAST. Thirty minutes is long enough to finish a registration
 * form that was already half filled in when the code arrived, and short enough
 * that a token harvested from a browser is worthless by the time anybody could
 * use it. It is also single-purpose: `aud` is checked, so a session token
 * cannot be presented here and this cannot be presented as a session.
 *
 * WHAT IT DOES NOT PROVE. That the number is still unclaimed. Two people can
 * hold tokens for the same number, and a number can be verified on another
 * account between the check and the signup, so /api/employer-signup re-asks
 * lib/phone-identity.js at insert time. This token proves one thing only:
 * somebody answered an SMS at this number, recently.
 */

import { SignJWT, jwtVerify } from 'jose';

function loadJwtSecret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      'JWT_SECRET environment variable is missing or shorter than 32 characters. '
      + 'Phone-signup tokens cannot be signed without it.'
    );
  }
  return new TextEncoder().encode(value);
}

const SECRET = loadJwtSecret();

// Minutes a proof stays usable. Surfaced to the client so the form can say how
// long the user has rather than failing silently at submit.
export const PHONE_PROOF_TTL_MIN = 30;

// Checked on the way back in, so this token is only ever accepted by the thing
// it was minted for.
const AUDIENCE = 'phone-signup-proof';

/**
 * Mint a proof for a number that Twilio has just approved.
 *
 * @param {object} p
 * @param {string} p.e164         digits only, no '+', as normalisePhone returns
 * @param {string} p.countryCode  as the user picked it, e.g. '+66'
 */
export async function createPhoneProof({ e164, countryCode }) {
  if (!e164) throw new Error('createPhoneProof: e164 required');
  return new SignJWT({ phone: String(e164), cc: countryCode || null })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${PHONE_PROOF_TTL_MIN}m`)
    .sign(SECRET);
}

/**
 * Read a proof back.
 *
 * @returns {Promise<{phone: string, countryCode: string|null}|null>} null for
 *   anything that is not a currently valid proof — expired, tampered with,
 *   wrong audience, or a token of some other kind. The caller treats null as
 *   "no verified number was presented" and refuses the signup; it never needs
 *   to know which of those it was, and telling it apart would only help
 *   somebody probing.
 */
export async function readPhoneProof(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const { payload } = await jwtVerify(token, SECRET, { audience: AUDIENCE });
    const phone = typeof payload.phone === 'string' ? payload.phone : '';
    if (!/^\d{8,15}$/.test(phone)) return null;
    return {
      phone,
      countryCode: typeof payload.cc === 'string' ? payload.cc : null,
    };
  } catch {
    return null;
  }
}
