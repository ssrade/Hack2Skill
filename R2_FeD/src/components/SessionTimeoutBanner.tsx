import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import * as jwt_decode from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';

/**
 * SessionTimeoutBanner Component
 * Shows a warning banner 5 minutes before session expiry
 * with option to refresh token or stay logged in
 */
export function SessionTimeoutBanner() {
  const { inline, t } = useTranslation();
  const { authToken, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!authToken) {
      setShowWarning(false);
      return;
    }

    const checkTokenExpiry = () => {
      try {
        const decoded: any = jwt_decode.jwtDecode(authToken);
        if (!decoded?.exp) {
          return;
        }

        const currentTime = Date.now() / 1000;
        const expiryTime = decoded.exp;
        const timeUntilExpiry = expiryTime - currentTime;
        const fiveMinutesInSeconds = 5 * 60;

        // Show warning if less than 5 minutes remaining
        if (timeUntilExpiry > 0 && timeUntilExpiry <= fiveMinutesInSeconds) {
          setShowWarning(true);
          setTimeRemaining(Math.floor(timeUntilExpiry));
        } else {
          setShowWarning(false);
        }

        // Auto-logout if expired
        if (timeUntilExpiry <= 0) {
          setIsExpired(true);
          setShowWarning(false);
          setTimeout(() => {
            logout();
            // Show toast after logout
            if (typeof window !== 'undefined') {
              import('./ui/toast').then(({ toast }) => {
                t('Session expired. Please log in again.').then((msg: string) => {
                  toast.error(msg);
                });
              });
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking token expiry:', error);
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every 10 seconds
    const interval = setInterval(checkTokenExpiry, 10000);

    // Update countdown every second when warning is shown
    let countdownInterval: ReturnType<typeof setInterval> | null = null;
    if (showWarning) {
      countdownInterval = setInterval(() => {
        try {
          const decoded: any = jwt_decode.jwtDecode(authToken);
          if (decoded?.exp) {
            const currentTime = Date.now() / 1000;
            const timeUntilExpiry = decoded.exp - currentTime;
            if (timeUntilExpiry > 0) {
              setTimeRemaining(Math.floor(timeUntilExpiry));
            } else {
              setTimeRemaining(0);
            }
          }
        } catch (error) {
          // Ignore
        }
      }, 1000);
    }

    return () => {
      clearInterval(interval);
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [authToken, showWarning, logout]);

  const handleStayLoggedIn = async () => {
    // Attempt to refresh token if API supports it
    // For now, just close the warning (in production, you'd call a refresh endpoint)
    setShowWarning(false);
    
    // In a real app, you'd call an API to refresh the token
    // For now, we'll just dismiss the warning
    const { toast } = await import('./ui/toast');
    const message = await t('Please save your work. Session will expire soon.');
    toast.info(message);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isExpired) {
    return null; // Will be handled by logout
  }

  return (
    <AnimatePresence>
      {showWarning && timeRemaining !== null && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[9998] bg-yellow-600 dark:bg-yellow-700 text-white px-4 py-3 shadow-lg"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">
              {inline('Your session will expire in')} {formatTime(timeRemaining)}. {inline('Please save your work.')}
            </p>
            <Button
              onClick={handleStayLoggedIn}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {inline('Stay Logged In')}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

