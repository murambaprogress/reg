import axios from 'axios';
import { getBaseUrl } from '../src/utils/config';

const API_BASE_URL = getBaseUrl();

/**
 * Tests the invoice API endpoints
 */
const testInvoiceApi = async () => {
  try {
    console.log('Starting invoice API test...');
    
    // 1. Get authentication token (replace with your auth logic)
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('No auth token found. Please log in first.');
    }
    
    // Setup headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };
    
    // 2. Create a test invoice
    const testInvoice = {
      invoice_number: `TEST-${Date.now()}`,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      subtotal: 100,
      discount_percentage: 10,
      discount_amount: 10,
      tax_rate: 15,
      tax_amount: 13.5,
      total_amount: 103.5,
      payment_method: 'cash',
      notes: 'Test invoice created via API test',
      
      // Customer info
      customer_company_name: 'API Test Customer',
      customer_address: '123 Test Street',
      customer_city: 'Test City',
      customer_phone_input: '123-456-7890',
      customer_email_input: 'test@example.com',
      
      // Items
      items: [
        {
          item_type: 'service',
          description: 'Test service 1',
          quantity: 1,
          unit_price: 50,
          total_price: 50,
        },
        {
          item_type: 'product',
          description: 'Test product 1',
          quantity: 2,
          unit_price: 25,
          total_price: 50,
        }
      ]
    };
    
    console.log('Creating test invoice...');
    const createResponse = await axios.post(
      `${API_BASE_URL}/billing/invoices/`, 
      testInvoice,
      { headers }
    );
    
    const createdInvoice = createResponse.data;
    console.log('Invoice created successfully:', createdInvoice);
    
    // 3. Retrieve the created invoice
    console.log(`Retrieving invoice with ID ${createdInvoice.id}...`);
    const getResponse = await axios.get(
      `${API_BASE_URL}/billing/invoices/${createdInvoice.id}/`,
      { headers }
    );
    
    console.log('Invoice retrieved successfully:', getResponse.data);
    
    // 4. Update the invoice
    const updateData = {
      ...getResponse.data,
      notes: 'Updated test invoice',
      status: 'sent',
    };
    
    console.log('Updating invoice...');
    const updateResponse = await axios.put(
      `${API_BASE_URL}/billing/invoices/${createdInvoice.id}/`,
      updateData,
      { headers }
    );
    
    console.log('Invoice updated successfully:', updateResponse.data);
    
    // 5. Delete the test invoice (uncomment if you want to clean up)
    /*
    console.log('Deleting test invoice...');
    await axios.delete(
      `${API_BASE_URL}/billing/invoices/${createdInvoice.id}/`,
      { headers }
    );
    
    console.log('Invoice deleted successfully');
    */
    
    console.log('All invoice API tests completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Invoice API test failed:', error);
    console.error('Error details:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

// Run the test if this file is executed directly
if (typeof window !== 'undefined' && window.location.pathname.includes('test-invoice-api')) {
  testInvoiceApi().then(result => {
    console.log('Test result:', result);
  });
}

export default testInvoiceApi;