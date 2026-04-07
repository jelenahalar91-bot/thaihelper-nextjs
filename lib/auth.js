import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'thaihelper-dev-secret-change-me-in-production');

// Session lifetime: 30 days (users stay logged in for a month)
const SESSION_DAYS = 30;

// Cookie names — helpers and employers get separate cookies so the same
// browser can be logged in as both roles at the same time (useful for testing,
// and for employers who are also helpers).
const HELPER_COOKIE = 'th_session';
const EMPLOYER_COOKIE = 'th_emp_session';

/**
 * Create a signed JWT.
 * @param {object} payload - { ref, email, firstName, role }
 *   role: 'helper' | 'employer'  (defaults to 'helper' for backwards compat)
 */
export async function createToken({ ref, email, firstName, role = 'helper' }) {
  return new SignJWT({ ref, email, firstName, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(SECRET);
}

function parseCookie(req, name) {
  const cookies = req.headers.cookie || '';
  const re = new RegExp(`${name}=([^;]+)`);
  const match = cookies.match(re);
  return match ? match[1] : null;
}

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get the helper session from the request (legacy function name kept for
 * backwards compatibility with all existing helper API routes).
 */
export async function getSession(req) {
  const token = parseCookie(req, HELPER_COOKIE);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  // Only return helper sessions from this function
  if (payload.role && payload.role !== 'helper') return null;
  return payload;
}

/**
 * Get the employer session from the request.
 */
export async function getEmployerSession(req) {
  const token = parseCookie(req, EMPLOYER_COOKIE);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'employer') return null;
  return payload;
}

/**
 * Get whichever session is present (helper or employer). Returns the first
 * match — helper cookie takes precedence if both exist.
 */
export async function getAnySession(req) {
  const helper = await getSession(req);
  if (helper) return { ...helper, role: 'helper' };
  const employer = await getEmployerSession(req);
  if (employer) return { ...employer, role: 'employer' };
  return null;
}

function buildCookie(name, value, maxAge) {
  const isProduction = process.env.NODE_ENV === 'production';
  // SameSite=Lax: cookie is sent on top-level navigation from other sites
  // (e.g. bookmarks, Google search results) — required so users stay logged in
  // when they return to the site via external links.
  return `${name}=${value}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Max-Age=${maxAge}; Path=/`;
}

export function setSessionCookie(res, token, role = 'helper') {
  const name = role === 'employer' ? EMPLOYER_COOKIE : HELPER_COOKIE;
  const maxAge = 60 * 60 * 24 * SESSION_DAYS;
  res.setHeader('Set-Cookie', buildCookie(name, token, maxAge));
}

export function clearSessionCookie(res, role = 'helper') {
  const name = role === 'employer' ? EMPLOYER_COOKIE : HELPER_COOKIE;
  res.setHeader('Set-Cookie', buildCookie(name, '', 0));
}
