/**
 * The Twilio Verify service handle, built once per serverless instance.
 *
 * Extracted when the signup-side OTP routes landed: the same client setup,
 * the same lazy require and the same locale allowlist had been copied into
 * send-otp.js and verify-otp.js, and a third and fourth copy is where the four
 * drift apart. The two account-side routes keep their own copies for now —
 * they work, and rewriting a live verification path to share a module is a
 * change with no upside today.
 *
 * See pages/api/phone/send-otp.js for WHY Verify rather than Programmable SMS
 * (Thai operators drop SMS from unregistered sender IDs; Verify carries those
 * registrations itself).
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

// Locales Verify has a template for AND that we actually offer. An allowlist
// rather than a pass-through: Verify errors on an unknown locale instead of
// falling back, so whatever the client sends must be checked here.
export const VERIFY_LOCALES = new Set(['en', 'th']);

let _client = null;

/**
 * @returns the Verify service resource, or null when Twilio is not configured
 *   or the package is missing. Callers answer null with
 *   500 server_misconfigured — never by skipping verification.
 */
export function getTwilioVerify() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    console.error('[twilio-verify] TWILIO_ACCOUNT_SID / AUTH_TOKEN / VERIFY_SERVICE_SID not fully configured');
    return null;
  }
  if (!_client) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require('twilio');
      _client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    } catch (err) {
      console.error('[twilio-verify] twilio package not installed:', err.message);
      return null;
    }
  }
  return _client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID);
}
