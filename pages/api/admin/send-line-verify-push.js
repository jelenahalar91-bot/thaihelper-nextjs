// POST /api/admin/send-line-verify-push?s=ADMIN_PUSH_SECRET
//
// Re-issues a fresh verification token for every unverified account that
// has linked LINE, then pushes the verify link via LINE Messaging API.
// Useful for accounts whose Resend email didn't land but who already
// linked the LINE bot during signup.
//
// Auth: query param `?s=` (or header `x-admin-secret`) must match
// process.env.ADMIN_PUSH_SECRET. Returns 404 on mismatch so the
// endpoint isn't discoverable.
//
// Body params (optional, all in query string for simplicity):
//   ref=TH-XXX     — push to a single helper only
//   emp=EMP-XXX    — push to a single employer only
//   dry=1          — list targets without writing tokens or pushing
//
// Returns: { pushed: [...], skipped: [...], errors: [...] }

import crypto from 'crypto';
import { getServiceSupabase } from '../../../lib/supabase';
import { sendPush } from '../../../lib/line';

export default async function handler(req, res) {
  const expected = process.env.ADMIN_PUSH_SECRET;
  const provided = req.query.s || req.headers['x-admin-secret'];
  if (!expected || provided !== expected) {
    return res.status(404).json({ error: 'not found' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const supabase = getServiceSupabase();
  const dry = req.query.dry === '1';
  const refArg = req.query.ref;
  const empArg = req.query.emp;

  // Build target list
  const targets = []; // { table, refCol, kind, ref, first_name, line_user_id, lang }

  if (refArg) {
    const { data } = await supabase
      .from('helper_profiles')
      .select('helper_ref, first_name, line_user_id, email_verified')
      .eq('helper_ref', refArg)
      .single();
    if (!data) return res.status(404).json({ error: 'helper not found' });
    if (data.email_verified) return res.status(400).json({ error: 'already verified' });
    if (!data.line_user_id) return res.status(400).json({ error: 'no line_user_id linked' });
    targets.push({
      table: 'helper_profiles', refCol: 'helper_ref', kind: 'helper',
      ref: data.helper_ref, first_name: data.first_name,
      line_user_id: data.line_user_id, lang: 'th',
    });
  } else if (empArg) {
    const { data } = await supabase
      .from('employer_accounts')
      .select('employer_ref, first_name, line_user_id, preferred_language, email_verified')
      .eq('employer_ref', empArg)
      .single();
    if (!data) return res.status(404).json({ error: 'employer not found' });
    if (data.email_verified) return res.status(400).json({ error: 'already verified' });
    if (!data.line_user_id) return res.status(400).json({ error: 'no line_user_id linked' });
    targets.push({
      table: 'employer_accounts', refCol: 'employer_ref', kind: 'employer',
      ref: data.employer_ref, first_name: data.first_name,
      line_user_id: data.line_user_id, lang: data.preferred_language || 'en',
    });
  } else {
    // Default: all unverified accounts with linked LINE
    const [helpRes, empRes] = await Promise.all([
      supabase
        .from('helper_profiles')
        .select('helper_ref, first_name, line_user_id')
        .eq('email_verified', false)
        .not('line_user_id', 'is', null),
      supabase
        .from('employer_accounts')
        .select('employer_ref, first_name, line_user_id, preferred_language')
        .eq('email_verified', false)
        .not('line_user_id', 'is', null),
    ]);
    helpRes.data?.forEach(h => targets.push({
      table: 'helper_profiles', refCol: 'helper_ref', kind: 'helper',
      ref: h.helper_ref, first_name: h.first_name,
      line_user_id: h.line_user_id, lang: 'th', // default — helper_profiles has no language col
    }));
    empRes.data?.forEach(e => targets.push({
      table: 'employer_accounts', refCol: 'employer_ref', kind: 'employer',
      ref: e.employer_ref, first_name: e.first_name,
      line_user_id: e.line_user_id, lang: e.preferred_language || 'en',
    }));
  }

  const results = { pushed: [], skipped: [], errors: [] };

  for (const t of targets) {
    const label = `${t.kind}/${t.ref}/${t.first_name}`;

    if (dry) {
      results.skipped.push({ target: label, reason: 'dry-run' });
      continue;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const verifyUrl = `https://thaihelper.app/api/verify-email?token=${token}`;

    // 1) Write fresh token
    const { error: upErr } = await supabase
      .from(t.table)
      .update({ verification_token: token })
      .eq(t.refCol, t.ref);
    if (upErr) {
      results.errors.push({ target: label, error: 'db-update: ' + upErr.message });
      continue;
    }

    // 2) Build localized message
    const name = (t.first_name || '').split(/[\s(]/)[0];
    const audience =
      t.lang === 'th'
        ? (t.kind === 'helper' ? 'ครอบครัว' : 'ผู้ช่วย')
        : (t.kind === 'helper' ? 'families' : 'helpers');

    const text =
      t.lang === 'th'
        ? `สวัสดี ${name} 👋\n\nโปรไฟล์ของคุณจะปรากฏต่อ${audience}เมื่อยืนยันอีเมลแล้วเท่านั้น และจากนั้นคุณจะส่งข้อความได้ด้วย\n\nกรุณาคลิกลิงก์เพื่อยืนยันอีเมลของคุณ:\n${verifyUrl}\n\nขอบคุณค่ะ\nThaiHelper`
        : `Hi ${name} 👋\n\nYour profile will only be shown to ${audience} once your email is verified — and then you'll be able to send messages too.\n\nPlease click the link to verify your email:\n${verifyUrl}\n\nThanks,\nThaiHelper`;

    // 3) Push
    const push = await sendPush(t.line_user_id, { type: 'text', text });
    if (push.ok) {
      results.pushed.push({ target: label, lang: t.lang });
    } else {
      results.errors.push({ target: label, error: push.error });
    }
  }

  return res.status(200).json({
    summary: {
      pushed: results.pushed.length,
      errors: results.errors.length,
      skipped: results.skipped.length,
    },
    ...results,
  });
}
