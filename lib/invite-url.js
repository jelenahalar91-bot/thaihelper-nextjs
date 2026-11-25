// The "invite a friend" link, built from a helper's invite code.
//
// Separate from ./invite-code.js on purpose: that module derives the code with
// node:crypto and is server-only, while this one is imported by
// components/InviteFriendCard.jsx and so ends up in the client bundle. Keeping
// the URL here means the card does not drag crypto in behind it.
//
// Extension on the import path, like ./constants/categories.js: admin scripts
// require this under plain Node, where an extensionless ESM import does not
// resolve. Next resolves both.
export function inviteUrl(inviteCode, lang) {
  const base = `https://www.thaihelper.app${lang === 'th' ? '/th' : ''}/register`;
  const params = new URLSearchParams({ utm_source: 'invite' });
  if (inviteCode) params.set('utm_campaign', inviteCode);
  return `${base}?${params.toString()}`;
}
