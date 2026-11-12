/**
 * Send the admin the "new partner application" email with its three action
 * buttons. Called from two places — /api/partner-verify when the applicant
 * confirms their address, and /api/partner-signup when a returning applicant
 * has already confirmed it — so the tokens and markup are built once here.
 */

import { Resend } from 'resend';
import { createApproveToken, createMoreInfoToken, createRejectToken } from '@/lib/company-invite';
import { adminNotificationEmail, BASE_URL, FROM_ADDR, ADMIN_ADDR } from '@/lib/partner-emails';
import { getServiceSupabase } from '@/lib/supabase';
import { findClaimableListings, findLookalikeListings, pickClaimTarget } from '@/lib/listing-claim';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * @param account  company_accounts row (id, email, company_name, contact_name,
 *                 phone, type, listing_draft)
 * @returns true when the mail went out, false when Resend refused it.
 */
export async function sendAdminNotification(account) {
  const [approveToken, moreInfoToken, rejectToken] = await Promise.all([
    createApproveToken(account.id),
    createMoreInfoToken(account.id),
    createRejectToken(account.id),
  ]);

  // Is this company already in the directory? Approving means something
  // different then — a takeover of an entry we wrote — and the admin should
  // know before clicking. A lookup failure must not hold the mail back.
  let takesOver = null;
  let otherBranches = [];
  let lookalikes = [];
  try {
    const supabase = getServiceSupabase();
    const claimable = await findClaimableListings(supabase, account);
    takesOver = pickClaimTarget(claimable, account.listing_draft?.city);
    otherBranches = claimable.filter((l) => l.id !== takesOver?.id);
    lookalikes = await findLookalikeListings(supabase, account);
  } catch (err) {
    console.error('partner admin notification: existing-entry lookup failed', err);
  }

  const mail = adminNotificationEmail({
    account,
    existing: { takesOver, otherBranches, lookalikes },
    draft: account.listing_draft,
    approveUrl: `${BASE_URL}/api/company-approve?t=${encodeURIComponent(approveToken)}`,
    moreInfoUrl: `${BASE_URL}/api/company-request-info?t=${encodeURIComponent(moreInfoToken)}`,
    rejectUrl: `${BASE_URL}/api/company-reject?t=${encodeURIComponent(rejectToken)}`,
  });

  try {
    await resend.emails.send({ from: FROM_ADDR, to: ADMIN_ADDR, ...mail });
    return true;
  } catch (err) {
    console.error('partner admin notification error', err);
    return false;
  }
}
