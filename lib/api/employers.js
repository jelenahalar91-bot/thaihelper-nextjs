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
