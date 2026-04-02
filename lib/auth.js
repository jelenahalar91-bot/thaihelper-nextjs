import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'thaihelper-dev-secret-change-me-in-production');

export async function createToken({ ref, email, firstName }) {
  return new SignJWT({ ref, email, firstName })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
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
  res.setHeader('Set-Cookie', `th_session=${token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}; Path=/`);
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'th_session=; HttpOnly; Max-Age=0; Path=/');
}
