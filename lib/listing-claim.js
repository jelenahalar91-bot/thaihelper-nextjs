// Matching an approved company account to a directory entry that already
// exists.
//
// Most of the directory was written by us from public information, so those
// rows have no owner. When one of those companies applies at /partners it is
// asking to take its entry over — not to get a second one. Without this, the
// onboarding step inserted a fresh row next to the curated one (the first
// claim, Kiidu on 11.11.2026, would have produced /directory/kiidu and
// /directory/kiidu-thailand-co-ltd side by side).
//
// The proof we accept is the mailbox. An application only reaches approval
// after its address has been confirmed by a click, so:
//   - the confirmed address IS the address published on the entry, or
//   - the confirmed address sits on the same domain as the entry's website.
// Anything looser (same name, same phone, a website typed into the form) can
// be claimed by a stranger and is left for a human to sort out.

const clean = (v) => String(v || '').trim().toLowerCase();

/** "https://www.Kiidu.com/en" → "kiidu.com" */
export function hostOf(url) {
  const s = clean(url).replace(/^[a-z]+:\/\//, '').replace(/^www\./, '');
  return s.split(/[/?#]/)[0].replace(/:\d+$/, '');
}

/** True when a confirmed mailbox proves control of this unowned entry. */
export function mailboxProvesListing(email, listing) {
  const addr = clean(email);
  if (!addr.includes('@') || !listing || listing.owner_account_id) return false;
  if (clean(listing.email) === addr) return true;
  const domain = addr.split('@')[1];
  return Boolean(domain) && hostOf(listing.website) === domain;
}

/**
 * Every unowned entry this account's mailbox proves. Usually one; a chain
 * with one head-office inbox can match several branches.
 *
 * Compared in JS, not with ilike: "_" and "%" are wildcards there and both
 * turn up in real addresses.
 */
export async function findClaimableListings(supabase, account) {
  if (!account?.email) return [];
  const { data, error } = await supabase
    .from('directory_listings')
    .select('*')
    .is('owner_account_id', null)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data.filter((l) => mailboxProvesListing(account.email, l));
}

// Hosts thousands of unrelated businesses share — the same host says nothing.
const SHARED_HOSTS = new Set([
  'facebook.com', 'm.facebook.com', 'fb.com', 'fb.me', 'instagram.com',
  'line.me', 'lin.ee', 'linktr.ee', 'google.com', 'sites.google.com',
  'maps.app.goo.gl', 'goo.gl', 'g.page', 'wa.me', 'tiktok.com', 'youtube.com',
]);

/**
 * Entries that look like the applicant's company but that its mailbox does
 * NOT prove: same website, different or unrelated address. Approving such an
 * application creates a second entry next to the first, and it is also what
 * an impersonator's application looks like — so the admin is told, and
 * nothing is linked automatically.
 */
export async function findLookalikeListings(supabase, account) {
  const host = hostOf(account?.listing_draft?.website);
  if (!host || SHARED_HOSTS.has(host)) return [];
  const { data, error } = await supabase
    .from('directory_listings')
    .select('slug, name, city, email, website, owner_account_id');
  if (error || !data) return [];
  return data.filter((l) =>
    hostOf(l.website) === host
    && l.owner_account_id !== account.id
    && !mailboxProvesListing(account.email, l));
}

/**
 * An account owns exactly one entry, so of several matches take the one in
 * the city the applicant named, else the oldest. The others stay as they are.
 */
export function pickClaimTarget(listings, draftCity) {
  if (!listings?.length) return null;
  const city = clean(draftCity);
  return listings.find((l) => city && clean(l.city) === city) || listings[0];
}

/**
 * Fill the blanks in what the company submitted: first from its application,
 * then from the entry it is taking over. An empty field on the onboarding
 * form means "unchanged", never "delete what was there" — otherwise a claim
 * would wipe the specialties and Thai text we had already written.
 */
export function fillBlanks(fields, draft = {}, existing = null) {
  const out = { ...fields };
  for (const key of Object.keys(out)) {
    if (out[key]) continue;
    if (draft[key]) out[key] = draft[key];
    else if (existing?.[key]) out[key] = existing[key];
  }
  return out;
}
