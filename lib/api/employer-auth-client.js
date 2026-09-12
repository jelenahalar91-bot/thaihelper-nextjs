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
    const body = await response.json().catch(() => ({}));
    // Pass these through verbatim — the form shows a specific message for
    // each (and, for a missing job description, which categories are short).
    if (['area_full_address', 'looking_for_required', 'job_description_required'].includes(body.error)) {
      return { success: false, error: body.error, missing: body.missing || [] };
    }
    return { success: false, error: 'invalid_input' };
  }

  // Turnstile / CAPTCHA rejection (403) — surface it distinctly so the UI can
  // tell the user to redo the check rather than a vague "something went wrong".
  if (response.status === 403) {
    const body = await response.json().catch(() => ({}));
    if (/captcha/i.test(body.error || '')) {
      return { success: false, error: 'captcha' };
    }
    return { success: false, error: 'generic' };
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

  if (response.status === 403) {
    const body = await response.json().catch(() => ({}));
    return {
      success: false,
      error: body.error === 'email_not_verified' ? 'email_not_verified' : 'generic',
    };
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
  if (!response.ok) {
    // Keep the server's reason (e.g. job_description_required + which
    // categories are missing) so the editor can point at the right boxes
    // instead of showing a bare "Save failed".
    const body = await response.json().catch(() => ({}));
    return { success: false, error: body.error || 'save_failed', missing: body.missing || [] };
  }
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
