/**
 * Client-side API functions for user settings.
 */

export async function fetchSettings() {
  const res = await fetch('/api/settings');
  if (res.status === 401) return { preferred_language: 'en' };
  return res.json();
}

export async function updateLanguagePreference(preferred_language) {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preferred_language }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update settings');
  }

  return res.json();
}
