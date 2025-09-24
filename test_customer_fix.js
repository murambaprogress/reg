// Simple test to verify the customer API fix
import { fetchCustomers } from './src/api/billing.js';

async function testCustomerFetch() {
  try {
    console.log('Testing customer fetch...');
    const result = await fetchCustomers();
    console.log('Result:', result);
    
    if (result && result.results && Array.isArray(result.results)) {
      console.log('✅ SUCCESS: Customer API returns proper format');
      console.log(`Found ${result.results.length} customers`);
      
      if (result.results.length > 0) {
        console.log('Sample customer:', result.results[0]);
      }
    } else {
      console.log('❌ FAIL: Unexpected response format');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

// Run the test
testCustomerFetch();
