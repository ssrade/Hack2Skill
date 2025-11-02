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
import { Toaster } from './components/ui/toast';
import { OfflineBanner } from './components/OfflineBanner';
import { SessionTimeoutBanner } from './components/SessionTimeoutBanner';
import { DocumentSkeleton } from './components/DocumentSkeleton';

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
    // Clear localStorage tokens (used by axios interceptor)
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Call logout from AuthContext
    authLogout();
    
    // Navigate to login
    navigate('/login');
  };

  // --- UI Handlers ---
  const handleGoToProfile = () => navigate('/profile');
  const handleGoToAdmin = () => navigate('/admin');

  const handlePreviewDocument = (id: string) => {
    setPreviewDocId(id);
    setPreviewModalOpen(true);
  };

  // --- Find preview document ---
  const previewDocument = documents.find(doc => doc.id === previewDocId);

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
        document={previewDocument || null}
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