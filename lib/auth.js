import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'thaihelper-dev-secret-change-me-in-production');

// Session lifetime: 30 days (users stay logged in for a month)
const SESSION_DAYS = 30;

export async function createToken({ ref, email, firstName }) {
  return new SignJWT({ ref, email, firstName })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(SECRET);
}

export async function getSession(req) {
  try {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/th_session=([^;]+)/);
    if (!match) return null;

    const { payload } = await jwtVerify(match[1], SECRET);
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  // SameSite=Lax: cookie is sent on top-level navigation from other sites
  // (e.g. bookmarks, Google search results) — required so users stay logged in
  // when they return to the site via external links.
  const maxAge = 60 * 60 * 24 * SESSION_DAYS;
  res.setHeader('Set-Cookie', `th_session=${token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Max-Age=${maxAge}; Path=/`);
}

export function clearSessionCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', `th_session=; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Max-Age=0; Path=/`);
}
