/**
 * Custom hook for making API calls with built-in error handling and token refresh
 */
import { useState, useCallback } from 'react';
import api from './axios';
import auth from './auth';

/**
 * useApi - A custom hook for handling API calls with built-in error handling
 * @returns {object} An object containing apiCall, loading, error, and clearError
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Clear any existing errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Make an API call with consistent error handling
   * @param {function} apiCall - Function that returns a promise for the API call
   * @param {function} onSuccess - Callback function to run on successful API call
   * @param {object} options - Additional options like errorMessage, retryOnAuth, etc.
   */
  const apiCall = useCallback(async (
    apiCallFn, 
    onSuccess = () => {}, 
    options = {}
  ) => {
    const { 
      errorMessage = 'An error occurred', 
      retryOnAuth = true,
      retryOnCsrf = true
    } = options;

    setLoading(true);
    clearError();
    
    try {
      // Ensure user is authenticated before making the request
      if (!auth.isAuthenticated()) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return null;
      }
      
      // Execute the API call
      const response = await apiCallFn();
      
      // Call the success callback with the response
      onSuccess(response);
      
      return response;
    } catch (error) {
      console.error('API call failed:', error);
      
      // Handle various error scenarios
      if (error.response) {
        // Handle 401 (Unauthorized) - Attempt to refresh token and retry
        if (error.response.status === 401 && retryOnAuth) {
          try {
            await auth.refreshToken();
            // Retry the API call with the new token
            const retryResponse = await apiCallFn();
            onSuccess(retryResponse);
            return retryResponse;
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            setError('Your session has expired. Please log in again.');
          }
        } 
        // Handle 403 (Forbidden) with CSRF errors - Attempt to get a fresh CSRF token and retry
        else if (error.response.status === 403 && retryOnCsrf && 
                (error.response.data?.detail?.includes('CSRF') || 
                 error.response.data?.message?.includes('CSRF') ||
                 (typeof error.response.data === 'string' && error.response.data.includes('CSRF')))) {
          try {
            // Get a fresh CSRF token
            await api.get('/auth/health-check/');
            // Retry the API call with the new CSRF token
            const retryResponse = await apiCallFn();
            onSuccess(retryResponse);
            return retryResponse;
          } catch (csrfError) {
            console.error('CSRF refresh failed:', csrfError);
            setError('CSRF verification failed. Please refresh the page and try again.');
          }
        } 
        // Handle other HTTP errors
        else {
          setError(
            error.response.data?.message || 
            error.response.data?.detail || 
            error.response.statusText || 
            errorMessage
          );
        }
      } 
      // Handle network errors (no response received)
      else if (error.request) {
        setError('Network error. Please check your connection and try again.');
      } 
      // Handle other errors
      else {
        setError(error.message || errorMessage);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  return { apiCall, loading, error, clearError };
};

export default useApi;