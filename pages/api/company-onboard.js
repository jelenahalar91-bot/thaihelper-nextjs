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
import { DIRECTORY_TYPE_VALUES } from '@/lib/constants/directory';
import { sanitizeListingInput, toEditableListing, slugifyName } from '@/lib/company-listing';
import { findClaimableListings, pickClaimTarget, fillBlanks } from '@/lib/listing-claim';

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

// The entry this account writes to: the one it already owns, else an unowned
// one its confirmed mailbox proves is theirs (see lib/listing-claim.js), else
// none — and a new row is created.
async function resolveListing(supabase, account) {
  const { data: owned } = await supabase
    .from('directory_listings')
    .select('*')
    .eq('owner_account_id', account.id)
    .limit(1);
  if (owned?.[0]) return owned[0];
  const claimable = await findClaimableListings(supabase, account);
  return pickClaimTarget(claimable, account.listing_draft?.city);
}

export default async function handler(req, res) {
  // GET — resolve the invite token to prefill the onboarding form.
  if (req.method === 'GET') {
    const payload = await verifyInviteToken(req.query.t);
    if (!payload) return res.status(400).json({ error: 'This link is invalid or has expired.' });
    const supabase = getServiceSupabase();
    const { data: account } = await supabase
      .from('company_accounts')
      .select('id, company_name, email, contact_name, phone, type, status, listing_draft')
      .eq('id', payload.id)
      .single();
    if (!account) return res.status(404).json({ error: 'Account not found.' });
    // Hand back the application as a ready-to-edit listing. The company
    // already typed its city, description and links into /partners; making
    // them type the lot again is the surest way to lose them at this step.
    // If they are taking over an entry we wrote, show what it already says
    // wherever their application was silent, so they correct it rather than
    // start from an empty form.
    const existing = await resolveListing(supabase, account);
    const blank = Object.fromEntries(Object.keys(sanitizeListingInput({})).map((k) => [k, '']));
    const prefill = fillBlanks(blank, account.listing_draft || {}, existing);
    if (existing?.logo_url) prefill.logo_url = existing.logo_url;
    const { id: _id, slug: _slug, status: _status, ...listing } = toEditableListing(prefill);
    return res.status(200).json({
      companyName: account.company_name,
      email: account.email,
      contactName: account.contact_name || '',
      phone: account.phone || '',
      type: account.type || '',
      listing,
      claimsListing: existing && !existing.owner_account_id ? existing.slug : null,
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
    .select('id, company_ref, email, company_name, status, listing_draft')
    .eq('id', payload.id)
    .single();

  if (accErr || !account) return res.status(404).json({ error: 'Account not found.' });
  if (account.status === 'requested') {
    return res.status(403).json({ error: 'This application has not been approved yet.' });
  }

  // Build the listing payload, falling back to the application draft — and,
  // when this company is taking over an entry we wrote, to that entry — for
  // anything left blank here. Those answers were already vetted at the
  // approval step, so an empty field on this form means "unchanged", not
  // "delete what you know about us".
  const draft = account.listing_draft || {};
  const target = await resolveListing(supabase, account);
  const fields = fillBlanks(sanitizeListingInput(req.body), draft, target);
  // `type` never arrives empty — sanitizeListingInput defaults it — so an
  // explicit check is the only way to keep the applicant's own answer.
  if (!DIRECTORY_TYPE_VALUES.includes(req.body?.type)) {
    fields.type = draft.type || target?.type || fields.type;
  }
  if (!fields.name) fields.name = account.company_name;
  if (!fields.email) fields.email = account.email;

  const passwordHash = await bcrypt.hash(String(password), 10);

  try {
    // A taken-over entry keeps its address: /directory/<slug> is what we
    // sent the company, what Google has indexed and what families have saved.
    const slug = target?.slug || await uniqueSlug(supabase, fields.name, account.id);

    // Live immediately — the admin already vetted the company at the
    // approval step.
    const listingRow = {
      ...fields,
      slug,
      owner_account_id: account.id,
      status: 'active',
      updated_at: new Date().toISOString(),
    };
    // The price-page link is asked for on /partners but is not a field of the
    // listing form, so it has to be carried across here or it is lost.
    if (draft.pricing_url) listingRow.pricing_url = draft.pricing_url;

    if (target) {
      let q = supabase.from('directory_listings').update(listingRow).eq('id', target.id);
      // Claiming: only if nobody took it in the meantime.
      q = target.owner_account_id ? q.eq('owner_account_id', account.id) : q.is('owner_account_id', null);
      const { data: written, error } = await q.select('id');
      if (error) throw error;
      if (!written?.length) throw new Error(`listing ${target.slug} changed owner during onboarding`);
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
