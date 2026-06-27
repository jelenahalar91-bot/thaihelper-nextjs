// POST /api/company-onboard
//
// Completes the invite-gated onboarding: the company opens its private link,
// sets a password and fills its listing. On success the account goes 'active',
// its directory listing is created/updated (live), and a company session
// cookie is set so they land straight in the dashboard.
//
// Body: { t: <inviteToken>, password, confirmPassword?, ...listing fields }

import bcrypt from 'bcryptjs';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyInviteToken } from '@/lib/company-invite';
import { createToken, setSessionCookie } from '@/lib/auth';
import { sanitizeListingInput, slugifyName } from '@/lib/company-listing';

const MIN_PASSWORD = 8;

async function uniqueSlug(supabase, name, accountId) {
  const base = slugifyName(name);
  // If this account already owns a listing, keep its slug stable.
  const { data: owned } = await supabase
    .from('directory_listings')
    .select('slug')
    .eq('owner_account_id', accountId)
    .maybeSingle();
  if (owned?.slug) return owned.slug;

  let slug = base;
  for (let i = 0; i < 6; i++) {
    const { data: clash } = await supabase
      .from('directory_listings')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!clash) return slug;
    slug = `${base}-${Math.floor(i + 2)}`;
  }
  // Fallback: suffix with a slice of the account id to all but guarantee uniqueness.
  return `${base}-${String(accountId).slice(0, 6)}`;
}

export default async function handler(req, res) {
  // GET — resolve the invite token to prefill the onboarding form.
  if (req.method === 'GET') {
    const payload = await verifyInviteToken(req.query.t);
    if (!payload) return res.status(400).json({ error: 'This link is invalid or has expired.' });
    const supabase = getServiceSupabase();
    const { data: account } = await supabase
      .from('company_accounts')
      .select('company_name, email, contact_name, phone, type, status')
      .eq('id', payload.id)
      .single();
    if (!account) return res.status(404).json({ error: 'Account not found.' });
    return res.status(200).json({
      companyName: account.company_name,
      email: account.email,
      contactName: account.contact_name || '',
      phone: account.phone || '',
      type: account.type || '',
      alreadyActive: account.status === 'active',
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { t, password } = req.body || {};
  if (!t) return res.status(400).json({ error: 'Missing invite token.' });
  if (!password || String(password).length < MIN_PASSWORD) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters.` });
  }

  const payload = await verifyInviteToken(t);
  if (!payload) return res.status(400).json({ error: 'This link is invalid or has expired.' });

  const supabase = getServiceSupabase();

  const { data: account, error: accErr } = await supabase
    .from('company_accounts')
    .select('id, company_ref, email, company_name, status')
    .eq('id', payload.id)
    .single();

  if (accErr || !account) return res.status(404).json({ error: 'Account not found.' });
  if (account.status === 'requested') {
    return res.status(403).json({ error: 'This application has not been approved yet.' });
  }

  // Build the listing payload. Default the display name to the company name.
  const fields = sanitizeListingInput(req.body);
  if (!fields.name) fields.name = account.company_name;
  if (!fields.email) fields.email = account.email;

  const passwordHash = await bcrypt.hash(String(password), 10);

  try {
    const slug = await uniqueSlug(supabase, fields.name, account.id);

    // Upsert the owned listing. Live immediately — the admin already vetted
    // the company at the approval step.
    const { data: existing } = await supabase
      .from('directory_listings')
      .select('id')
      .eq('owner_account_id', account.id)
      .maybeSingle();

    const listingRow = {
      ...fields,
      slug,
      owner_account_id: account.id,
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase
        .from('directory_listings')
        .update(listingRow)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('directory_listings')
        .insert(listingRow);
      if (error) throw error;
    }

    // Activate the account.
    const { error: updErr } = await supabase
      .from('company_accounts')
      .update({
        password_hash: passwordHash,
        status: 'active',
        email_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id);
    if (updErr) throw updErr;
  } catch (err) {
    console.error('company-onboard error', err);
    return res.status(500).json({ error: 'Could not save your listing. Please try again.' });
  }

  // Log them in.
  const token = await createToken({
    ref: account.company_ref,
    email: account.email,
    firstName: account.company_name,
    role: 'company',
  });
  setSessionCookie(res, token, 'company');

  return res.status(200).json({ ok: true });
}
