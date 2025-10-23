import { useCallback, useRef } from 'react';

/**
 * Shared hook to handle session/authentication errors and prevent repeated redirects.
 * Usage: const handleSessionError = useSessionErrorHandler();
 *        handleSessionError(error)
 */
export default function useSessionErrorHandler() {
  const hasRedirected = useRef(false);

  return useCallback((error, setError) => {
    if (!error) return false;
    
    if (error.message === 'AUTHENTICATION_REQUIRED') {
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        setError && setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
      return true;
    } else if (error.message === 'FORBIDDEN') {
      setError && setError('You do not have permission to access this data.');
      return true;
    }
    return false;
  }, []);
}
