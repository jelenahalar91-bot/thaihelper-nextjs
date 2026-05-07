// Detects contact info that would let users continue the conversation off-platform.
// We block these in messages so all communication stays on thaihelper.app.
//
// Caught patterns:
//   - URLs (https://, http://, www.) and bare domains (line.me, wa.me, t.me, etc.)
//   - Email addresses
//   - Phone numbers — any sequence with 7+ digits (Thai mobiles are 10, intl
//     can be 12+). Tolerates spaces, dashes, dots, parens, and a leading +.
//
// We accept a few false positives (e.g. dates like 2026-05-07) over false
// negatives — keeping users on-platform is the higher-priority goal.

const URL_RE = /(?:https?:\/\/|www\.)\S+/gi;
const BARE_DOMAIN_RE = /\b[a-z0-9-]+\.(?:com|net|org|app|me|co|io|info|biz|us|uk|de|th|fr|es|jp|cn|sg|my|ph|au|ca|nz|nl|se|no|dk|fi|ch|at|be|cz|pl|ru|kr|in|id|vn|tw|hk)(?:\/\S*)?\b/gi;
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gi;
const PHONE_RE = /(?:\+?\d[\d\s\-\.\(\)]{5,}\d)/g;

export function findContactInfo(text) {
  if (typeof text !== 'string' || !text) return [];
  const hits = [];
  for (const re of [URL_RE, BARE_DOMAIN_RE, EMAIL_RE, PHONE_RE]) {
    const matches = text.match(re);
    if (matches) hits.push(...matches);
  }
  return hits;
}

export function hasContactInfo(text) {
  return findContactInfo(text).length > 0;
}
