// Blocklist of contact handles belonging to suspended accounts.
//
// lib/spam-signals.js counts behaviour per account over a rolling window, which
// only works against a scammer who keeps using one account. EMP-B4MUCP was
// suspended on 2026-09-09; the next day the same person was back as EMP-3THHAA
// with a fresh Gmail address, every counter at zero, pushing the same LINE ID
// (Q6hsHvNY8E) it had used since July. It stayed under every threshold we have
// and was stopped by a helper's report, 28 hours later.
//
// The handle is what survives re-registration: it is the destination the scheme
// depends on, so changing it costs the scammer the accounts already lured there.
// That makes it a far better identity than an email address.
//
// HANDLE TYPES — deliberately only personal identifiers:
//
//   line:<id>      line.me / lin.ee links
//   telegram:<id>  t.me links
//   phone:<digits> wa.me links and bare phone numbers
//   email:<addr>
//
// Plain URLs are NOT harvested. A suspended account that once linked a news
// article must not get that article blocked platform-wide — the blocklist may
// only ever contain things that identify a *person*.

// Thai mobiles are 9 national digits; 15 is the E.164 maximum.
const MIN_PHONE_DIGITS = 9;
const MAX_PHONE_DIGITS = 15;
// Below this, an id is too generic to be safely attributable to one person.
const MIN_ID_LENGTH = 4;

const LINE_RE = /(?:line\.me\/(?:R\/)?ti\/(?:p|g2?)\/|lin\.ee\/)~?([A-Za-z0-9_@.%-]+)/gi;
const TELEGRAM_RE = /t\.me\/(?:joinchat\/)?([A-Za-z0-9_+-]+)/gi;
const WHATSAPP_RE = /wa\.me\/(\+?\d[\d\s-]*)/gi;
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gi;
const PHONE_RE = /(?:\+?\d[\d\s\-()]{5,}\d)/g;

// URL matches swallow whatever punctuation ends the sentence they sit in.
const TRAILING_PUNCT_RE = /[.,;:!?)\]}'"]+$/;

/**
 * Canonical digit form of a phone number.
 *
 * Thailand-first: a single leading 0 is the Thai trunk prefix and becomes 66.
 * The platform is Thailand-only, so this is right far more often than not —
 * and when it is wrong the two spellings simply fail to match, which costs us
 * a block we would not otherwise have had. It can never produce a false one.
 *
 * @returns {string|null} digits, or null if this cannot be a phone number
 */
function normalizePhone(raw) {
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `66${digits.slice(1)}`;
  if (digits.length < MIN_PHONE_DIGITS || digits.length > MAX_PHONE_DIGITS) return null;
  return digits;
}

function cleanId(raw) {
  const id = String(raw).replace(TRAILING_PUNCT_RE, '').toLowerCase();
  return id.length >= MIN_ID_LENGTH ? id : null;
}

/**
 * Every personal contact handle in a piece of text, in canonical form.
 *
 * The same function runs at harvest time and at send time, so the two always
 * agree on spelling — that is the whole point of normalizing.
 *
 * @param {string} text
 * @returns {Array<{handle: string, kind: string}>} deduplicated
 */
export function extractHandles(text) {
  if (typeof text !== 'string' || !text) return [];
  const found = new Map();

  const add = (kind, value) => {
    if (value) found.set(`${kind}:${value}`, { handle: `${kind}:${value}`, kind });
  };

  for (const [, id] of text.matchAll(LINE_RE)) add('line', cleanId(id));
  for (const [, id] of text.matchAll(TELEGRAM_RE)) add('telegram', cleanId(id));
  for (const [, num] of text.matchAll(WHATSAPP_RE)) add('phone', normalizePhone(num));
  for (const addr of text.match(EMAIL_RE) || []) {
    add('email', addr.replace(TRAILING_PUNCT_RE, '').toLowerCase());
  }
  for (const num of text.match(PHONE_RE) || []) add('phone', normalizePhone(num));

  return [...found.values()];
}

/**
 * Which handles in this message belong to a suspended account.
 *
 * Returns [] without touching the DB when the message carries no handle at all,
 * so ordinary chat adds no latency to the send path. The lookup itself
 * is a primary-key hit on a handful of values and is deliberately NOT cached:
 * a handle blocked by hand during an incident has to bite on the next message,
 * not five minutes later.
 *
 * @returns {Promise<string[]>} matching handles, empty if the message is clean
 */
