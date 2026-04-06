/**
 * Client-side auth API functions.
 * Not to be confused with lib/auth.js (server-side JWT handling).
 * These will move to packages/shared when we migrate to monorepo.
 */

export async function login({ email, ref }) {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      ref: ref.trim(),
    }),
  });

  if (response.status === 429) {
    return { success: false, error: 'rate_limit' };
  }

  if (response.status === 401) {
    return { success: false, error: 'invalid' };
  }

  if (!response.ok) {
    return { success: false, error: 'generic' };
  }

  const data = await response.json();
  return { success: true, firstName: data.firstName };
}

export async function logout() {
  await fetch('/api/auth', { method: 'DELETE' });
}
