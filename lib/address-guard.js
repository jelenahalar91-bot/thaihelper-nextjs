// Detects when a free-text "area" field contains a full street address
// (house number + moo/soi/road) instead of a general neighbourhood name.
// `area` is rendered publicly and unauthenticated on /helpers and
// /employers-browse cards — a full address there leaks a family's or
// helper's home location to anyone browsing, before they've signed in or
// exchanged a single message. Full addresses belong in private messages
// after two sides connect, not in this public field.
const FULL_ADDRESS_PATTERNS = [
  /^\d+[\d/]*\s*(ม\.|หมู่)\s*\d+/,      // "12/1 ม.16" — house no + moo
  /หมู่\s*\d+/,                          // "หมู่ 16"
  /เลขที่\s*\d+/,                        // "(บ้าน)เลขที่ 103" — explicit house number
  /^\d+\/\d+/,                          // "12/1", "108/8" — house-number format
  /^\d{2,4}\s+(ถ\.|ซอย|ซ\.|moo|soi)/i,  // "281 ถ.แสงชูโต", "44/43 ซอย3 ..."
  /\b\d{5}\b/,                          // Thai postal code
];

export function looksLikeFullAddress(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return FULL_ADDRESS_PATTERNS.some(p => p.test(trimmed));
}
