import { DocumentSidebar } from './DocumentSidebar';
import { DocumentView } from './DocumentView';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'framer-motion'; // --- ADDED ---

// --- ADDED / MOVED --- // (Moved from ChatInterface.tsx)
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}
// --------------------

// Document and DocumentType interfaces
export interface Document {
  id: string;
  name: string;
  uploadDate: string;
  status: 'analyzed' | 'processing' | 'pending';
  fileUrl?: string; // Optional: URL or blob URL for document preview
  // ... (rest of interface)
  evals: {
    riskScore: number;
    complexity: string;
    clauses: number;
  };
  risks: Array<{
    id: string;
    title: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }>;
  clauses: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
  }>;
  // store the chat history for this specific document
  chatHistory?: Message[]; // -----------
}
export type DocumentType = 'scanned' | 'electronic';

interface MainAppProps {
  onLogout: () => void;
  documents: Document[];
  selectedDocId: string | null;
  onSelectDocument: (id: string) => void;
  onUploadDialogOpenChange: (open: boolean) => void;
  onUpload: (file: File, documentType: DocumentType) => void;
  onSelectFromModal: (id: string) => void;
  onGoToProfile: () => void;
  onGoToAdmin: () => void;
  // Added/Ensured these props are in the interface
  onDeleteDocument: (id: string) => void;
  onPreviewDocument: (id: string) => void;
  onDownloadDocument: (id: string) => void;
  // --- ADDED ---
  // This function will be passed from the parent component
  // It handles sending a message and getting a reply.
  onSendMessage: (documentId: string, messageText: string) => Promise<void>;
  // -----------
  // --- ADDED for Mobile Sidebar ---
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  // --------------------------------
}

export function MainApp({
  documents,
  selectedDocId,
  onSelectDocument,
  onUploadDialogOpenChange,
  // Added props to destructuring
  onDeleteDocument,
  onPreviewDocument,
  // --- ADDED ---
  onSendMessage,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  // -----------
}: MainAppProps) {
  const selectedDocument = documents.find(doc => doc.id === selectedDocId);

  return (
    <div
      className={cn(
        "w-full h-full transition-all duration-500 flex-1 bg-white dark:bg-gradient-to-br dark:from-black dark:via-black dark:to-indigo-950 flex flex-col",
        "relative  overflow-hidden"
      )}
    >
      {/* Decorative background blobs */}
      <div className="absolute top-44 left-44 w-96 h-66 -translate-x-1/4 -translate-y-1-4 bg-blue-700/50 rounded-full blur-[100px] opacity-20 dark:opacity-40 pointer-events-none z-0"></div>
      <div className="absolute top-20 right-60 w-32 h-32 bg-pink-500 rounded-full blur-3xl opacity-20 dark:opacity-50 pointer-events-none z-0 animate-float-1"></div>
      <div className="absolute bottom-40 left-40 w-24 h-24 bg-teal-500 rounded-full blur-2xl opacity-30 dark:opacity-60 pointer-events-none z-0 animate-float-2"></div>

      {/* App content --- MODIFIED --- */}
      <div className="flex-1 flex overflow-auto md:overflow-hidden z-10 relative"> {/* --- ADDED relative --- */}

        {/* --- ADDED: Mobile Sidebar (Sliding) --- */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-20 sm:hidden"
                aria-label="Close sidebar"
              />
              {/* Mobile Sidebar Content */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed top-0 left-0 h-full z-30 sm:hidden"
              >
                <DocumentSidebar
                  documents={documents}
                  selectedDocId={selectedDocId}
                  onSelectDocument={onSelectDocument}
                  onUploadClick={() => onUploadDialogOpenChange(true)}
                  onPreviewDocument={onPreviewDocument}
                  onDeleteDocument={onDeleteDocument}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* --- ADDED: Desktop Sidebar (Static) --- */}
        <div className="hidden lg:block flex-shrink-0"> {/* Wrapper to hide on mobile and prevent shrinking */}
          <DocumentSidebar
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDocument={onSelectDocument}
            onUploadClick={() => onUploadDialogOpenChange(true)}
            onPreviewDocument={onPreviewDocument}
            onDeleteDocument={onDeleteDocument}
          />
        </div>

        {/* --- MODIFIED: DocumentView (Main Content) --- */}
        <DocumentView
          document={selectedDocument}
          onSendMessage={onSendMessage}
          // --- ADDED: Pass the mobile sidebar toggle ---
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          // ---------------------------------------------
        />
      </div>
    </div>
  );
}