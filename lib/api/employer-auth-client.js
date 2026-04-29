/**
 * Client-side employer auth API functions.
 * Mirrors lib/api/auth-client.js (helper auth) but for employer accounts.
 * These will move to packages/shared when we migrate to monorepo.
 */

import { getAttribution } from '@/lib/utm';

export async function employerSignup(data) {
  const response = await fetch('/api/employer-signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, attribution: getAttribution() }),
  });

  if (response.status === 409) {
    const body = await response.json().catch(() => ({}));
    if (body.error === 'duplicate_email') {
      return { success: false, error: 'duplicate_email' };
    }
    return { success: false, error: 'generic' };
  }

  if (response.status === 400) {
    return { success: false, error: 'invalid_input' };
  }

  if (!response.ok) {
    return { success: false, error: 'generic' };
  }

  const body = await response.json();
  return { success: true, ref: body.ref, firstName: body.firstName };
}

export async function employerLogin({ email, ref }) {
  const response = await fetch('/api/employer-auth', {
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

export async function employerLogout() {
  await fetch('/api/employer-auth', { method: 'DELETE' });
}

export async function fetchEmployerProfile() {
  const response = await fetch('/api/employer-profile');
  if (!response.ok) return null;
  return response.json();
}

export async function updateEmployerProfile(patch) {
  const response = await fetch('/api/employer-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) return { success: false };
  return response.json();
}

/**
 * Upload an employer profile photo.
 * Accepts a File object from an <input type="file"> element.
 * Returns { success: true, url } or { success: false, error }.
 */
export async function uploadEmployerPhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);

  const response = await fetch('/api/employer-photo', {
    method: 'POST',
    body: formData,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { success: false, error: body.error || 'Upload failed' };
  }

  return { success: true, url: body.url };
}
