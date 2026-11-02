/**
 * Send the admin the "new partner application" email with its three action
 * buttons. Called from two places — /api/partner-verify when the applicant
 * confirms their address, and /api/partner-signup when a returning applicant
 * has already confirmed it — so the tokens and markup are built once here.
 */

import { Resend } from 'resend';
import { createApproveToken, createMoreInfoToken, createRejectToken } from '@/lib/company-invite';
import { adminNotificationEmail, BASE_URL, FROM_ADDR, ADMIN_ADDR } from '@/lib/partner-emails';

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

  const mail = adminNotificationEmail({
    account,
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
