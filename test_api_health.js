// Node.js script to test API health check endpoint
const https = require('https');
const http = require('http');

// Get command line arguments
const apiUrl = process.argv[2];

if (!apiUrl) {
  console.error('Usage: node test_api_health.js <api-base-url>');
  console.error('Example: node test_api_health.js https://http://localhost:3001/api');
  process.exit(1);
}

const healthCheckUrl = `${apiUrl}/health-check/`;

console.log(`Testing API health check endpoint at ${healthCheckUrl}`);
console.log('------------------------------------------------------');

// Function to display test result
function displayTestResult(success, message) {
  if (success) {
    console.log(`[PASS] ${message}`);
  } else {
    console.log(`[FAIL] ${message}`);
  }
}

// Function to make HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const lib = isHttps ? https : http;
    
    const startTime = Date.now();
    
    const req = lib.get(url, (res) => {
      const { statusCode } = res;
      
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = (endTime - startTime) / 1000;
        
        try {
          let parsedData = null;
          try {
            parsedData = JSON.parse(rawData);
          } catch (e) {
            reject({ error: 'Invalid JSON', rawData, statusCode });
            return;
          }
          
          resolve({ 
            data: parsedData, 
            statusCode, 
            responseTime,
            rawData 
          });
        } catch (e) {
          reject({ error: e.message, rawData, statusCode });
        }
      });
    }).on('error', (e) => {
      reject({ error: e.message });
    });
    
    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    // Test 1: Basic connectivity test
    process.stdout.write('Testing basic connectivity... ');
    let response;
    try {
      response = await makeRequest(healthCheckUrl);
      console.log(`OK (Status: ${response.statusCode})`);
      displayTestResult(true, 'API is accessible');
    } catch (err) {
      console.log(`FAILED (${err.error})`);
      displayTestResult(false, 'API is not accessible');
      console.log(`Error details: ${err.error}`);
      process.exit(1);
    }
    
    // Test 2: Check response content
    process.stdout.write('Checking response content... ');
    if (response.data && response.data.status === 'ok') {
      console.log('OK');
      displayTestResult(true, 'API returned correct response format');
    } else {
      console.log('FAILED');
      displayTestResult(false, `API returned unexpected status: ${response.data?.status || 'unknown'}`);
      console.log(`Response content: ${response.rawData}`);
      process.exit(1);
    }
    
    // Test 3: Response time
    process.stdout.write('Checking response time... ');
    if (response.responseTime < 2.0) {
      console.log(`OK (${response.responseTime.toFixed(2)} seconds)`);
      displayTestResult(true, 'API response time is acceptable');
    } else {
      console.log(`WARNING (${response.responseTime.toFixed(2)} seconds)`);
      displayTestResult(false, 'API response time is slow (>2 seconds)');
    }
    
    // Display system info from health check
    console.log('\nSystem Information from API:');
    console.log('-------------------------------');
    const systemInfo = response.data.system_info;
    console.log(`Hostname: ${systemInfo.hostname}`);
    console.log(`Platform: ${systemInfo.platform}`);
    console.log(`Python Version: ${systemInfo.python_version}`);
    console.log(`Django Version: ${systemInfo.django_version}`);
    console.log(`Database: ${response.data.database}`);
    
    console.log('\nAll tests completed successfully!');
    console.log(`API health check endpoint is working correctly at: ${healthCheckUrl}`);
    
  } catch (error) {
    console.error('Unexpected error occurred:', error);
    process.exit(1);
  }
}

runTests();