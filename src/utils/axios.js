import axios from 'axios';
import { getBaseUrl, authConfig } from './config';
import { fixUrlPath } from './urlFixer';
import { endpoints } from './urls';

// Variable to track when the last redirect happened to avoid loops
let lastRedirectTime = 0;
const REDIRECT_COOLDOWN = 3000; // 3 seconds

// Use the local backend URL from getBaseUrl()
const baseURL = getBaseUrl();

// Helper function to get CSRF token from cookies
function getCsrfToken() {
  // First try standard Django CSRF cookie name
  let cookieValue = getSpecificCookie('csrftoken');
  
  // If not found, try alternative names that Django might use
  if (!cookieValue) {
    cookieValue = getSpecificCookie('csrf');
  }
  
  return cookieValue;
}

// Helper to get a specific cookie by name
function getSpecificCookie(name) {
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
  baseURL: baseURL,
  withCredentials: true, // Important for CSRF cookies
});

instance.interceptors.request.use(
  (config) => {
    // Skip auth token for login and OTP verification
    const isAuthEndpoint = config.url && (
      config.url.includes('/auth/login') || 
      config.url.includes('/auth/verify-otp')
    );
    
    // Add JWT token for authentication (except for auth endpoints)
    if (!isAuthEndpoint) {
      const token = localStorage.getItem(authConfig.tokenKey);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Add CSRF token for non-GET requests
    if (config.method !== 'get') {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      } else {
        console.warn('No CSRF token found in cookies. This may cause CSRF validation failures.');
      }
    }
    
    // Use our URL fixer utility to ensure URL paths are compatible with backend
    if (config.url) {
      config.url = fixUrlPath(config.url);
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
      
      // Try to refresh the token if we have a refresh token
      const refreshToken = localStorage.getItem(authConfig.refreshTokenKey);
      if (refreshToken) {
        try {
          // Attempt to refresh the token
          const refreshResponse = await axios.post(`${baseURL}/token/refresh/`, {
            refresh: refreshToken
          });
          
          if (refreshResponse.data && refreshResponse.data.access) {
            // Store the new token
            localStorage.setItem(authConfig.tokenKey, refreshResponse.data.access);
            
            // Retry the original request with the new token
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Continue to logout if refresh fails
        }
      }
      
      // TEMPORARY: Disable automatic clearing of tokens and redirects
      console.warn('401 error detected but NOT clearing tokens or redirecting (disabled for debugging)');
      
      /* ORIGINAL CODE - DISABLED FOR DEBUGGING
      // Clear stored tokens if refresh failed or wasn't attempted
      localStorage.removeItem(authConfig.tokenKey);
      localStorage.removeItem(authConfig.refreshTokenKey);
      localStorage.removeItem(authConfig.userKey);
      
      // Redirect to login page if not already there AND not currently trying to log in
      // AND we haven't redirected in the last few seconds
      const currentTime = Date.now();
      // Make sure error.config.url exists before trying to check if it includes something
      const isLoginRequest = error.config && error.config.url && 
        (error.config.url.includes('/login') || error.config.url.includes('/auth/login'));
      
      // Don't redirect if this is a /me request - let UserContext handle it
      const isMeRequest = error.config && error.config.url && error.config.url.includes('/me');
        
      if (!window.location.pathname.includes('/login') && 
          !isLoginRequest &&
          !isMeRequest &&
          currentTime - lastRedirectTime > REDIRECT_COOLDOWN) {
            
        console.log('Redirecting to login page due to authentication failure');
        lastRedirectTime = currentTime;
        
        // Use a timeout to give time for any pending login actions to complete
        setTimeout(() => {
          // Check again before redirecting
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }, 500);
      }
      */
    }
    
    // Handle CSRF errors (403 Forbidden with CSRF message)
    if (error.response && error.response.status === 403 && 
        error.response.data && 
        (error.response.data.detail?.includes('CSRF') || 
         error.response.data.message?.includes('CSRF') || 
         (typeof error.response.data === 'string' && error.response.data.includes('CSRF')))) {
      console.error('CSRF token validation failed:', error.response.data);
      
      // Get a fresh CSRF token by making a GET request to the API
      try {
        // Make a GET request to the API to refresh CSRF token
        await axios.get(`${getBaseUrl()}/health-check/`, { withCredentials: true });
        
        // Retry the original request after refreshing the CSRF token
        const originalRequest = error.config;
        const freshCsrfToken = getCsrfToken();
        if (freshCsrfToken) {
          originalRequest.headers['X-CSRFToken'] = freshCsrfToken;
          return axios(originalRequest);
        }
      } catch (csrfRefreshError) {
        console.error('Failed to refresh CSRF token:', csrfRefreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper functions for specific problematic endpoints
export const apiHelpers = {
  /**
   * Get technicians list with proper URL formatting
   */
  getTechnicians: () => {
    return instance.get('/admin/technicians/'); // With trailing slash
  },
  
  /**
   * Delete technician with proper URL formatting
   */
  deleteTechnician: (technicianId) => {
    return instance.delete(`/admin/technicians/${technicianId}/`); // With trailing slash
  },
  
  /**
   * Toggle technician active status with proper URL formatting
   */
  toggleTechnicianActive: (technicianId, isActive) => {
    return instance.patch(`/admin/technicians/${technicianId}/toggle-active/`, {
      is_active: isActive
    });
  },
  
  /**
   * Create technician with proper URL formatting
   */
  createTechnician: (technicianData) => {
    return instance.post('/auth/create-technician', technicianData); // No trailing slash
  },
  
  /**
   * Get inventory transactions with proper authentication
   */
  getInventoryTransactions: () => {
    return instance.get('/inventory/transactions/');
  },
  
  /**
   * Create inventory transaction with proper authentication
   */
  createInventoryTransaction: (transactionData) => {
    return instance.post('/inventory/transactions/', transactionData);
  },
  
  /**
   * Get inventory parts with proper authentication
   */
  getInventoryParts: () => {
    return instance.get('/inventory/parts/');
  },
  
  /**
   * Get inventory categories with proper authentication
   */
  getInventoryCategories: () => {
    return instance.get('/inventory/categories/');
  },
  
  /**
   * Get inventory suppliers with proper authentication
   */
  getInventorySuppliers: () => {
    return instance.get('/inventory/suppliers/');
  },
  
  /**
   * Get customers with proper authentication
   */
  getCustomers: () => {
    return instance.get('/customers/');
  },
  
  /**
   * Get technician jobs with proper authentication
   */
  getTechnicianJobs: () => {
    return instance.get(endpoints.technicianJobs);
  },
  
  /**
   * Search inventory parts with proper authentication
   */
  searchInventoryParts: (query) => {
    const url = query 
      ? `/inventory/parts/?search=${encodeURIComponent(query)}`
      : '/inventory/parts/';
    return instance.get(url);
  },
  
  /**
   * Export inventory parts as CSV with proper authentication
   */
  exportInventoryParts: () => {
    return instance.get('/inventory/export/', {
      responseType: 'blob'
    });
  }
};

// Create a direct axios instance without auth interceptors
// Useful for login and other auth-related operations
export const createDirectAxios = () => {
  const directInstance = axios.create({
    baseURL: baseURL,
    withCredentials: true
  });

  directInstance.interceptors.request.use(
    (config) => {
      if (config.method !== 'get') {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
          config.headers['X-CSRFToken'] = csrfToken;
        } else {
          console.warn('No CSRF token found in cookies for direct axios instance.');
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return directInstance;
};

export default instance;