// POST /api/line/webhook — receives events from LINE Messaging API
//
// LINE sends signed JSON payloads when:
//   - a user adds our bot as a friend (event.type === 'follow')
//   - a user sends a message (event.type === 'message')
//   - a user removes us (event.type === 'unfollow')
//
// We use it to connect a LINE userId to a ThaiHelper account: after the
// user adds the bot as a friend they're told to send "link XXXX" — the
// XXXX is the token we generated for them at registration / from /profile.
// On match we save line_user_id so the reminder cron can push to them.
//
// IMPORTANT: signature verification needs the RAW request body (not the
// parsed JSON), so we disable Next's bodyParser and read it manually.

import { getServiceSupabase } from '../../../lib/supabase';
import {
  verifySignature,
  sendReply,
  parseLinkMessage,
  templates,
} from '../../../lib/line';

export const config = {
  api: { bodyParser: false },
};

// Stream the raw request body into a UTF-8 string so we can both verify
// the signature and JSON.parse it ourselves.
async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let raw;
  try {
    raw = await readRawBody(req);
  } catch (e) {
    console.error('[line/webhook] raw body read failed:', e);
    return res.status(400).json({ error: 'bad body' });
  }

  // Verify signature — protects against attackers spoofing events to
  // hijack accounts via the "link XXXX" handshake.
  const sig = req.headers['x-line-signature'];
  if (!verifySignature(raw, sig)) {
    console.warn('[line/webhook] signature check failed');
    return res.status(401).json({ error: 'bad signature' });
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    return res.status(400).json({ error: 'bad json' });
  }

  const events = Array.isArray(payload?.events) ? payload.events : [];
  // LINE expects a fast 200 — process events in parallel and return.
  await Promise.all(events.map((ev) => handleEvent(ev).catch((err) => {
    console.error('[line/webhook] handler error:', err, ev);
  })));

  return res.status(200).json({ ok: true });
}

// ─── Event dispatch ─────────────────────────────────────────────────────────
async function handleEvent(event) {
  const type = event?.type;
  if (type === 'follow')   return onFollow(event);
  if (type === 'message')  return onMessage(event);
  if (type === 'unfollow') return onUnfollow(event);
  // ignore other event types (postback, beacon, etc.) for now
}

// User just added the bot as a friend → guide them to send the link code.
async function onFollow(event) {
  const replyToken = event.replyToken;
  if (!replyToken) return;
  await sendReply(replyToken, templates.followGreeting({ lang: 'both' }));
}

// User sent a text message — only meaningful one for us is "link XXXX".
async function onMessage(event) {
  const text = event?.message?.type === 'text' ? event.message.text : '';
  const replyToken = event.replyToken;
  const lineUserId = event?.source?.userId;
  if (!lineUserId) return;

  const token = parseLinkMessage(text);
  if (!token) {
    // Unrelated message — silently ignore. We don't run a chatbot here.
    return;
  }

  // Look the token up in both helpers and employers. Match is unique because
  // both columns are populated only when active and we never reuse a token.
  const supabase = getServiceSupabase();
  const now = new Date().toISOString();

  const linked = await tryLink(supabase, 'helper_profiles',    'helper_ref',   token, lineUserId, now)
              || await tryLink(supabase, 'employer_accounts',  'employer_ref', token, lineUserId, now);

  if (replyToken) {
    await sendReply(
      replyToken,
      linked
        ? templates.linkSuccess({ lang: 'both' })
        : templates.linkInvalidToken({ lang: 'both' })
    );
  }
}

// Try to claim a token in one of the user tables. Returns true on success.
async function tryLink(supabase, table, refCol, token, lineUserId, now) {
  // Match by token, must not be expired, and account must not already be
  // linked to a different LINE id (one user → one device for now).
  const { data, error } = await supabase
    .from(table)
    .select(`${refCol}, line_link_expires`)
    .eq('line_link_token', token)
    .maybeSingle();

  if (error || !data) return false;
  if (data.line_link_expires && new Date(data.line_link_expires) < new Date()) {
    return false;
  }

  const { error: updErr } = await supabase
    .from(table)
    .update({
      line_user_id: lineUserId,
      line_linked_at: now,
      // burn the token so it can't be reused
      line_link_token: null,
      line_link_expires: null,
    })
    .eq(refCol, data[refCol]);

  if (updErr) {
    console.error(`[line/webhook] update failed on ${table}:`, updErr);
    return false;
  }
  return true;
}

// User removed our bot as a friend — clear their LINE userId so we don't
// try to push to a now-broken endpoint.
async function onUnfollow(event) {
  const lineUserId = event?.source?.userId;
  if (!lineUserId) return;
  const supabase = getServiceSupabase();

  await Promise.all([
    supabase.from('helper_profiles')
      .update({ line_user_id: null, line_linked_at: null, notify_via_line: false })
      .eq('line_user_id', lineUserId),
    supabase.from('employer_accounts')
      .update({ line_user_id: null, line_linked_at: null, notify_via_line: false })
      .eq('line_user_id', lineUserId),
  ]);
}
