/**
 * Configuration settings for the application
 */

// API Base URL - Use local backend
export const getBaseUrl = () => {
  // Use local backend server
  return 'http://localhost:8000/api';
};

// Authentication settings
export const authConfig = {
  tokenKey: 'token',
  refreshTokenKey: 'refreshToken',
  tokenExpiry: 'tokenExpiry',
  userKey: 'currentUser',
};

// Application settings
export const appConfig = {
  appName: 'Regimark Motors Control Center',
  appVersion: '1.0.0',
  copyrightYear: new Date().getFullYear(),
  supportEmail: 'support@regimarkmotors.com',
  maxUploadSize: 10 * 1024 * 1024, // 10MB
};

// Feature flags
export const featureFlags = {
  enableNotifications: true,
  enableInvoiceSharing: true,
  enablePrintOptimizations: true,
  enableDebtorsImport: true,
};

export default {
  getBaseUrl,
  authConfig,
  appConfig,
  featureFlags,
};