// GET /api/company-reject?t=<rejectToken>
//
// The "✕ Reject" link in the admin notification email. Closes the application
// without writing to the company — use "Ask for more information" instead when
// the application might still be salvageable.
//
// Deliberately quiet towards the applicant: an unsolicited rejection notice to
// a company that sprayed every directory it could find is a reply they didn't
// earn, and a bounce we don't want.

import { getServiceSupabase } from '@/lib/supabase';
import { verifyRejectToken } from '@/lib/company-invite';
import { adminPage, esc } from '@/lib/partner-emails';

const ERROR_ACCENT = '#b91c1c';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const payload = await verifyRejectToken(req.query.t);
  if (!payload) {
    return res.status(400).send(adminPage('Link expired',
      `<h2 style="color:${ERROR_ACCENT};margin:0 0 10px;">Link expired or invalid</h2>
       <p style="color:#444;">This link is no longer valid.</p>`, ERROR_ACCENT));
  }

  const supabase = getServiceSupabase();

  const { data: account, error } = await supabase
    .from('company_accounts')
    .select('id, company_name, status')
    .eq('id', payload.id)
    .single();

  if (error || !account) {
    return res.status(404).send(adminPage('Not found',
      `<h2 style="color:${ERROR_ACCENT};margin:0 0 10px;">Application not found</h2>
       <p style="color:#444;">This application no longer exists.</p>`, ERROR_ACCENT));
  }

  if (account.status === 'active') {
    return res.status(200).send(adminPage('Already active',
      `<h2 style="color:#b45309;margin:0 0 10px;">Already onboarded</h2>
       <p style="color:#444;line-height:1.6;"><strong>${esc(account.company_name)}</strong> has already completed onboarding, so this link won't reject it. Suspend the listing from the admin side instead.</p>`,
      '#b45309'));
  }

  const { error: updErr } = await supabase
    .from('company_accounts')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  if (updErr) {
    console.error('company-reject update error', updErr);
    return res.status(500).send(adminPage('Error',
      `<h2 style="color:${ERROR_ACCENT};margin:0 0 10px;">Something went wrong</h2>
       <p style="color:#444;">Could not reject right now. Please try the link again.</p>`, ERROR_ACCENT));
  }

  return res.status(200).send(adminPage('Rejected',
    `<h2 style="color:#64748b;margin:0 0 10px;">Rejected</h2>
     <p style="color:#444;line-height:1.6;"><strong>${esc(account.company_name)}</strong> is marked as rejected. No email was sent to them.</p>`,
    '#64748b'));
}
