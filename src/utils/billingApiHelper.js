import * as billingApi from '../api/billing';

// Make the billing API functions available globally for easier access from components
window.billingApi = billingApi;

// Export utility functions for working with invoices

/**
 * Validates an invoice object to ensure it has all required fields
 * @param {Object} invoice - The invoice object to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateInvoice = (invoice) => {
  const errors = [];
  
  // Required fields
  if (!invoice.invoice_number) {
    errors.push('Invoice number is required');
  }
  
  if (!invoice.invoice_date) {
    errors.push('Invoice date is required');
  }
  
  // Customer validation
  if (!invoice.customer && !invoice.customer_company_name) {
    errors.push('Customer information is required');
  }
  
  // Items validation
  if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
    errors.push('Invoice must contain at least one item');
  } else {
    // Validate each item
    invoice.items.forEach((item, index) => {
      if (!item.description) {
        errors.push(`Item ${index + 1} description is required`);
      }
      
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        errors.push(`Item ${index + 1} must have a valid quantity`);
      }
      
      if (!item.unit_price || parseFloat(item.unit_price) < 0) {
        errors.push(`Item ${index + 1} must have a valid price`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format invoice data from form submission to API format
 * @param {Object} formData - The form data from the invoice form
 * @returns {Object} - API-ready invoice data
 */
export const formatInvoiceData = (formData) => {
  // Format date if needed
  let invoice_date = formData.invoiceDate;
  if (formData.invoiceDate && formData.invoiceTime) {
    // Combine date and time if both are present
    const dateObj = new Date(`${formData.invoiceDate}T${formData.invoiceTime}`);
    invoice_date = dateObj.toISOString();
  }
  
  // Basic invoice data
  const invoiceData = {
    invoice_number: formData.invoiceNumber,
    invoice_date: invoice_date,
    due_date: formData.dueDate || formData.invoiceDate, // Use invoice date as fallback
    status: formData.status || 'draft',
    subtotal: parseFloat(formData.subtotal) || 0,
    discount_percentage: parseFloat(formData.discountPercentage) || 0,
    discount_amount: parseFloat(formData.discountAmount) || 0,
    tax_rate: formData.vatIncluded ? 15 : 0, // 15% VAT
    tax_amount: parseFloat(formData.vatAmount) || 0,
    total_amount: parseFloat(formData.totalAmount) || 0,
    payment_method: formData.paymentMethod || 'pending',
    notes: formData.notes || '',
    document_type: formData.document_type || 'invoice', // Add document_type support
    
    // Format items for API
    items: formData.items.map(item => ({
      item_type: item.item_type || 'service',
      description: item.description,
      quantity: parseFloat(item.quantity) || 1,
      unit_price: parseFloat(item.price) || 0,
      total_price: parseFloat(item.amount) || 0,
      part_number: item.part_number || '',
    })),
  };
  
  // Handle customer data
  if (formData.customer_id) {
    invoiceData.customer = formData.customer_id;
  } else {
    // New customer data
    invoiceData.customer_company_name = formData.customerCompanyName;
    invoiceData.customer_address = formData.customerStreetAddress;
    invoiceData.customer_city = formData.customerCity;
    if (formData.customerPhone) invoiceData.customer_phone_input = formData.customerPhone;
    if (formData.customerEmail) invoiceData.customer_email_input = formData.customerEmail;
  }
  
  return invoiceData;
};

/**
 * Show a notification toast message
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration in milliseconds
 */
export const showNotification = (message, type = 'info', duration = 3000) => {
  const event = new CustomEvent('showNotification', { 
    detail: { message, type, duration }
  });
  window.dispatchEvent(event);
};

// Export the billing API functions directly
export const {
  fetchInvoices,
  fetchInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoiceEmail
} = billingApi;