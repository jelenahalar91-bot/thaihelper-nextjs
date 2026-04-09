/**
 * Client-side API functions for employer operations.
 * These will move to packages/shared when we migrate to monorepo.
 */

export async function fetchEmployers() {
  const res = await fetch('/api/employers');
  if (!res.ok) {
    console.error('Failed to load employers');
    return { employers: [] };
  }
  return res.json();
}

export async function registerEmployer({ firstName, lastName, email, city, area, helperTypes, jobDescription }) {
  const response = await fetch('/api/employer-register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      city,
      area: area.trim(),
      helperTypes,
      jobDescription,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Registration failed');
  }

  return response.json();
}
