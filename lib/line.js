/**
 * LINE Messaging API wrapper.
 *
 * Used to:
 *   - push notifications to a user (sendPush)
 *   - reply to incoming webhook events (sendReply)
 *   - verify webhook signatures so attackers can't spoof events
 *
 * Env vars (set in Vercel):
 *   LINE_CHANNEL_ACCESS_TOKEN  — long-lived token from Messaging API tab
 *   LINE_CHANNEL_SECRET        — Channel secret from Basic settings
 *   LINE_OA_BASIC_ID           — public bot id like "@thaihelper" (used to
 *                                 build add-friend QR URLs)
 *
 * If the access token is missing we log + no-op rather than throwing —
 * keeps the app running in dev without a configured LINE account.
 */

import crypto from 'crypto';

const PUSH_URL  = 'https://api.line.me/v2/bot/message/push';
const REPLY_URL = 'https://api.line.me/v2/bot/message/reply';

function getToken() {
  const t = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!t) console.warn('[line] LINE_CHANNEL_ACCESS_TOKEN missing — push/reply will no-op');
  return t || null;
}

/**
 * Send a push notification to a single LINE userId.
 * Returns { ok: boolean, error?: string }.
 */
export async function sendPush(lineUserId, messages) {
  const token = getToken();
  if (!token) return { ok: false, error: 'LINE not configured' };
  if (!lineUserId) return { ok: false, error: 'missing lineUserId' };

  const msgs = Array.isArray(messages) ? messages : [messages];

  try {
    const r = await fetch(PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: lineUserId, messages: msgs }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      console.error('[line] push failed:', r.status, body);
      return { ok: false, error: `push ${r.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    console.error('[line] push threw:', e);
    return { ok: false, error: e.message };
  }
}

/**
 * Reply to a webhook event using its replyToken (free of message quota).
 * replyToken expires ~1 minute after the event so call this synchronously.
 */
export async function sendReply(replyToken, messages) {
  const token = getToken();
  if (!token) return { ok: false, error: 'LINE not configured' };
  if (!replyToken) return { ok: false, error: 'missing replyToken' };

  const msgs = Array.isArray(messages) ? messages : [messages];

  try {
    const r = await fetch(REPLY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ replyToken, messages: msgs }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => '');
      console.error('[line] reply failed:', r.status, body);
      return { ok: false, error: `reply ${r.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    console.error('[line] reply threw:', e);
    return { ok: false, error: e.message };
  }
}

/**
 * Verify the X-Line-Signature header on a webhook request.
 * LINE signs the raw request body with HMAC-SHA256 using channel secret.
 * Caller must pass the EXACT raw body bytes (a string is fine if utf-8).
 */
export function verifySignature(rawBody, signature) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) {
    console.warn('[line] LINE_CHANNEL_SECRET missing — webhook signature check disabled');
    return false;
  }
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  // Constant-time compare to prevent timing attacks.
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

/**
 * Build the "Add @thaihelper as friend" deep link / QR target.
 * Use this URL as the data inside a QR code, or as an `https:` link the
 * user can tap on mobile.
 */
export function getAddFriendUrl() {
  const id = process.env.LINE_OA_BASIC_ID || '';
  // basic-id format like "@thaihelper" — strip leading @ for the URL slug
  const slug = id.replace(/^@/, '');
  if (!slug) return '';
  return `https://line.me/R/ti/p/@${slug}`;
}

/**
 * Build a short link/text payload that helpers will be told to send to
 * the bot after adding it as a friend. The webhook parses this and
 * connects the LINE userId to the helper/employer record.
 */
export function buildLinkMessage(token) {
  return `link ${token}`;
}

/**
 * Parse an incoming text message; returns the link token if the message
 * matches the format "link XXXXXXXX", else null.
 */
export function parseLinkMessage(text) {
  if (typeof text !== 'string') return null;
  const m = text.trim().match(/^link\s+([A-Za-z0-9]{6,16})$/i);
  return m ? m[1].toLowerCase() : null;
}

/**
 * Generate a short, easy-to-type link token. 8 hex chars = 4 bytes of
 * entropy — fine for a 30-minute window since the bot only accepts it
 * paired with a freshly-added LINE userId.
 */
export function generateLinkToken() {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Format common message templates so callers can send a notification
 * with one line of code.
 */
export const templates = {
  newMessage: ({ senderName, snippet, lang = 'en' }) => {
    const copy = {
      en: {
        title: '💬 New message on ThaiHelper',
        body: `${senderName} just wrote you:\n"${(snippet || '').slice(0, 140)}"\n\nReply: https://thaihelper.app/profile`,
      },
      th: {
        title: '💬 ข้อความใหม่บน ThaiHelper',
        body: `${senderName} เพิ่งส่งข้อความถึงคุณ:\n"${(snippet || '').slice(0, 140)}"\n\nตอบกลับ: https://thaihelper.app/profile`,
      },
    };
    const c = copy[lang] || copy.en;
    return [{ type: 'text', text: `${c.title}\n\n${c.body}` }];
  },

  linkSuccess: ({ lang = 'en' }) => {
    const copy = {
      en: '✓ Connected! You will now receive instant LINE notifications when families message you on ThaiHelper.',
      th: '✓ เชื่อมต่อแล้ว! คุณจะได้รับการแจ้งเตือน LINE ทันทีเมื่อมีครอบครัวส่งข้อความบน ThaiHelper',
    };
    return [{ type: 'text', text: copy[lang] || copy.en }];
  },

  linkInvalidToken: ({ lang = 'en' }) => {
    const copy = {
      en: 'That link code is not valid or has expired. Open your ThaiHelper profile and request a new one.',
      th: 'รหัสลิงก์นี้ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาเปิดโปรไฟล์ ThaiHelper และขอรหัสใหม่',
    };
    return [{ type: 'text', text: copy[lang] || copy.en }];
  },

  followGreeting: ({ lang = 'en' }) => {
    const copy = {
      en: 'Welcome to ThaiHelper notifications! 🔔\n\nTo finish connecting, open your ThaiHelper profile and copy the "link XXXX" code shown there, then paste it here.',
      th: 'ยินดีต้อนรับสู่การแจ้งเตือน ThaiHelper! 🔔\n\nเปิดโปรไฟล์ ThaiHelper ของคุณ คัดลอกรหัส "link XXXX" และส่งมาที่นี่เพื่อเชื่อมต่อ',
    };
    return [{ type: 'text', text: copy[lang] || copy.en }];
  },
};
