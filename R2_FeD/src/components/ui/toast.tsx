import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastComponent({ toast, onClose }: ToastProps) {
  useEffect(() => {
    // If duration is 0 or undefined, use default 5000ms, but if explicitly 0, don't auto-dismiss
    if (toast.duration === 0) {
      return; // Don't auto-dismiss if duration is explicitly 0
    }
    
    const duration = toast.duration !== undefined ? toast.duration : 5000;
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const styles = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border shadow-xl min-w-[300px] max-w-[500px] backdrop-blur-sm',
        styles[toast.type]
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{ zIndex: 9999 }}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{toast.message}</p>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-xs font-semibold underline hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose(toast.id);
        }}
        className="flex-shrink-0 text-current/70 hover:text-current transition-colors focus:outline-none focus:ring-2 focus:ring-current/50 rounded"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

let toastIdCounter = 0;
const toasts: Toast[] = [];
const listeners: Set<(toasts: Toast[]) => void> = new Set();

function notifyListeners() {
  listeners.forEach(listener => listener([...toasts]));
}

export const toast = {
  success: (message: string, duration?: number, action?: Toast['action']) => {
    const id = `toast-${++toastIdCounter}`;
    toasts.push({ id, message, type: 'success', duration, action });
    notifyListeners();
    return id;
  },
  error: (message: string, duration?: number, action?: Toast['action']) => {
    const id = `toast-${++toastIdCounter}`;
    toasts.push({ id, message, type: 'error', duration: duration || 7000, action });
    notifyListeners();
    return id;
  },
  info: (message: string, duration?: number, action?: Toast['action']) => {
    const id = `toast-${++toastIdCounter}`;
    toasts.push({ id, message, type: 'info', duration, action });
    notifyListeners();
    return id;
  },
  warning: (message: string, duration?: number, action?: Toast['action']) => {
    const id = `toast-${++toastIdCounter}`;
    toasts.push({ id, message, type: 'warning', duration, action });
    notifyListeners();
    return id;
  },
  dismiss: (id: string) => {
    const index = toasts.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.splice(index, 1);
      notifyListeners();
    }
  },
  subscribe: (listener: (toasts: Toast[]) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function Toaster() {
  const [toastList, setToastList] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe(setToastList);
    return unsubscribe;
  }, []);

  const handleClose = (id: string) => {
    toast.dismiss(id);
  };

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="assertive"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toastList.map((toastItem) => (
          <motion.div
            key={toastItem.id}
            className="pointer-events-auto"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }}
          >
            <ToastComponent toast={toastItem} onClose={handleClose} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

