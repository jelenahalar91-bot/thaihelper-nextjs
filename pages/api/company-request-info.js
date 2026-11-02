// GET /api/company-request-info?t=<moreInfoToken>
//
// The "✎ Ask for more information" link in the admin notification email.
// Emails the applicant a list of exactly what their application is missing and
// leaves it pending, so it can still be approved once they reply.
//
// The list is computed from the stored listing draft rather than being a fixed
// form letter — asking a company for a website it already gave us is how you
// lose the ones worth having.

import { Resend } from 'resend';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyMoreInfoToken } from '@/lib/company-invite';
import { missingDetails } from '@/lib/partner-application';
import { moreInfoEmail, adminPage, esc, BASE_URL, FROM_ADDR } from '@/lib/partner-emails';

const resend = new Resend(process.env.RESEND_API_KEY);
const ERROR_ACCENT = '#b91c1c';
const WARN_ACCENT = '#b45309';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const payload = await verifyMoreInfoToken(req.query.t);
  if (!payload) {
    return res.status(400).send(adminPage('Link expired',
      `<h2 style="color:${ERROR_ACCENT};margin:0 0 10px;">Link expired or invalid</h2>
       <p style="color:#444;">This link is no longer valid.</p>`, ERROR_ACCENT));
  }

  const supabase = getServiceSupabase();

  const { data: account, error } = await supabase
    .from('company_accounts')
    .select('id, email, company_name, contact_name, phone, type, status, listing_draft')
    .eq('id', payload.id)
    .single();

  if (error || !account) {
    return res.status(404).send(adminPage('Not found',
      `<h2 style="color:${ERROR_ACCENT};margin:0 0 10px;">Application not found</h2>
       <p style="color:#444;">This application no longer exists.</p>`, ERROR_ACCENT));
  }

  const missing = missingDetails(account.listing_draft || {}, account);
  const mail = moreInfoEmail({
    companyName: account.company_name,
    contactName: account.contact_name,
    missing,
    applyUrl: `${BASE_URL}/partners`,
  });

  try {
    await resend.emails.send({ from: FROM_ADDR, to: account.email, ...mail });
  } catch (err) {
    console.error('company-request-info email error', err);
    return res.status(500).send(adminPage('Email failed',
      `<h2 style="color:${ERROR_ACCENT};margin:0 0 10px;">Could not send the email</h2>
       <p style="color:#444;line-height:1.6;">The application is untouched. Write to <strong>${esc(account.email)}</strong> by hand, or try this link again.</p>`,
      ERROR_ACCENT));
  }

  await supabase
    .from('company_accounts')
    .update({ info_requested_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', account.id);

  const asked = missing.length
    ? `<ul style="color:#444;font-size:14px;line-height:1.7;margin:14px 0 0;padding-left:20px;">${missing.map(m => `<li>${esc(m)}</li>`).join('')}</ul>`
    : '<p style="color:#888;font-size:13px;margin:14px 0 0;">Nothing specific was missing, so they were asked for a link and a description.</p>';

  return res.status(200).send(adminPage('Information requested',
    `<h2 style="color:${WARN_ACCENT};margin:0 0 10px;">We've asked for more ✎</h2>
     <p style="color:#444;line-height:1.6;">Emailed <strong>${esc(account.email)}</strong> asking for what's missing from <strong>${esc(account.company_name)}</strong>'s application. It stays pending — approve it from the original email once they reply.</p>
     ${asked}`,
    WARN_ACCENT));
}
