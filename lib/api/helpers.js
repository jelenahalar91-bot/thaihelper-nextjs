/**
 * Client-side API functions for helper operations.
 * These will move to packages/shared when we migrate to monorepo.
 */

export async function registerHelper(data) {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Registration failed');
  }

  return response.json();
}

export async function fetchHelpers() {
  const res = await fetch('/api/helpers');
  const data = await res.json();
  return { helpers: data.helpers || [], demo: data.demo || false };
}

export async function fetchProfile() {
  const res = await fetch('/api/profile');

  if (res.status === 401) {
    return { success: false, authError: true };
  }

  const data = await res.json();
  if (data.success) {
    return { success: true, profile: data.profile };
  }

  return { success: false, authError: true };
}

export async function updateProfile(editData) {
  const res = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(editData),
  });

  if (!res.ok) {
    throw new Error('Failed to save changes');
  }

  return res.json();
}
