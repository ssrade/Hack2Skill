import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cubicBezier } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Menu } from 'lucide-react';

// Import the components it manages
import { MainApp, type Document, type DocumentType } from '../components/MainApp';
import { UploadView } from '../components/UploadView';
import { UserNav } from '../components/UserNav';

import { getAllDocuments } from '../api/agreementApi';


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

  handleUploadDocument: (file: File, documentType: DocumentType) => Document;
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
  // Fetch documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user?.id) {
          console.error('No user ID found in localStorage');
          setLoading(false);
          return;
        }
        setLoading(true);
        const docs = await getAllDocuments(user.id);
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
    navigate(`/app/${id}`);
    setIsMobileSidebarOpen(false); // Close mobile sidebar on selection
  };

  // When a user uploads a new doc
  const handleUploadAndSelect = (file: File, documentType: DocumentType) => {
    const newDoc = handleUploadDocument(file, documentType); // Call hook fn from props
    navigate(`/app/${newDoc.id}`); // Navigate to the new doc's route
  };

  // When a user deletes a doc
  const handleDeleteAndDeselect = (id: string) => {
    handleDeleteDocument(id); // Call hook fn from props
    setIsMobileSidebarOpen(false); // Close mobile sidebar
    if (documentId === id) {
      // If the currently viewed doc was deleted, go back to the upload view
      navigate('/app');
    }
  };

  // When the user clicks the "Upload" button in the MainApp sidebar
  const handleOpenUploadView = () => {
    navigate('/app');
    setIsMobileSidebarOpen(false); // Close mobile sidebar
  };

  // --- Loading & Empty States ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading your agreements...
      </div>
    );
  }

  if (!loading && documents.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
        <p>No agreements found.</p>
        <Button onClick={() => navigate('/app')}>Upload One</Button>
      </div>
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
                onPreviewDocument={onPreviewDocument}
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
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}