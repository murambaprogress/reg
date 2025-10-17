import axios from 'axios';
import { getBaseUrl, authConfig } from './config';

// Helper function to get CSRF token from cookies
function getCsrfToken() {
  const name = 'csrftoken';
  let cookieValue = null;
  
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const instance = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Important for CSRF cookies
});

instance.interceptors.request.use(
  (config) => {
    // Add JWT token for authentication
    const token = localStorage.getItem(authConfig.tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token for non-GET requests
    if (config.method !== 'get') {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      console.error('Authentication error:', error.response.data);
      
      // Clear stored tokens
      localStorage.removeItem(authConfig.tokenKey);
      localStorage.removeItem(authConfig.refreshTokenKey);
      localStorage.removeItem(authConfig.userKey);
      
      // Redirect to login page if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle CSRF errors (403 Forbidden with CSRF message)
    if (error.response && error.response.status === 403 && 
        error.response.data && 
        (error.response.data.detail?.includes('CSRF') || error.response.data.message?.includes('CSRF'))) {
      console.error('CSRF token validation failed:', error.response.data);
      // Option 1: Reload the page to get a fresh CSRF token
      // window.location.reload();
      
      // Option 2: Just log the error and let the component handle it
      console.warn('CSRF validation failed. The component should handle this error.');
    }
    
    return Promise.reject(error);
  }
);

export default instance;