/**
 * Lightweight frontend API helper for document uploads.
 *
 * This is boilerplate for a POST /api/documents endpoint that accepts
 * multipart/form-data with the file under the `file` key and optional
 * metadata such as `type`.
 *
 * The function returns the parsed JSON response from the server and will
 * throw if the request fails. Adjust fields to match your backend contract.
 */
export async function uploadDocumentToServer(file: File, documentType: string, token?: string) {
  const form = new FormData();
  form.append('file', file);
  form.append('type', documentType);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/documents', {
    method: 'POST',
    body: form,
    headers: headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed: ${res.status} ${res.statusText} ${text}`);
  }

  // Expect server to return the saved document object (id, name, fileUrl, metadata...)
  return res.json();
}

export default uploadDocumentToServer;

/**
 * Save chat history for a document to the backend.
 * Expects the backend endpoint to accept JSON { chatHistory: Message[] }
 */
export async function saveChatHistory(documentId: string, chatHistory: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/chats/${documentId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ chatHistory }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Save chat failed: ${res.status} ${res.statusText} ${text}`);
  }

  return res.json();
}

/**
 * Fetch documents (and their metadata/chatHistory) from the backend.
 * Expects an endpoint GET /api/documents that returns an array of document objects.
 */
export async function fetchDocumentsFromServer(token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/documents', { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fetch documents failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}


