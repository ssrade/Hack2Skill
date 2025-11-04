import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cubicBezier } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Menu, CheckCircle2, X } from 'lucide-react';

// Import the components it manages
import { MainApp, type Document, type DocumentType } from '../components/MainApp';
import { UploadView } from '../components/UploadView';
import { UserNav } from '../components/UserNav';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';

import { getAllDocuments } from '../api/agreementApi';
import { getDocumentPreview } from '../api/previewApi';


// Animation transition settings
const appTransition = {
  duration: 0.6,
  ease: cubicBezier(0.32, 0.72, 0, 1), // A nice "deceleration" curve
};

interface AppPageProps {
  onLogout: () => void;
  onGoToProfile: () => void;
  onGoToAdmin: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;

  handleUploadDocument: (file: File, documentType: DocumentType) => Promise<Document>;
  handleDeleteDocument: (id: string) => void;
  handleDownloadDocument: (id: string) => void;
  handleSendMessage: (documentId: string, messageText: string) => Promise<void>;
  onPreviewDocument: (id: string) => void;
}


export function AppPage({
  onLogout,
  onGoToProfile,
  onGoToAdmin,
  theme,
  onToggleTheme,
  handleUploadDocument,
  handleDeleteDocument,
  handleDownloadDocument,
  handleSendMessage,
  onPreviewDocument,
}: AppPageProps) {

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousDocumentId, setPreviousDocumentId] = useState<string | null>(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);
  
  // Preview modal state
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Fetch documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        // Backend gets userId from JWT token (req.user.id)
        const docs = await getAllDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error('Failed to fetch documents:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);


  // --- STATE for Mobile Sidebar ---
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // ---------------------------------

  // --- URL & Navigation ---
  // Get the documentId from the URL, e.g., "/app/doc-123"
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  // --- DERIVED STATE FROM URL ---
  // The "upload dialog" is open if NO documentId is in the URL.
  const isUploadViewOpen = documentId === undefined;

  // Find the selected document based on the URL parameter.
  // const selectedDocument = documents.find(doc => doc.id === documentId); // Not used here

  // --- NEW EVENT HANDLERS (that use navigation) ---

  // When a user selects a doc from the list (in UploadView or MainApp)
  const handleSelectDocument = (id: string) => {
    // Store the previous document ID when navigating
    setPreviousDocumentId(documentId || null);
    navigate(`/app/${id}`);
    setIsMobileSidebarOpen(false); // Close mobile sidebar on selection
  };

  // When a user uploads a new doc
  const handleUploadAndSelect = async (file: File, documentType: DocumentType) => {
    const newDoc = await handleUploadDocument(file, documentType); // Call hook fn from props
    navigate(`/app/${newDoc.id}`); // Navigate to the new doc's route
  };

  // When a user deletes a doc
  const handleDeleteAndDeselect = (id: string) => {
    handleDeleteDocument(id); // Call hook fn from props
    setIsMobileSidebarOpen(false); // Close mobile sidebar
    
    // Show success message
    const deletedDoc = documents.find(doc => doc.id === id);
    setDeleteSuccessMessage(deletedDoc ? `Document "${deletedDoc.name}" deleted successfully` : 'Document deleted successfully');
    
    // Auto-hide after 3 seconds
    setTimeout(() => setDeleteSuccessMessage(null), 3000);
    
    if (documentId === id) {
      // If the currently viewed doc was deleted, navigate to previously viewed doc or another
      const remainingDocs = documents.filter(doc => doc.id !== id);
      if (remainingDocs.length > 0) {
        // Try to navigate to the previously viewed document, or first available
        const targetDoc = previousDocumentId && remainingDocs.find(doc => doc.id === previousDocumentId)
          ? previousDocumentId
          : remainingDocs[0].id;
        navigate(`/app/${targetDoc}`);
        setPreviousDocumentId(null); // Reset after navigation
      } else {
        // No documents left, go to upload view
        navigate('/app');
        setPreviousDocumentId(null);
      }
    }
  };

  // When the user clicks the "Upload" button in the MainApp sidebar
  const handleOpenUploadView = () => {
    navigate('/app');
    setIsMobileSidebarOpen(false); // Close mobile sidebar
  };

  // Handler for deleting all documents
  const handleDeleteAllDocuments = () => {
    // This will be handled by the useDocuments hook
    setDocuments([]);
    setIsMobileSidebarOpen(false);
    // Navigate to upload view if currently viewing a document
    if (documentId) {
      navigate('/app');
    }
  };

  // Handler to refresh documents list
  const handleDocumentsUpdate = async () => {
    try {
      // Backend gets userId from JWT token (req.user.id)
      const docs = await getAllDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to refresh documents:', err);
    }
  };

  // Handler for preview document - fetches preview URL from backend
  const handlePreviewDocument = async (id: string) => {
    try {
      console.log('🔍 Preview requested for document:', id);
      setPreviewDocumentId(id);
      setIsPreviewOpen(true);
      
      // Fetch the preview URL from backend
      const previewUrl = await getDocumentPreview(id);
      console.log('✅ Preview URL fetched:', previewUrl);
      
      // Update the document in the list with the preview URL
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === id 
            ? { ...doc, fileUrl: previewUrl }
            : doc
        )
      );
    } catch (error) {
      console.error('❌ Failed to fetch preview URL:', error);
      // Still open the modal, it will show an error state
    }
  };

  // Get the document for preview
  const previewDocument = previewDocumentId 
    ? documents.find(doc => doc.id === previewDocumentId) || null
    : null;

  // --- Loading & Empty States ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading your agreements...
      </div>
    );
  }

  // If no documents and user is on /app (no documentId), show upload view
  // This handles new users with zero documents
  if (!loading && documents.length === 0) {
    return (
      <>
        <UserNav
          onLogout={onLogout}
          onGoToProfile={onGoToProfile}
          onGoToAdmin={onGoToAdmin}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
        
        {/* Match the exact styling from the normal upload view */}
        <div className="min-h-screen w-full flex items-center justify-center
                        bg-gray-100 dark:bg-gradient-to-br dark:from-black dark:via-black dark:to-indigo-950">
          <div className="w-full h-screen md:w-[70vw] md:max-w-[1200px] md:h-[80vh] md:shadow-2xl rounded-none md:rounded-2xl">
            <UploadView
              documents={[]}
              onUpload={handleUploadAndSelect}
              onSelect={handleSelectDocument}
            />
          </div>
        </div>
      </>
    );
  }

  // --- RENDER ---
  return (
    <>
      {/* 1. The UserNav stays at the top */}
      <UserNav
        onLogout={onLogout}
        onGoToProfile={onGoToProfile}
        onGoToAdmin={onGoToAdmin}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      {/* Success Message Notification */}
      <AnimatePresence>
        {deleteSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-auto"
          >
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                {deleteSuccessMessage}
              </p>
              <button
                onClick={() => setDeleteSuccessMessage(null)}
                className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MOBILE SIDEBAR TOGGLE BUTTON */}
      {/* ⬅️ MODIFIED: top-2 instead of top-[60px] to move it higher */}
      {!isUploadViewOpen && (
        <div
          className="fixed top-6 left-4 z-50 md:hidden"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileSidebarOpen(prev => !prev)}
            className="bg-white/90 dark:bg-gray-800/80 backdrop-blur-md border-gray-300 dark:border-gray-700/50"
            aria-label="Toggle document list"
          >
            <Menu className="w-5 h-5 text-black dark:text-white" />
          </Button>
        </div>
      )}
      {/* --------------------------------- */}

      {/* 3. The main content area with the animation */}
      <div className="min-h-screen w-full flex items-center justify-center
                      bg-gray-100 dark:bg-gradient-to-br dark:from-black dark:via-black dark:to-indigo-950">
        <AnimatePresence mode="wait">
          {isUploadViewOpen ? (
            // --- SHOW UPLOAD VIEW (/app) ---
            <motion.div
              key="upload-view"
              // MODIFIED: Full screen on mobile, card on desktop
              className="w-full h-screen md:w-[70vw] md:max-w-[1200px] md:h-[80vh] md:shadow-2xl rounded-none md:rounded-2xl"
              layoutId="app-container"
              transition={appTransition}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1.0 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <UploadView
                documents={documents}
                onUpload={handleUploadAndSelect} // Use new nav handler
                onSelect={handleSelectDocument} // Use new nav handler
                isMobileSidebarOpen={isMobileSidebarOpen}
                setIsMobileSidebarOpen={setIsMobileSidebarOpen}
              />
            </motion.div>
          ) : (
            // --- SHOW MAIN APP (/app/:id) ---
            <motion.div
              key="main-app"
              // MODIFIED: Always full screen (rounded-none) since the interior handles the layout/sizing
              className="w-full h-screen rounded-none"
              layoutId="app-container"
              transition={appTransition}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MainApp
                // Pass through props from App.tsx
                onLogout={onLogout}
                onGoToProfile={onGoToProfile}
                onGoToAdmin={onGoToAdmin}
                onPreviewDocument={handlePreviewDocument}
                onDownloadDocument={handleDownloadDocument}
                onSendMessage={handleSendMessage}

                // Pass document data
                documents={documents}
                selectedDocId={documentId || null} // Pass the ID from the URL

                // ✅ ADDED: Pass mobile sidebar state
                isMobileSidebarOpen={isMobileSidebarOpen}
                setIsMobileSidebarOpen={setIsMobileSidebarOpen}

                // Wire up new navigation handlers
                onSelectDocument={handleSelectDocument}
                onUploadDialogOpenChange={handleOpenUploadView}
                onUpload={handleUploadAndSelect}
                onSelectFromModal={handleSelectDocument}
                onDeleteDocument={handleDeleteAndDeselect}
                onDeleteAllDocuments={handleDeleteAllDocuments}
                onDocumentsUpdate={handleDocumentsUpdate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={previewDocument}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </>
  );
}