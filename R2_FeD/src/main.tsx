import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ;

// // Add this console log to verify
// console.log('Google Client ID:', GOOGLE_CLIENT_ID);
// console.log('Client ID length:', GOOGLE_CLIENT_ID.length);

// if (!GOOGLE_CLIENT_ID) {
//   console.error('VITE_GOOGLE_CLIENT_ID is not set in .env file');
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
