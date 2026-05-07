// One-shot diagnostic endpoint: reports whether LINE env vars are set,
// without leaking values. Auth-gated by ADMIN_TOKEN_CHECK env var so a
// random visitor can't probe it. Will be removed after the check.
export default function handler(req, res) {
  const expected = process.env.ADMIN_TOKEN_CHECK;
  const provided = req.query.s || req.headers['x-admin-secret'];
  if (!expected || provided !== expected) {
    return res.status(404).json({ error: 'not found' });
  }
  const t = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const s = process.env.LINE_CHANNEL_SECRET;
  res.json({
    accessTokenSet: !!t,
    accessTokenLength: t?.length || 0,
    channelSecretSet: !!s,
    channelSecretLength: s?.length || 0,
  });
}
