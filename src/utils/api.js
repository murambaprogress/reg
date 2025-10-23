
/**
 * Utility functions for making authenticated API calls with proper error handling
 */
import { getCSRFToken } from './csrf';

export const getBaseUrl = () => {
  return import.meta.env.VITE_API_BASE || 'https://progress.pythonanywhere.com/api';
};

/**
 * Makes an authenticated API call with proper error handling
 * @param {string} endpoint - The API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - The response data
 * @throws {Error} - Various error types based on response
 */
export const apiCall = async (endpoint, options = {}) => {
  const baseUrl = getBaseUrl();
  const token = localStorage.getItem('token');
  const csrfToken = getCSRFToken();

  // Determine if method is unsafe (needs CSRF)
  const method = (options.method || 'GET').toUpperCase();
  const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(needsCSRF && csrfToken ? { 'X-CSRFToken': csrfToken } : {})
  };

  const fetchOptions = {
    credentials: 'include', // Always send cookies
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, fetchOptions);
    
    // Check if response is HTML (likely a redirect to login page)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('AUTHENTICATION_REQUIRED');
    }
    
    // Handle different response statuses
    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('permissions');
      throw new Error('AUTHENTICATION_REQUIRED');
    }
    
    if (response.status === 403) {
      throw new Error('FORBIDDEN');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error occurred' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error.message === 'AUTHENTICATION_REQUIRED') {
      // Redirect to login
      window.location.href = '/';
      throw error;
    }
    throw error;
  }
};

/**
 * Helper function for GET requests
 */
export const apiGet = (endpoint) => apiCall(endpoint);

/**
 * Helper function for POST requests
 */
export const apiPost = (endpoint, data) => apiCall(endpoint, {
  method: 'POST',
  body: JSON.stringify(data)
});

/**
 * Helper function for PUT requests
 */
export const apiPut = (endpoint, data) => apiCall(endpoint, {
  method: 'PUT',
  body: JSON.stringify(data)
});

/**
 * Helper function for DELETE requests
 */
export const apiDelete = (endpoint) => apiCall(endpoint, {
  method: 'DELETE'
});

/**
 * Helper function for PATCH requests
 */
export const apiPatch = (endpoint, data) => apiCall(endpoint, {
  method: 'PATCH',
  body: JSON.stringify(data)
});