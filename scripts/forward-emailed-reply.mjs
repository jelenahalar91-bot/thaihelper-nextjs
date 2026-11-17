#!/usr/bin/env node
/**
 * Put a reply that somebody sent by EMAIL into the chat where it belongs.
 *
 * The new-message notification goes out from support@thaihelper.app, so
 * hitting "Reply" in Gmail lands in the support inbox and nowhere near the
 * other person. Helpers do this: they answer a family's questions by email
 * and then wait for an answer that cannot come, while the family sees
 * silence. The notification mail now says not to do it (both languages,
 * next to the button), but that does not help the ones already waiting.
 *
 * This writes the text into the conversation as the sender's own message —
 * verbatim, with one bracketed line saying support forwarded it, so the
 * recipient is not misled about how it arrived — and then sends the normal
 * new-message notification, because a direct DB insert triggers nothing.
 *
 * SAFETY: dry-run is the DEFAULT. Nothing is written or sent without --live.
 *
 * Usage:
 *   node scripts/forward-emailed-reply.mjs --case=pichayapa
 *   node scripts/forward-emailed-reply.mjs --case=pichayapa --live
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  });
}

// The email module builds its Resend client at import time, so the env file
// has to be in place first — hence the dynamic import down here.
const { sendNewMessageNotification } = await import('../lib/send-confirmation-email.js');

const args = process.argv.slice(2);
const live = args.includes('--live');
const which = (args.find((a) => a.startsWith('--case='))?.slice(7) || '').trim();

// Each case is one person's email reply, transcribed verbatim from the
// support inbox. The note is what the recipient sees about its provenance.
const NOTE_TH = '[ข้อความนี้ส่งต่อโดยทีมงาน ThaiHelper — คุณตอบกลับทางอีเมลแจ้งเตือนเมื่อวันที่ 12 พ.ย. ข้อความจึงไม่ได้เข้ามาในแชทนี้]';
const NOTE_EN = '[Forwarded by ThaiHelper support — Pichayapa replied to the notification email on 12 Nov, so her answer never reached this chat. You can reply to her here as usual.]';

const CASES = {
  pichayapa: {
    conversationId: 'eb433597-81e0-4b5e-9aeb-d11d98d8359e',
    senderType: 'helper',
    senderRef: 'TH-ERXBJU',
    senderName: 'Pichayapa',
    recipientRef: 'EMP-1E0L7I',
    recipientTable: 'employer_accounts',
    recipientKey: 'employer_ref',
    recipientRole: 'employer',
    sourceLanguage: 'th',
    targetLanguage: 'en',
    original: [
      NOTE_TH,
      '',
      'สวัสดีค่ะ ต้องการให้ทำอาหารประเภทไหนบ้างคะ ฉันถนัดทำอาหารญี่ปุ่น, อาหารไทย, พื้นฐานอาหารยุโรป และของหวานไทยนิดหน่อยค่ะ',
      '_ฉันอยากทราบสถานที่ทำงานอยู่ที่ไหน',
      '_ระยะเวลาทำงานมีที่พักให้ไหม',
      '_ลูกค้า 4 ท่านเป็นคนไทยหรือต่างชาติ มีเด็กด้วยไหม',
      '_ต้องการทำอาหารประเภทไหนสำหรับ 4 ท่าน',
      '_จ่ายค่าแรงวันละเท่าไหร่',
      '_มีทีมงานผู้ช่วยอีกไหม',
      'รบกวนขอรายละเอียดเพิ่มเติมค่ะ',
      'ขอบคุณค่ะ',
    ].join('\n'),
    translated: [
      NOTE_EN,
      '',
      'Hello. What kinds of dishes would you like me to cook? I am good at Japanese food, Thai food, basic European food, and some Thai desserts.',
      '- Where is the place of work?',
      '- Is accommodation provided for the working period?',
      '- Are the 4 guests Thai or foreigners? Are there children as well?',
      '- What kind of food would you like for the 4 people?',
      '- What is the daily wage?',
      '- Is there a team of assistants as well?',
      'May I ask for a few more details, please?',
      'Thank you.',
    ].join('\n'),
  },
};

const c = CASES[which];
if (!c) {
  console.error(`Unknown --case. Known: ${Object.keys(CASES).join(', ')}`);
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// Refuse to run twice: the forwarded note is unmistakable in the text.
const { data: existing } = await supabase
  .from('messages')
  .select('id, created_at')
  .eq('conversation_id', c.conversationId)
  .eq('sender_ref', c.senderRef)
  .limit(50);
const { data: dupe } = await supabase
  .from('messages')
  .select('id, created_at, content_original')
  .eq('conversation_id', c.conversationId)
  .ilike('content_original', '%ส่งต่อโดยทีมงาน ThaiHelper%')
  .limit(1);
if (dupe && dupe.length) {
  console.error(`Already forwarded on ${dupe[0].created_at} (message ${dupe[0].id}). Nothing to do.`);
  process.exit(1);
}

const { data: recipient } = await supabase
  .from(c.recipientTable)
  .select('first_name, email, notify_on_message')
  .eq(c.recipientKey, c.recipientRef)
  .single();

console.log(`Conversation : ${c.conversationId}`);
console.log(`From         : ${c.senderName} (${c.senderRef}, ${c.senderType})`);
console.log(`To           : ${recipient?.first_name} <${recipient?.email}> (${c.recipientRef})`);
console.log(`Notify       : ${recipient?.notify_on_message === false ? 'OPTED OUT — no email' : 'yes'}`);
console.log(`Prior msgs   : ${(existing || []).length} from this sender in the thread`);
console.log('\n--- content_translated (what the family sees) ---');
console.log(c.translated);
console.log('\n--- content_original (Thai, behind "show original") ---');
console.log(c.original);

if (!live) {
  console.log('\nDRY RUN — nothing written, nothing sent. Re-run with --live.');
  process.exit(0);
}

const { data: inserted, error: insErr } = await supabase
  .from('messages')
  .insert({
    conversation_id: c.conversationId,
    sender_type: c.senderType,
    sender_ref: c.senderRef,
    content_original: c.original,
    content_translated: c.translated,
    source_language: c.sourceLanguage,
    target_language: c.targetLanguage,
    is_read: false,
  })
  .select('id, created_at')
  .single();
if (insErr) {
  console.error('Insert failed:', insErr.message);
  process.exit(1);
}
console.log(`\nInserted message ${inserted.id} at ${inserted.created_at}`);

await supabase
  .from('conversations')
  .update({ last_message_at: inserted.created_at })
  .eq('id', c.conversationId);

if (recipient?.email && recipient.notify_on_message !== false) {
  await sendNewMessageNotification({
    recipientName: recipient.first_name,
    recipientEmail: recipient.email,
    senderName: c.senderName,
    senderRole: c.senderType,
    recipientRole: c.recipientRole,
    senderRef: c.senderRef,
    messagePreview: c.translated,
  });
  console.log(`Notification sent to ${recipient.email}`);
} else {
  console.log('No notification sent (no email or opted out).');
}
