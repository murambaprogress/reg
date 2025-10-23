/**
 * CSRF Token Diagnostic Utility
 * 
 * This script helps diagnose CSRF token issues in the application.
 * It checks if CSRF tokens are being set and read correctly.
 */
import axios from './axios';
import { getBaseUrl } from './config';

// Get all cookies
const getAllCookies = () => {
  const cookies = {};
  if (document.cookie && document.cookie !== '') {
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = decodeURIComponent(value);
    });
  }
  return cookies;
};

// Check if CSRF cookie exists
const checkCsrfCookie = () => {
  const cookies = getAllCookies();
  const csrfCookie = cookies['csrftoken'] || cookies['csrf'];
  
  console.log('--- CSRF Cookie Diagnostic ---');
  if (csrfCookie) {
    console.log('✅ CSRF cookie found:', csrfCookie.substring(0, 10) + '...');
  } else {
    console.error('❌ No CSRF cookie found! This will cause CSRF validation failures.');
    console.log('Cookies found:', Object.keys(cookies).join(', '));
  }
  
  return csrfCookie;
};

// Test CSRF token by making a request
const testCsrfRequest = async () => {
  console.log('--- Testing CSRF Request ---');
  try {
    // First make a GET request to ensure we have a cookie
    await axios.get('/auth/health-check/');
    console.log('✅ Health check request successful - should have set CSRF cookie');
    
    // Now check if we have a cookie
    const csrfToken = checkCsrfCookie();
    
    if (!csrfToken) {
      console.error('❌ Cannot proceed with CSRF test - no token available');
      return false;
    }
    
    // Now try a POST request that should use the CSRF token
    console.log('Attempting a POST request with CSRF token...');
    const response = await axios.post('/auth/me/', {}, {
      headers: {
        'X-CSRFToken': csrfToken
      }
    });
    
    console.log('✅ POST request with CSRF successful!', response.status);
    return true;
  } catch (error) {
    console.error('❌ CSRF test request failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
};

// Run comprehensive CSRF diagnostics
export const diagnoseCsrfIssues = async () => {
  console.log('=== CSRF Diagnostic Tool ===');
  console.log('Running diagnostics...');
  
  // 1. Check base URL configuration
  console.log('--- API Configuration ---');
  const baseUrl = getBaseUrl();
  console.log('Base URL:', baseUrl);
  
  // 2. Check existing cookies
  const csrfCookie = checkCsrfCookie();
  
  // 3. Test auth state
  console.log('--- Auth State ---');
  const token = localStorage.getItem('token');
  if (token) {
    console.log('✅ Auth token found in localStorage');
  } else {
    console.warn('⚠️ No auth token found - user may not be authenticated');
  }
  
  // 4. Test CSRF requests
  await testCsrfRequest();
  
  console.log('=== Diagnostic Complete ===');
};

// Export functions for use in console or application
export default {
  getAllCookies,
  checkCsrfCookie,
  testCsrfRequest,
  diagnoseCsrfIssues
};