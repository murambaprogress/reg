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
  const { data } = await axios.post('/billing/invoices/', invoiceData);
  return data;
};



export const updateInvoice = async (id, invoiceData) => {
  const { data } = await axios.put(`/billing/invoices/${id}/`, invoiceData);
  return data;
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
  console.log('Importing debtors with formData:', formData.get('file'));
  try {
    // Use the correct endpoint for debtor imports
    const { data } = await axios.post('/billing/debtors/import_excel/', formData);
    console.log('Import response:', data);
    return data;
  } catch (error) {
    // Normalize error logging to show server response if present
    console.error('Import error:', error?.response?.data || error?.message || error);
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
  return importDebtors(formData); // Use the same function for consistency
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
