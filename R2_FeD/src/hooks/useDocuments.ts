// src/hooks/useDocuments.ts

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Document, Message, DocumentType } from '../components/MainApp';
import initialDocuments from '../components/lib/documents';

// This is the shape of the data we expect from our chat API
type ChatHistoryRecord = {
  docId: string;
  chatHistory: Message[];
};

export function useDocuments(isAuthenticated: boolean) {
  const [documents, setDocuments] = useState<Document[]>([]);
  // We can keep this for the chat fetch
  const [isLoadingDocs, setIsLoadingDocs] = useState(true); 
  const { authToken } = useAuth();

  // --- 2. LOAD DOCS AND MERGE CHATS ---
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingDocs(true);
      
      // --- Step A: Use bundled demo documents as the starting set ---
      // Documents are expected to be persisted on the backend in production.
      // For now we keep them in-memory and use the bundled `initialDocuments`.
      const localDocuments = initialDocuments.map(doc => ({ ...doc, chatHistory: doc.chatHistory || [] }));

      // --- Step B: Fetch documents from backend (if available). Server is source of truth.
      const fetchServerDocs = async () => {
        try {
          const { fetchDocumentsFromServer } = await import('./documentsApi');
          const serverDocs: Document[] = await fetchDocumentsFromServer(authToken || undefined);

          // Ensure chatHistory exists on each doc and then merge any demo docs missing on server
          const normalizedServer = serverDocs.map(d => ({ ...d, chatHistory: (d as any).chatHistory || [] }));

          const merged = [
            ...normalizedServer,
            ...initialDocuments
              .filter(d => !normalizedServer.find(sd => sd.id === d.id))
              .map(doc => ({ ...doc, chatHistory: doc.chatHistory || [] })),
          ];

          setDocuments(merged);
        } catch (error) {
          console.error('Failed to fetch documents from server:', error);
          // Fallback to bundled demo docs if server fetch fails
          setDocuments(localDocuments);
        }
        setIsLoadingDocs(false);
      };

      fetchServerDocs();

    } else {
      setDocuments([]); // Clear docs on logout
    }
  }, [isAuthenticated]);

  // --- 3. UPLOAD IS LOCAL-ONLY ---
  // This function is simple again. No `async`, no API call.
  const handleUploadDocument = (file: File, documentType: DocumentType) => {
    console.log(`Uploading ${file.name} of type ${documentType}`);
    const fileUrl = URL.createObjectURL(file);
    const newDoc: Document = {
      id: Date.now().toString(), // Local-only ID
      name: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'analyzed',
      fileUrl: fileUrl,
      evals: {
        riskScore: Math.floor(Math.random() * 100),
        complexity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        clauses: Math.floor(Math.random() * 30) + 5
      },
      risks: [{ id: `r${Date.now()}`, title: 'Sample Risk', severity: 'medium', description: '...'}],
      clauses: [{ id: `c${Date.now()}`, title: 'Sample Clause', content: '...', type: 'General'}],
      chatHistory: [], // Starts empty
    };

    // Add the local doc immediately for a snappy UX
    setDocuments(prev => [newDoc, ...prev]);

    // --- Background: attempt to upload to server and merge server response ---
    (async () => {
      try {
  const { uploadDocumentToServer } = await import('./documentsApi');
  const serverDoc = await uploadDocumentToServer(file, documentType, authToken || undefined);

        // Merge server values (id, fileUrl, metadata) into the local doc
        setDocuments(prev => prev.map(d => d.id === newDoc.id ? { ...d, ...serverDoc } : d));
        console.log('Document uploaded to server and merged:', serverDoc);
      } catch (err) {
        // Keep local doc if upload fails; console log for now
        console.warn('Background upload failed, keeping local doc:', err);
      }
    })();

    return newDoc; // Return it so App.tsx can select it
  };

  // --- 4. DELETE IS LOCAL-ONLY ---
  // No `async`, no API call.
  const handleDeleteDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc?.fileUrl) {
      URL.revokeObjectURL(doc.fileUrl);
    }
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    console.log("Deleting document locally:", id);
    
    // You *could* add an API call here to delete the chat history
    // fetch(`/api/chats/${id}`, { method: 'DELETE' });
    // But it's not required.
  };

  // --- 5. SEND MESSAGE IS THE *ONLY* MAIN API CALL ---
  const handleSendMessage = async (documentId: string, messageText: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    const doc = documents.find(d => d.id === documentId);
    if (!doc) return;

    const currentChatHistory = doc.chatHistory || [];

    // Optimistic Update 1 (Show user message)
    setDocuments(prevDocs =>
      prevDocs.map(d =>
        d.id === documentId
          ? { ...d, chatHistory: [...currentChatHistory, userMessage] }
          : d
      )
    );

    // --- Simulate AI Reply ---
    await new Promise(res => setTimeout(res, 1000));
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `[Chat reply for ${doc.name}] You said: "${messageText}"`,
      timestamp: new Date().toISOString(),
      sources: ["Source 1", 
        "Source 2"
      ]
    };
    // -----------------------

    const newChatHistory = [...currentChatHistory, userMessage, assistantMessage];

    // Optimistic Update 2 (Show assistant message)
    setDocuments(prevDocs =>
      prevDocs.map(d =>
        d.id === documentId
          ? { ...d, chatHistory: newChatHistory }
          : d
      )
    );

    // --- API CALL: SAVE *JUST* THIS CHAT HISTORY ---
    try {
  // Use the documentsApi helper to save chat history (boilerplate moved there)
  const { saveChatHistory } = await import('./documentsApi');
  await saveChatHistory(documentId, newChatHistory, authToken || undefined);
      console.log(`Chat history saved for doc ${documentId}`);

    } catch (error) {
      console.error("Failed to save chat:", error);
      // Don't rollback on failure to avoid disappearing messages. Keep optimistic UI and
      // optionally show a UI indicator for unsynced messages in a follow-up.
    }
  };

  // (Download is local-only)
  const handleDownloadDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc?.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.name;
      link.click();
    }
  };

  return {
    documents,
    isLoadingDocs,
    handleUploadDocument,
    handleDeleteDocument,
    handleDownloadDocument,
    handleSendMessage
  };
}