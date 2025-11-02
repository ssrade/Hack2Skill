import { useState, type JSX, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPanel } from './pages/AdminPanel';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import Index from './pages/Landing';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppPage } from './pages/AppPage'; 
import { useDocuments } from './hooks/useDocuments';
import { useAuth } from './contexts/AuthContext';
import { Toaster, toast } from './components/ui/toast';
import { OfflineBanner } from './components/OfflineBanner';
import { SessionTimeoutBanner } from './components/SessionTimeoutBanner';
import { DocumentSkeleton } from './components/DocumentSkeleton';
import { getDocumentPreview } from './api/previewApi';
import { getUserFriendlyError } from './utils/errorHandler';

type Theme = 'light' | 'dark';

// Helper component for protected routes
function ProtectedRoute({ isAuth, children }: { isAuth: boolean; children: JSX.Element }) {
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Guest route
function GuestRoute({ isAuth, children }: { isAuth: boolean; children: JSX.Element }) {
  if (isAuth) {
    return <Navigate to="/app" replace />;
  }
  return children;
}

// Main App component
export default function App() {
  // --- Use Auth Context ---
  const { isAuthenticated, logout: authLogout, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // --- Theme and Preview Modal state ---
  const [theme, setTheme] = useState<Theme>('dark');
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // --- Document Logic ---
  const {
    documents,
    isLoadingDocs, 
    handleUploadDocument,
    handleDeleteDocument,
    handleDownloadDocument,
    handleSendMessage,
  } = useDocuments(isAuthenticated);

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Theme handler
  const handleToggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // --- Auth Handlers ---
  const handleLogin = () => {
    // Auth is handled in LoginPage, just navigate
    navigate('/app');
  };

  const handleSignup = () => {
    // Auth is handled in SignupPage, just navigate
    navigate('/app');
  };

  const handleLogout = () => {
    // Clear sessionStorage tokens (used by axios interceptor)
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    
    // Call logout from AuthContext
    authLogout();
    
    // Navigate to login
    navigate('/login');
  };

  // --- UI Handlers ---
  const handleGoToProfile = () => navigate('/profile');
  const handleGoToAdmin = () => navigate('/admin');

  const handlePreviewDocument = async (id: string) => {
    try {
      console.log('📄 Preview requested for document:', id);
      
      // Reset previous preview URL
      setPreviewUrl(null);
      
      // Set the preview doc first
      setPreviewDocId(id);
      
      // Open modal immediately (will show loading state)
      setPreviewModalOpen(true);
      
      // Show loading toast
      const loadingToastId = toast.info('Loading preview...', 10000);
      
      // Fetch the preview URL from the backend
      const url = await getDocumentPreview(id);
      
      console.log('✅ Preview URL fetched:', url);
      
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      // Set the preview URL
      setPreviewUrl(url);
    } catch (error: any) {
      console.error('❌ Failed to load preview:', error);
      const errorMessage = getUserFriendlyError(error);
      toast.error(errorMessage || 'Failed to load document preview. Please try again.', 5000);
      // Close modal on error
      setPreviewModalOpen(false);
      setPreviewDocId(null);
      setPreviewUrl(null);
    }
  };

  // --- Find preview document and add preview URL ---
  const previewDocument = previewDocId 
    ? (() => {
        const doc = documents.find(d => d.id === previewDocId);
        if (!doc) return null;
        return { ...doc, fileUrl: previewUrl || doc.fileUrl };
      })()
    : null;

  // Loading spinner for auth check
  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="dark:text-white text-gray-800">Loading...</p>
        </div>
      </div>
    );
  }

  // Loading skeleton for documents (only when authenticated)
  if (isLoadingDocs && isAuthenticated) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-full max-w-4xl px-4">
          <DocumentSkeleton />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global UI Components */}
      <Toaster />
      <OfflineBanner />
      <SessionTimeoutBanner />
      
      <DocumentPreviewModal
        document={previewDocument}
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
      />

      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <GuestRoute isAuth={isAuthenticated}>
              <Index />
            </GuestRoute>
          }
        />
        <Route
          path="/login"
          element={
            <GuestRoute isAuth={isAuthenticated}>
              <LoginPage
                onLogin={handleLogin}
                onSwitchToSignup={() => navigate('/signup')}
              />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute isAuth={isAuthenticated}>
              <SignupPage
                onSignup={handleSignup}
                onSwitchToLogin={() => navigate('/login')}
              />
            </GuestRoute>
          }
        />

        {/* Protected App Route - handles both "/app" and "/app/:documentId" */}
        <Route
          path="/app/:documentId?"
          element={
            <ProtectedRoute isAuth={isAuthenticated}>
              <AppPage
                // UserNav props
                onLogout={handleLogout}
                onGoToProfile={handleGoToProfile}
                onGoToAdmin={handleGoToAdmin}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                
                // Document handlers
                handleUploadDocument={handleUploadDocument}
                handleDeleteDocument={handleDeleteDocument}
                handleDownloadDocument={handleDownloadDocument}
                handleSendMessage={handleSendMessage}
                
                // Preview handler
                onPreviewDocument={handlePreviewDocument}
              />
            </ProtectedRoute>
          }
        />

        {/* Other Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute isAuth={isAuthenticated}>
              <ProfilePage onBack={() => navigate('/app')} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAuth={isAuthenticated}>
              <AdminPanel onBack={() => navigate('/app')} />
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/app' : '/'} replace />}
        />
      </Routes>
    </>
  );
}