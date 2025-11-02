/**
 * User-friendly error message handler
 * Converts technical API errors into readable, actionable messages
 */

export interface ErrorInfo {
  message: string;
  userMessage: string;
  status?: number;
  code?: string;
}

/**
 * Extract user-friendly error message from various error formats
 */
export function getUserFriendlyError(error: any): string {
  // Network errors
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network and try again.';
  }

  if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
    return 'Unable to connect to the server. Please check your internet connection and ensure the backend server is running.';
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out. Please try again. If this persists, your connection may be slow.';
  }

  // HTTP status code errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return data?.message || data?.error || 'Invalid request. Please check your input and try again.';
      
      case 401:
        return 'Your session has expired. Please log in again.';
      
      case 403:
        return 'You don\'t have permission to perform this action.';
      
      case 404:
        return 'The requested resource was not found.';
      
      case 413:
        return 'File is too large. Please upload a file smaller than 10MB.';
      
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      
      case 500:
        return 'Server error. Our team has been notified. Please try again in a moment.';
      
      case 502:
      case 503:
        return 'Service temporarily unavailable. Please try again in a few moments.';
      
      case 504:
        return 'Request timed out. The server is taking too long to respond. Please try again.';
      
      default:
        return data?.message || data?.error || `An error occurred (${status}). Please try again.`;
    }
  }

  // Generic error messages
  if (error.message) {
    // Check for common error patterns and convert them
    const message = error.message.toLowerCase();
    
    if (message.includes('chat session') || message.includes('chatSessionId')) {
      return 'Chat session not available. Please ensure the document has been fully processed.';
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return 'The requested item was not found.';
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (message.includes('forbidden') || message.includes('403')) {
      return 'You don\'t have permission to perform this action.';
    }
    
    if (message.includes('server error') || message.includes('500')) {
      return 'Server error occurred. Please try again later.';
    }
  }

  // Fallback
  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
}

/**
 * Get detailed error information for logging/debugging
 */
export function getErrorInfo(error: any): ErrorInfo {
  const userMessage = getUserFriendlyError(error);
  const status = error.response?.status;
  const code = error.code || error.response?.data?.code;

  return {
    message: error.message || 'Unknown error',
    userMessage,
    status,
    code,
  };
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(error: any): boolean {
  if (!navigator.onLine) return true; // Network errors are recoverable
  if (error.code === 'ECONNABORTED') return true; // Timeouts are recoverable
  
  const status = error.response?.status;
  if ([429, 502, 503, 504].includes(status)) return true; // Rate limit and server errors are recoverable
  
  return false;
}

/**
 * Check if error requires user action (login, etc.)
 */
export function requiresUserAction(error: any): boolean {
  const status = error.response?.status;
  return status === 401 || status === 403; // Auth errors require user action
}

