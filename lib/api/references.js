/**
 * Client-side API functions for reference operations.
 */

export async function fetchReferences() {
  const res = await fetch('/api/references');
  if (res.status === 401) return { references: [], authError: true };
  const data = await res.json();
  return { references: data.references || [] };
}

export async function addReference(data) {
  const res = await fetch('/api/references', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add reference');
  }

  return res.json();
}

export async function updateReference(id, data) {
  const res = await fetch('/api/references', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update reference');
  }

  return res.json();
}

export async function deleteReference(id) {
  const res = await fetch(`/api/references?id=${id}`, { method: 'DELETE' });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete reference');
  }

  return res.json();
}
