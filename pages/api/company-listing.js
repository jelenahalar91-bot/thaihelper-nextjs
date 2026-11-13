// GET /api/company-listing — the logged-in company's own directory listing
// PUT /api/company-listing — update it
//
// Auth: company session cookie (th_biz_session). A company can only ever read
// or write the single listing whose owner_account_id matches its account.

import { getCompanySession } from '@/lib/auth';
import { getServiceSupabase, selectAll } from '@/lib/supabase';
import { sanitizeListingInput, toEditableListing } from '@/lib/company-listing';

async function loadAccount(supabase, session) {
  const { data } = await supabase
    .from('company_accounts')
    .select('id, company_ref, company_name, email, status')
    .eq('company_ref', session.ref)
    .maybeSingle();
  return data;
}

// What the listing has brought in: how often its page was opened and which
// contact buttons were pressed. Counts only — the directory is browsed
// without an account, so there is no "who" to show, and we would not hand a
// family's name to a company for looking at its page anyway.
//
// 'details' is the click from the directory list INTO the page; that visit is
// already a view, so it is not counted as a contact.
const CONTACT_CHANNELS = ['website', 'phone', 'whatsapp', 'line', 'email', 'maps'];

async function loadStats(supabase, listing) {
  const byChannel = {};
  try {
    const { data } = await selectAll(() => supabase
      .from('directory_click_events')
      .select('id, cta_type')
      .eq('listing_id', listing.id)
      .order('id'));
    for (const e of data || []) {
      if (CONTACT_CHANNELS.includes(e.cta_type)) byChannel[e.cta_type] = (byChannel[e.cta_type] || 0) + 1;
    }
  } catch (err) {
    // The numbers are a nicety; the dashboard must still open without them.
    console.error('company-listing stats error', err);
  }
  return {
    views: listing.view_count || 0,
    contacts: Object.values(byChannel).reduce((a, b) => a + b, 0),
    byChannel,
  };
}

export default async function handler(req, res) {
  const session = await getCompanySession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated.' });

  const supabase = getServiceSupabase();
  const account = await loadAccount(supabase, session);
  if (!account || account.status !== 'active') {
    return res.status(401).json({ error: 'Account not active.' });
  }

  if (req.method === 'GET') {
    const { data: listing } = await supabase
      .from('directory_listings')
      .select('*')
      .eq('owner_account_id', account.id)
      .maybeSingle();

    return res.status(200).json({
      account: { ref: account.company_ref, name: account.company_name, email: account.email },
      listing: listing ? toEditableListing(listing) : null,
      stats: listing ? await loadStats(supabase, listing) : null,
    });
  }

  if (req.method === 'PUT') {
    const fields = sanitizeListingInput(req.body);
    if (!fields.name) fields.name = account.company_name;

    const { data: existing } = await supabase
      .from('directory_listings')
      .select('id')
      .eq('owner_account_id', account.id)
      .maybeSingle();

    if (!existing) {
      return res.status(404).json({ error: 'No listing to update.' });
    }

    const { error } = await supabase
      .from('directory_listings')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (error) {
      console.error('company-listing update error', error);
      return res.status(500).json({ error: 'Could not save changes.' });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
