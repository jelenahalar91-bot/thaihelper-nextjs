// Does this message hand someone a way to continue the conversation off
// ThaiHelper?
//
// Sharing contact details is allowed and always has been — this platform
// exists to connect people directly, and most of these handoffs are two
// people arranging an interview. The warning is not a block and must never
// read like an accusation.
//
// It exists because everything that has actually hurt a helper here happened
// after the conversation left the app. EMP-B4MUCP pushed a LINE ID at 111
// helpers and asked for money there. EMP-572KZV gave one helper his WhatsApp
// number, made requests in a place we cannot see, and posted a review
// accusing her of theft when she refused. In both cases the last thing we
// could observe was the handle going into the chat — so that is where the
// warning belongs.
//
// Detection reuses extractHandles() from the blocklist, which is already the
// spelling authority for phone numbers, emails, LINE, Telegram and wa.me
// links. On top of it sit keyword hints for a platform named without a
// parsable handle ("message me on WhatsApp"), which the blocklist has no
// reason to catch but a reader should still be warned about.
//
// The two callers have opposite error costs, which is why this is a separate
// function rather than a reuse of blockedHandlesIn(): a wrong block stops a
// real conversation, while a wrong warning costs a banner nobody needed. So
// this side may be broader — but not so broad it fires on ordinary chat,
// because a banner on every message is a banner nobody reads.

import { extractHandles } from './contact-blocklist';

// Named platform without a handle we can parse. Each pattern has to be tight
// enough not to fire on ordinary sentences:
//   - "line" is an everyday English word ("drop me a line", "line of work"),
//     so it only counts next to id/@/: or as the Thai ไลน์
//   - "add me", "message me on X" is the phrasing that actually precedes a
//     handoff, so those carry the looser platform names
const PLATFORM_HINTS = [
  { kind: 'whatsapp', re: /\bwhat'?s\s?app\b|\bwa\.me\b|วอทส?แอป|วอทส?แอพ/i },
  { kind: 'line', re: /\bline\s*(?:id|@|:)|\bline\.me\b|\blin\.ee\b|ไลน์/i },
  { kind: 'telegram', re: /\btelegram\b|\bt\.me\b|เทเลแกรม/i },
  { kind: 'wechat', re: /\bwe\s?chat\b|微信/i },
  { kind: 'viber', re: /\bviber\b/i },
  { kind: 'messenger', re: /\b(?:facebook|messenger|instagram)\b|เฟซบุ๊ก|เมสเซนเจอร์/i },
];

// extractHandles kinds map onto the same vocabulary, except 'phone', which
// stands on its own — a bare number is the most common handoff of all.
const HANDLE_KIND_LABELS = {
  phone: 'phone',
  email: 'email',
  line: 'line',
  telegram: 'telegram',
};

/**
 * Which off-platform channels this message points at.
 *
 * Checks the original text rather than the translation: a number survives
 * Google Translate intact, but "WhatsApp" can come back transliterated into
 * Thai script, and the original is the one field always present.
 *
 * @param {string} text
 * @returns {string[]} channel names, empty when the message is ordinary chat
 */
export function contactChannelsIn(text) {
  if (typeof text !== 'string' || !text) return [];

  const kinds = new Set();
  for (const { kind } of extractHandles(text)) {
    const label = HANDLE_KIND_LABELS[kind];
    if (label) kinds.add(label);
  }
  for (const { kind, re } of PLATFORM_HINTS) {
    if (re.test(text)) kinds.add(kind);
  }

  // A LINE link is matched by both the handle extractor and the hint, which
  // is fine — the Set collapses them. A wa.me link arrives as 'phone' from
  // the extractor and 'whatsapp' from the hint; keeping both is accurate.
  return [...kinds];
}

/** True when a message shares a way to keep talking off-platform. */
export function sharesContactDetails(text) {
  return contactChannelsIn(text).length > 0;
}
