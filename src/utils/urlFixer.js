/**
 * URL path fixing utility for addressing API endpoint inconsistencies
 */

/**
 * Map of endpoints that should NOT have trailing slashes
 * Add endpoints to this list if they're causing 404 errors
 */
const NO_TRAILING_SLASH_ENDPOINTS = [
  'admin/technicians',
  'auth/admin/technicians',
  'create-technician',
  'auth/create-technician'
];

/**
 * Check if a URL should have a trailing slash removed
 * @param {string} url - The URL to check
 * @returns {boolean} - Whether the URL should NOT have a trailing slash
 */
export const shouldNotHaveTrailingSlash = (url) => {
  if (!url) return false;
  
  // First, strip any query parameters
  const urlWithoutQuery = url.split('?')[0];
  
  // Then check against our list of endpoints that should not have trailing slashes
  for (const endpoint of NO_TRAILING_SLASH_ENDPOINTS) {
    // Check for exact match
    if (urlWithoutQuery === endpoint) {
      return true;
    }
    
    // Check for match at the end of URL (e.g. /api/auth/admin/technicians)
    if (urlWithoutQuery.endsWith(`/${endpoint}`)) {
      return true;
    }
    
    // Check with potential prefixes like /api or /auth
    if (urlWithoutQuery === `/api/${endpoint}` || 
        urlWithoutQuery === `/auth/${endpoint}` ||
        urlWithoutQuery === `/api/auth/${endpoint}`) {
      return true;
    }
  }
  
  return false;
};

/**
 * Fix URL path to ensure compatibility with backend
 * @param {string} url - The URL to fix
 * @returns {string} - The fixed URL
 */
export const fixUrlPath = (url) => {
  if (!url) return url;
  
  // Store original URL for logging
  const originalUrl = url;
  
  // Don't modify URLs with query parameters
  if (url.includes('?')) return url;
  
  // Remove trailing slash if endpoint should not have one
  if (url.endsWith('/') && shouldNotHaveTrailingSlash(url)) {
    url = url.slice(0, -1);
  }
  
  // Add trailing slash if endpoint should have one
  else if (!url.endsWith('/') && !shouldNotHaveTrailingSlash(url)) {
    url = `${url}/`;
  }
  
  // Log URL changes in development mode
  if (process.env.NODE_ENV !== 'production' && originalUrl !== url) {
    console.log(`URL fixed: ${originalUrl} → ${url}`);
  }
  
  return url;
};

export default {
  shouldNotHaveTrailingSlash,
  fixUrlPath
};