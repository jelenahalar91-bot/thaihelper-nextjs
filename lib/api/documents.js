/**
 * Client-side API functions for document operations.
 */

export async function fetchDocuments() {
  const res = await fetch('/api/documents');
  if (res.status === 401) return { documents: [], authError: true };
  const data = await res.json();
  return { documents: data.documents || [] };
}

export async function uploadDocument(file, fileType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);

  const res = await fetch('/api/documents', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Upload failed');
  }

  return res.json();
}

export async function deleteDocument(id) {
  const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Delete failed');
  }

  return res.json();
}
