import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';

/**
 * OfflineBanner Component
 * Displays a banner when the user loses internet connection
 */
export function OfflineBanner() {
  const { inline } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show briefly that we're back online
      setTimeout(() => setWasOffline(false), 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check periodically (fallback)
    const interval = setInterval(() => {
      const currentlyOnline = navigator.onLine;
      if (currentlyOnline !== isOnline) {
        setIsOnline(currentlyOnline);
        if (!currentlyOnline) {
          setWasOffline(true);
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 dark:bg-red-700 text-white px-4 py-3 shadow-lg"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">
              {inline('No internet connection. Please check your network.')}
            </p>
          </div>
        </motion.div>
      )}
      {isOnline && wasOffline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-green-600 dark:bg-green-700 text-white px-4 py-3 shadow-lg"
          role="status"
          aria-live="polite"
        >
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <Wifi className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">
              {inline('Connection restored.')}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

