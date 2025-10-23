/**
 * URL utilities for consistent endpoint handling
 */

/**
 * Ensures a URL has a trailing slash for Django compatibility
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized URL with trailing slash
 */
export const ensureTrailingSlash = (url) => {
  if (!url) return url;
  
  // Don't add slash to URLs with query parameters
  if (url.includes('?')) return url;
  
  // Don't add slash to URLs that already have it
  if (url.endsWith('/')) return url;
  
  return `${url}/`;
};

/**
 * Normalizes all API endpoints in an object
 * @param {object} endpoints - Object with endpoint URLs as values
 * @returns {object} - Object with normalized endpoint URLs
 */
export const normalizeEndpoints = (endpoints) => {
  const normalized = {};
  
  for (const [key, url] of Object.entries(endpoints)) {
    normalized[key] = ensureTrailingSlash(url);
  }
  
  return normalized;
};

/**
 * Common API endpoints
 */
export const endpoints = normalizeEndpoints({
  // Auth endpoints
  login: '/auth/login',
  register: '/auth/register',
  // No trailing slash for create-technician - special case endpoint
  createTechnician: '/auth/create-technician', // This path must match the backend exactly
  verifyOtp: '/auth/verify-otp',
  me: '/auth/me',
  refreshToken: '/auth/token/refresh',
  
  // Admin endpoints
  adminTechnicians: '/auth/admin/technicians', // No trailing slash - matches backend URL pattern
  adminStats: '/auth/admin/stats',
  adminSystemHealth: '/auth/admin/system-health',
  adminRecentActivity: '/auth/admin/recent-activity',
  adminTechnicianProgress: '/auth/admin/technician-progress',
  
  // Dashboard endpoints
  dashboardKpi: '/auth/dashboard/kpi',
  dashboardMonthlyStats: '/auth/dashboard/monthly-stats',
  dashboardActiveJobs: '/auth/dashboard/active-jobs',
  
  // Inventory endpoints
  inventoryParts: '/inventory/parts',
  inventoryCategories: '/inventory/categories',
  inventorySuppliers: '/inventory/suppliers',
  inventoryTransactions: '/inventory/transactions',
  
  // Customer endpoints
  customers: '/customers',
  customerSearch: '/customers/search',
  
  // Job endpoints
  jobs: '/jobs',
  jobsActive: '/jobs/active',
  jobsCompleted: '/jobs/completed',
  technicianJobs: '/jobs/technician-dashboard',
  
  // Reports
  reportGenerate: '/auth/reports/generate',
  
  // Health check
  healthCheck: '/auth/health-check',
});

export default { ensureTrailingSlash, normalizeEndpoints, endpoints };