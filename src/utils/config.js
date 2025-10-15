/**
 * Configuration settings for the application
 */

// API Base URL - Always use progress.pythonanywhere.com
export const getBaseUrl = () => {
  // Always use progress.pythonanywhere.com as requested
  return 'https://progress.pythonanywhere.com/api';
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