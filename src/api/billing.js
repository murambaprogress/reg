import axios from '../utils/axios';





// Invoices
export const fetchInvoices = async (params) => {
  const { data } = await axios.get('/billing/invoices/', { params });
  return data;
};

export const fetchInvoice = async (id) => {
  const { data } = await axios.get(`/billing/invoices/${id}/`);
  return data;
};



export const createInvoice = async (invoiceData) => {
  try {
    const { data } = await axios.post('/billing/invoices/', invoiceData);
    return data;
  } catch (error) {
    console.error('API Error creating invoice:', error.response?.data || error.message);
    throw error;
  }
};

export const updateInvoice = async (id, invoiceData) => {
  try {
    const { data } = await axios.put(`/billing/invoices/${id}/`, invoiceData);
    return data;
  } catch (error) {
    console.error('API Error updating invoice:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteInvoice = async (id) => {
  await axios.delete(`/billing/invoices/${id}/`);
};

// Email functionality
export const sendInvoiceEmail = async (id, emailData) => {
  const { data } = await axios.post(`/billing/invoices/${id}/send_email/`, emailData);
  return data;
};




// Debtors
export const fetchDebtors = async (params) => {
  const { data } = await axios.get('/billing/debtors/', { params });
  return data;
};

export const fetchDebtor = async (id) => {
  const { data } = await axios.get(`/billing/debtors/${id}/`);
  return data;
};

export const createDebtor = async (debtorData) => {
  const { data } = await axios.post('/billing/debtors/', debtorData);
  return data;
};



export const importDebtors = async (formData) => {
  const file = formData.get('file');
  console.log('Importing debtors with formData:', file ? file.name : 'No file found');
  
  // Validate the file exists in the formData
  if (!file) {
    console.error('No file found in formData');
    throw new Error('No file selected for upload');
  }

  // Validate file type
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    console.error('Invalid file type:', file.type);
    throw new Error('Invalid file format. Please upload a CSV or Excel file.');
  }
  
  try {
    // Add content type header for proper multipart handling
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    // Use the correct endpoint for debtor imports
    console.log('Sending import request to server...');
    const { data } = await axios.post('/billing/debtors/import_excel/', formData, config);
    console.log('Import response:', data);
    return data;
  } catch (error) {
    // Normalize error logging to show server response if present
    const errorMessage = error?.response?.data?.error || 
                        error?.response?.data?.detail || 
                        error?.message || 
                        'Unknown error during import';
                        
    console.error('Import error:', errorMessage);
    throw error;
  }
};

export const downloadDebtorTemplate = async () => {
  try {
    const response = await axios.get('/billing/debtors/download_template/', {
      responseType: 'blob',
    });
    
    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from response headers or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'debtors_import_template.csv';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Template download error:', error);
    throw error;
  }
};




export const importDebtorsExcel = async (formData) => {
  console.log('Using dedicated importDebtorsExcel function');
  
  // This is a backup function in case the main import endpoint has issues
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    const { data } = await axios.post('/billing/debtors/import_excel/', formData, config);
    console.log('Excel import response:', data);
    return data;
  } catch (error) {
    console.error('Excel import error:', error?.response?.data || error?.message || error);
    throw error;
  }
};



// Debtor Payments
export const fetchDebtorPayments = async (debtorId) => {
  const { data } = await axios.get(`/billing/debtors/${debtorId}/payment_history/`);
  return data;
};

export const recordDebtorPayment = async (debtorId, paymentData) => {
  const { data } = await axios.post(`/billing/debtors/${debtorId}/record_payment/`, paymentData);
  return data;
};

export const fetchDebtorContacts = async (debtorId) => {
  const { data } = await axios.get(`/billing/debtors/${debtorId}/contact_history/`);
  return data;
};

export const addDebtorContact = async (debtorId, contactData) => {
  const { data } = await axios.post(`/billing/debtors/${debtorId}/add_contact/`, contactData);
  return data;
};

export const updateDebtorContact = async (debtorId, contactId, contactData) => {
  const { data } = await axios.put(`/billing/debtors/${debtorId}/contacts/${contactId}/`, contactData);
  return data;
};

export const deleteDebtorContact = async (debtorId, contactId) => {
  await axios.delete(`/billing/debtors/${debtorId}/contacts/${contactId}/`);
};
