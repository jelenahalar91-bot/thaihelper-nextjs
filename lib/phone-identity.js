// One verified phone number, one account.
//
// A phone number is the first identity on this platform that survives
// re-registration. Email does not: EMP-B4MUCP, EMP-3THHAA, EMP-PO73IS and
// EMP-P2PQTJ are the same person behind four fresh Gmail addresses, and every
// volume counter we have starts at zero each time. Only the LINE handle tied
// them together, and only after they had already messaged someone.
//
// That advantage evaporates if one SIM can verify account after account. So a
// number already verified elsewhere is refused, and a number that was verified
// on an account we suspended is refused for good — the same reasoning as
// lib/contact-blocklist.js, one step earlier in the funnel.
//
// Measured before shipping: across all 1112 accounts exactly two phone numbers
// appear twice, and both are one person who registered twice under the same
// name. This rule costs essentially nobody anything today.

/**
 * Is this number already spoken for?
 *
 * Checks both tables, because a helper and a family are different accounts
 * even when they are the same human — and a scammer running both sides would
 * be the point of checking.
 *
 * @param {object} supabase   service-role client
 * @param {string} e164       digits only, no '+', as normalisePhone returns
 * @param {string} selfRef    the account asking, so it never blocks itself
 * @returns {Promise<{taken: boolean, suspended: boolean, ref?: string}>}
 */
export async function numberTakenBy(supabase, e164, selfRef) {
  if (!e164) return { taken: false, suspended: false };

  const [helpers, employers] = await Promise.all([
    supabase
      .from('helper_profiles')
      .select('helper_ref, status')
      .eq('phone_number', e164)
      .not('phone_verified_at', 'is', null),
    supabase
      .from('employer_accounts')
      .select('employer_ref, status')
      .eq('phone_number', e164)
      .not('phone_verified_at', 'is', null),
  ]);

  // Fail OPEN on a database error. A hiccup here must not stop an honest
  // person from verifying; the cost is that one duplicate could slip through
  // during an outage, which is recoverable. Being unable to verify is not.
  if (helpers.error || employers.error) {
    console.error(
      '[phone-identity] lookup failed:',
      helpers.error?.message || employers.error?.message
    );
    return { taken: false, suspended: false };
  }

  const rows = [
    ...(helpers.data || []).map((r) => ({ ref: r.helper_ref, status: r.status })),
    ...(employers.data || []).map((r) => ({ ref: r.employer_ref, status: r.status })),
  ].filter((r) => r.ref !== selfRef);

  if (!rows.length) return { taken: false, suspended: false };

  // A suspended owner is reported separately: that is not "someone else got
  // there first", it is the same person coming back with a new account.
  const suspended = rows.find((r) => r.status === 'suspended');
  return {
    taken: true,
    suspended: !!suspended,
    ref: (suspended || rows[0]).ref,
  };
}
