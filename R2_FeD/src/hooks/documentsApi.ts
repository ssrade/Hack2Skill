// documentsApi.ts — API helper only (removed React bootstrap and App import).

import axiosClient from '../api/axiosClient';

/**
 * Lightweight frontend API helper for document uploads.
 *
 * Uses the backend /docUpload/upload endpoint that accepts
 * multipart/form-data with the file under the `file` key and
 * metadata such as `title` and `description`.
 */
export async function uploadDocumentToServer(file: File, documentType: string, token?: string) {
  const form = new FormData();
  form.append('file', file);
  form.append('title', documentType); // Backend expects 'title' field
  form.append('description', documentType);

  try {
    const response = await axiosClient.post('/docUpload/upload', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || 'Upload failed';
    throw new Error(`Upload failed: ${errorMsg}`);
  }
}

export default uploadDocumentToServer;

/**
 * Save chat history for a document to the backend.
 * Expects the backend endpoint to accept JSON { chatHistory: Message[] }
 */
export async function saveChatHistory(documentId: string, chatHistory: any, token?: string) {
  try {
    const response = await axiosClient.post(`/chat/${documentId}`, {
      chatHistory,
    });

    return response.data;
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || 'Save chat failed';
    throw new Error(`Save chat failed: ${errorMsg}`);
  }
}

/**
 * Fetch documents (and their metadata/chatHistory) from the backend.
 * Uses the GET /docUpload endpoint that returns an array of document objects.
 */
export async function fetchDocumentsFromServer(token?: string) {
  try {
    const response = await axiosClient.get('/docUpload');
    
    // Backend returns array of agreements
    // Map to frontend Document format
    if (response.data && Array.isArray(response.data)) {
      return response.data.map((doc: any) => ({
        id: doc.id,
        name: doc.title || doc.name || 'Untitled',
        description: doc.description || '',
        uploadDate: doc.createdAt || doc.uploadDate || new Date().toISOString(),
        status: 'analyzed',
        fileUrl: doc.fileUrl || '',
        chatHistory: doc.chatHistory || [],
      }));
    }
    
    return [];
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || 'Fetch documents failed';
    throw new Error(`Fetch documents failed: ${errorMsg}`);
  }
}

