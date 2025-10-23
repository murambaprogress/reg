/**
 * Configuration settings for the application
 */

// API Base URL - Use cloud backend
export const getBaseUrl = () => {
  // Always use cloud backend at progress.pythonanywhere.com
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