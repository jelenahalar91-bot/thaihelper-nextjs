/**
 * Client-side API functions for user settings.
 */

export async function fetchSettings() {
  const res = await fetch('/api/settings');
  if (res.status === 401) return { preferred_language: 'en' };
  return res.json();
}

// updateLanguagePreference removed — translation deferred to later phase
