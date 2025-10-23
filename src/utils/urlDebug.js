/**
 * Debug Utility for URL-related issues
 * 
 * This script provides functions to diagnose URL issues in the application.
 * It can be used in the browser console for troubleshooting.
 */
import { shouldNotHaveTrailingSlash, fixUrlPath } from './urlFixer';
import { apiHelpers } from './axios';
import { endpoints } from './urls';

// Debug endpoints
export const debugEndpoints = () => {
  console.group('URL Endpoint Diagnostics');
  console.log('Current endpoints configuration:');
  
  // Check all endpoints
  Object.entries(endpoints).forEach(([name, url]) => {
    const shouldHaveSlash = !shouldNotHaveTrailingSlash(url);
    const hasSlash = url.endsWith('/');
    const isCorrect = shouldHaveSlash === hasSlash;
    
    console.log(
      `${isCorrect ? '✅' : '❌'} ${name}: ${url} ${isCorrect ? '' : `(${shouldHaveSlash ? 'should' : 'should not'} have trailing slash)`}`
    );
  });
  
  console.groupEnd();
};

// Test an endpoint
export const testEndpoint = async (endpointName, method = 'GET', data = null) => {
  console.group(`Testing endpoint: ${endpointName}`);
  
  try {
    const url = endpoints[endpointName];
    if (!url) {
      console.error(`❌ Endpoint "${endpointName}" not found in endpoints configuration`);
      console.groupEnd();
      return;
    }
    
    console.log(`Original URL: ${url}`);
    console.log(`Fixed URL: ${fixUrlPath(url)}`);
    console.log(`Should have trailing slash: ${!shouldNotHaveTrailingSlash(url)}`);
    
    // Use apiHelpers if available for this endpoint
    if (apiHelpers[`${method.toLowerCase()}${endpointName.charAt(0).toUpperCase() + endpointName.slice(1)}`]) {
      console.log(`Using apiHelpers.${method.toLowerCase()}${endpointName.charAt(0).toUpperCase() + endpointName.slice(1)}`);
    } else {
      console.log(`Using axios directly: ${method} ${url}`);
    }
    
    console.groupEnd();
  } catch (error) {
    console.error('Error in testEndpoint:', error);
    console.groupEnd();
  }
};

// List all URLs that should not have trailing slashes
export const listNoSlashEndpoints = () => {
  const problematicUrls = [];
  
  Object.entries(endpoints).forEach(([name, url]) => {
    if (shouldNotHaveTrailingSlash(url)) {
      problematicUrls.push({ name, url, hasSlash: url.endsWith('/') });
    }
  });
  
  console.group('Endpoints that should NOT have trailing slashes');
  console.table(problematicUrls);
  console.groupEnd();
};

// Expose diagnostics to window for console usage
if (typeof window !== 'undefined') {
  window.urlDiagnostics = {
    debugEndpoints,
    testEndpoint,
    listNoSlashEndpoints,
    shouldNotHaveTrailingSlash,
    fixUrlPath,
    endpoints
  };
  
  console.log('URL diagnostics available as window.urlDiagnostics');
}

export default {
  debugEndpoints,
  testEndpoint,
  listNoSlashEndpoints
};