export async function blockedHandlesIn(supabase, content) {
  const handles = extractHandles(content).map((h) => h.handle);
  if (!handles.length) return [];

  const { data, error } = await supabase
    .from('blocked_contacts')
    .select('handle')
    .in('handle', handles);

  // Fail open — a DB hiccup must not stop people from messaging. The volume
  // signals in lib/spam-signals.js still apply.
  if (error) {
    console.error('[contact-blocklist] lookup failed:', error.message);
    return [];
  }
  return (data || []).map((row) => row.handle);
}

// A handle must appear in at least this many of the account's conversations
// before it is blocked platform-wide.
//
// This guards against the one failure mode that would really hurt: scammers ask
// "or send your link to me", and a handle the scammer merely echoed back to its
// owner would otherwise get that innocent helper's LINE ID blocked everywhere,
// silently. An echo lands in exactly one conversation. A real handoff does not
// — EMP-B4MUCP's two IDs went into 60 and 36 conversations, EMP-3THHAA's into 7.
//
// The cost is a handle from an account we catch after its very first send. That
// is a miss, not a wrong block, and --include-single overrides it when a report
// makes the ownership clear.
const MIN_HANDLE_SPREAD = 2;

/**
 * Put the handles an account has pushed at people onto the blocklist. Called
 * when the account is suspended, so the block follows the person rather than
 * the login.
 *
 * @param {object} supabase   service-role client
 * @param {string} senderRef  EMP-XXXXXX or TH-XXXXXX
 * @param {string} reason     recorded on each row, for later review
 * @param {object} [opts]
 * @param {boolean} [opts.includeSingle]  keep handles seen in one conversation
 * @param {boolean} [opts.dryRun]         work out the list, write nothing
 * @returns {Promise<Array<{handle: string, kind: string, spread: number}>>}
 */
export async function harvestHandles(supabase, senderRef, reason, opts = {}) {
  const { data, error } = await supabase
    .from('messages')
    .select('conversation_id, content_original')
    .eq('sender_ref', senderRef);

  if (error) throw new Error(`message scan failed: ${error.message}`);

  const spread = new Map(); // handle -> Set of conversation ids
  const rows = new Map();
  for (const msg of data || []) {
    for (const { handle, kind } of extractHandles(msg.content_original || '')) {
      if (!spread.has(handle)) spread.set(handle, new Set());
      spread.get(handle).add(msg.conversation_id);
      if (rows.has(handle)) continue;
      rows.set(handle, {
        handle,
        kind,
        source_ref: senderRef,
        source: 'suspension',
        reason: reason || null,
        sample: (msg.content_original || '').slice(0, 300),
      });
    }
  }

  const minSpread = opts.includeSingle ? 1 : MIN_HANDLE_SPREAD;
  for (const [handle, convs] of spread) {
    if (convs.size < minSpread) rows.delete(handle);
  }
  if (!rows.size) return [];

  if (!opts.dryRun) {
    // A handle already blocked from an earlier account keeps its first
    // attribution — the point is that it is blocked, not who we saw it on first.
    const { error: upsertErr } = await supabase
      .from('blocked_contacts')
      .upsert([...rows.values()], { onConflict: 'handle', ignoreDuplicates: true });

    if (upsertErr) throw new Error(`blocklist write failed: ${upsertErr.message}`);
  }
  return [...rows.values()].map(({ handle, kind }) => ({
    handle,
    kind,
    spread: spread.get(handle).size,
  }));
}

/**
 * Drop everything harvested from one account. Used when a suspension is
 * reversed — rows added by hand (source 'manual') are left alone, since they
 * were never tied to this account's suspension in the first place.
 */
export async function releaseHandles(supabase, senderRef) {
  const { data, error } = await supabase
    .from('blocked_contacts')
    .delete()
    .eq('source_ref', senderRef)
    .eq('source', 'suspension')
    .select('handle');

  if (error) throw new Error(`blocklist release failed: ${error.message}`);
  return (data || []).map((row) => row.handle);
}
