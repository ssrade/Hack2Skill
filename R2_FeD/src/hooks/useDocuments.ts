// src/hooks/useDocuments.ts

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Document, Message, DocumentType } from '../components/MainApp';
import { getAllDocuments } from '../api/agreementApi';
import { uploadDocument } from '../api/uploadDocument';
import { deleteDocument } from '../api/deleteDocumentApi';
import { sendRAGQuery } from '../api/ragQueryApi';

export function useDocuments(isAuthenticated: boolean) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true); 
  const { user } = useAuth();

  // Load documents from backend
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsLoadingDocs(true);
      
      const fetchServerDocs = async () => {
        try {
          const serverDocs = await getAllDocuments();
          setDocuments(serverDocs);
        } catch (error) {
          console.error('Failed to fetch documents from server:', error);
          setDocuments([]);
        } finally {
          setIsLoadingDocs(false);
        }
      };

      fetchServerDocs();
    } else {
      setDocuments([]);
      setIsLoadingDocs(false);
    }
  }, [isAuthenticated, user]);

  // Upload document to backend
  const handleUploadDocument = async (file: File, documentType: DocumentType) => {
    if (!user?.id) {
      console.error('No user ID available');
      return null;
    }

    console.log(`Uploading ${file.name} of type ${documentType}`);
    
    // Create temporary local doc for immediate UI feedback
    const tempFileUrl = URL.createObjectURL(file);
    const tempDoc: Document = {
      id: `temp-${Date.now()}`,
      name: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'uploading' as any,
      fileUrl: tempFileUrl,
      evals: {
        riskScore: 0,
        complexity: 'Low',
        clauses: 0
      },
      risks: [],
      clauses: [],
      chatHistory: [],
    };

    setDocuments(prev => [tempDoc, ...prev]);

    try {
      const userId = String(user.id); // Convert to string
      const uploadedDoc = await uploadDocument(file, userId);
      
      // Replace temp doc with real one from server
      setDocuments(prev => prev.map(d => 
        d.id === tempDoc.id 
          ? {
              id: uploadedDoc.id,
              name: uploadedDoc.title || file.name,
              uploadDate: uploadedDoc.createdAt || new Date().toISOString().split('T')[0],
              status: 'analyzed',
              fileUrl: uploadedDoc.fileUrl || '',
              evals: {
                riskScore: 0,
                complexity: 'Low',
                clauses: 0
              },
              risks: [],
              clauses: [],
              chatHistory: [],
            }
          : d
      ));

      // Cleanup temp blob URL
      URL.revokeObjectURL(tempFileUrl);
      
      console.log('✅ Document uploaded successfully:', uploadedDoc);
      return uploadedDoc;
    } catch (err) {
      console.error('❌ Upload failed:', err);
      // Remove temp doc on failure
      setDocuments(prev => prev.filter(d => d.id !== tempDoc.id));
      URL.revokeObjectURL(tempFileUrl);
      throw err;
    }
  };

  // Delete document from backend
  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocument(id);
      
      // Remove from local state
      const doc = documents.find(d => d.id === id);
      if (doc?.fileUrl) {
        URL.revokeObjectURL(doc.fileUrl);
      }
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      
      console.log("✅ Document deleted:", id);
    } catch (error) {
      console.error("❌ Failed to delete document:", error);
      throw error;
    }
  };

  // Send message using RAG API
  const handleSendMessage = async (documentId: string, messageText: string) => {
    console.log('🔵 Sending message', { documentId, messageText });
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    const doc = documents.find(d => d.id === documentId);
    if (!doc) return;

    const currentChatHistory = doc.chatHistory || [];

    // Show user message immediately
    setDocuments(prevDocs =>
      prevDocs.map(d =>
        d.id === documentId
          ? { ...d, chatHistory: [...currentChatHistory, userMessage] }
          : d
      )
    );

    try {
      const response = await sendRAGQuery(documentId, messageText);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer, // Extract answer from QueryResponse
        timestamp: new Date().toISOString(),
      };

      const newChatHistory = [...currentChatHistory, userMessage, assistantMessage];

      setDocuments(prevDocs =>
        prevDocs.map(d =>
          d.id === documentId
            ? { ...d, chatHistory: newChatHistory }
            : d
        )
      );

      console.log(`✅ Chat response received for doc ${documentId}`);
    } catch (error: any) {
      console.error("❌ Failed to send message:", error);
      
      let errorContent = 'Sorry, I encountered an error processing your request. Please try again.';
      
      if (error?.message?.includes('Chat session not found') || 
          error?.message?.includes('chatSessionId') ||
          error?.message?.includes('document has been fully processed')) {
        errorContent = 'Chat session not available yet. Please ensure the document has been fully processed. If this persists, try refreshing the page.';
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date().toISOString(),
      };

      const newChatHistory = [...currentChatHistory, userMessage, errorMessage];
      setDocuments(prevDocs =>
        prevDocs.map(d =>
          d.id === documentId
            ? { ...d, chatHistory: newChatHistory }
            : d
        )
      );
    }
  };

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