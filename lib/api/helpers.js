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

/**
 * Upload a profile photo for the currently signed-in helper.
 * Returns { url } on success. Caller must persist the URL via updateProfile().
 * Requires an active helper session cookie (set automatically after register).
 */
export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);

  const res = await fetch('/api/photo', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Photo upload failed');
  }

  return res.json();
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
