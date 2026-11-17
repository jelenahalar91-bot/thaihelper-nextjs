import crypto from 'crypto';

// A helper's public invite code, as carried in the "invite a friend" link.
//
// It cannot be the helper ref: the ref is the login credential, and an invite
// link is meant to be forwarded. The code is derived from the ref with a keyed
// hash instead, so it is stable, needs no column, and cannot be turned back
// into the ref. To find out who a code belongs to, compute it for every helper
// (scripts/invite-report.js does that).
export function inviteCodeFor(helperRef) {
  if (!helperRef || !process.env.JWT_SECRET) return null;
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(`invite:${helperRef}`)
    .digest('hex')
    .slice(0, 8);
}
