// POST /api/partner-signup
//
// A company applies to be listed in the Expert Directory.
//
// The application is captured as a full listing draft, not a name and an email
// address: /partners now asks for city, a verifiable link, a description and
// the rest, so an approved application can become a live listing without a
// round of correspondence first (directory_listings.city is NOT NULL — the old
// form never asked for it).
//
// The admin is NOT emailed here. The applicant gets a verification link first,
// and only a confirmed address produces an admin notification. Before that
// rule existed, approve links were being sent to addresses nobody had ever
// proved they could read, and three of four approvals were never opened.

import crypto from 'crypto';
import { Resend } from 'resend';
import { verifyTurnstile } from '@/lib/turnstile';
import { getServiceSupabase } from '@/lib/supabase';
import { createVerifyToken } from '@/lib/company-invite';
import { validateApplication, toListingDraft } from '@/lib/partner-application';
import { verificationEmail, BASE_URL, FROM_ADDR } from '@/lib/partner-emails';
import { sendAdminNotification } from '@/lib/partner-notify';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateCompanyRef() {
  // Public reference for the account. crypto (not Math.random) — it's a
  // user-facing id, no need to be secret, but no reason to be guessable.
  return 'BIZ-' + crypto.randomBytes(6).toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};

  // Honeypot: a field hidden from humans by CSS. Anything that fills it is a
  // bot, so answer exactly as we would on success — a 400 here would just
  // teach the crawler which field to leave alone next time.
  if (typeof body.faxNumber === 'string' && body.faxNumber.trim() !== '') {
    return res.status(200).json({ ok: true, verify: true });
  }

  // Bot/spam guard — same CAPTCHA the register/employer-signup forms use.
  const captcha = await verifyTurnstile(body.turnstileToken);
  if (!captcha.success) {
    return res.status(403).json({ error: captcha.error });
  }

  const { ok, errors, clean } = validateApplication(body);
  if (!ok) {
    return res.status(400).json({ error: 'Please check the highlighted fields.', errors });
  }

  const supabase = getServiceSupabase();
  const draft = toListingDraft(clean);

  const accountFields = {
    company_name: clean.companyName,
    contact_name: clean.contactName,
    phone: clean.phone,
    type: clean.type,
    listing_draft: draft,
    status: 'requested',
    updated_at: new Date().toISOString(),
  };

  let account;
  try {
    const { data: existing } = await supabase
      .from('company_accounts')
      .select('id, status, email_verified')
      .eq('email', clean.email)
      .maybeSingle();

    if (existing?.status === 'active') {
      // Already onboarded — nothing to do. Respond the same as success so we
      // don't reveal account existence to a random submitter.
      return res.status(200).json({ ok: true, verify: false });
    }

    if (existing) {
      const { data, error } = await supabase
        .from('company_accounts')
        .update(accountFields)
        .eq('id', existing.id)
        .select('id, email, company_name, contact_name, phone, type, listing_draft, email_verified')
        .single();
      if (error) throw error;
      account = data;
    } else {
      const { data, error } = await supabase
        .from('company_accounts')
        .insert({
          ...accountFields,
          company_ref: generateCompanyRef(),
          email: clean.email,
          email_verified: false,
        })
        .select('id, email, company_name, contact_name, phone, type, listing_draft, email_verified')
        .single();
      if (error) throw error;
      account = data;
    }
  } catch (err) {
    console.error('partner-signup db error', err);
    return res.status(500).json({ error: 'Could not save your application. Please try again.' });
  }

  // A returning applicant who confirmed their address on an earlier attempt
  // shouldn't have to do it twice — send the admin the updated application
  // straight away.
  if (account.email_verified) {
    await sendAdminNotification(account);
    return res.status(200).json({ ok: true, verify: false });
  }

  const verifyToken = await createVerifyToken(account.id);
  const mail = verificationEmail({
    companyName: clean.companyName,
    contactName: clean.contactName,
    verifyUrl: `${BASE_URL}/api/partner-verify?t=${encodeURIComponent(verifyToken)}`,
  });

  try {
    await resend.emails.send({ from: FROM_ADDR, to: clean.email, ...mail });
  } catch (err) {
    // The application is saved; only the email failed. Say so rather than
    // leaving them on a success screen waiting for a mail that never comes.
    console.error('partner-signup verification email error', err);
    return res.status(500).json({ error: 'We saved your application but could not send the confirmation email. Please email support@thaihelper.app.' });
  }

  return res.status(200).json({ ok: true, verify: true });
}
