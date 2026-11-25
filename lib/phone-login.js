/**
 * Finding the account behind a phone number, for logging in with it.
 *
 * WHY THIS EXISTS. Until now the only way in was email + reference number,
 * and the reference number arrives by email. For the people this platform is
 * for, that is a door with the key locked inside: of 1,131 active helpers,
 * 138 have a phone number on file and the rest registered with an address
 * many of them opened once, at our request, to get past the form. The
 * standard reply this page's Messenger sends to a Burmese helper still opens
 * with "go to gmail.com and tap Create account". Measured 2026-11-25: of the
 * families who wrote to a helper last seen more than ninety days ago, none —
 * 0 of 229 — ever got an answer.
 *
 * WHAT COUNTS AS A CREDENTIAL. Only a number with phone_verified_at set. An
 * unverified number is something somebody typed; it has never been shown to
 * reach the handset, and letting it open an account would make the login
 * weaker than the signup. Nothing here writes phone_verified_at — that stays
 * with pages/api/phone/verify-otp.js, which is the flow that earns it.
 */

import { getServiceSupabase } from '@/lib/supabase';

/**
 * Accounts that own this verified number, across both roles.
 *
 * Both tables, because one human may be a helper and a family, and because a
 * number pre-dating lib/phone-identity.js could sit on two rows. The caller
 * decides what to do with more than one — see the `role` handling in
 * pages/api/phone-login/start.js — rather than this picking silently.
 *
 * @param {string} e164 digits only, no '+', as normalisePhone returns
 * @returns {Promise<Array<{role, ref, firstName, email, status, smsCount, smsWindowStart}>>}
 */
export async function accountsWithVerifiedPhone(e164) {
  if (!e164) return [];
  const supabase = getServiceSupabase();

  const [helpers, employers] = await Promise.all([
    supabase
      .from('helper_profiles')
      .select('helper_ref, first_name, email, status, phone_sms_count, phone_sms_window_start')
      .eq('phone_number', e164)
      .not('phone_verified_at', 'is', null),
    supabase
      .from('employer_accounts')
      .select('employer_ref, first_name, email, status, phone_sms_count, phone_sms_window_start')
      .eq('phone_number', e164)
      .not('phone_verified_at', 'is', null),
  ]);

  // Fail CLOSED, unlike numberTakenBy. There the cost of a database hiccup is
  // one duplicate account; here it would be handing out a session on an
  // incomplete read.
  if (helpers.error || employers.error) {
    throw new Error(
      `phone-login lookup failed: ${helpers.error?.message || employers.error?.message}`,
    );
  }

  return [
    ...(helpers.data || []).map((r) => ({ role: 'helper', ref: r.helper_ref, ...rest(r) })),
    ...(employers.data || []).map((r) => ({ role: 'employer', ref: r.employer_ref, ...rest(r) })),
  ];
}

function rest(r) {
  return {
    firstName: r.first_name || '',
    email: r.email || '',
    status: r.status || 'active',
    smsCount: r.phone_sms_count,
    smsWindowStart: r.phone_sms_window_start,
  };
}

export function tableFor(role) {
  return role === 'employer'
    ? { table: 'employer_accounts', refCol: 'employer_ref' }
    : { table: 'helper_profiles', refCol: 'helper_ref' };
}
