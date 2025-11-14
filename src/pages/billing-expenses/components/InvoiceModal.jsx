import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { useBilling } from "../BillingContext";
import { getAllCustomers, searchCustomers } from "../../../api/customers";
import { validateInvoice, formatInvoiceData, showNotification } from "../../../utils/billingApiHelper";

const InvoiceModal = ({ isOpen, onClose, invoice = null, mode = "create", documentType = "invoice" }) => {
  const { createInvoice, updateInvoice, fetchInvoices, loading: contextLoading } = useBilling();
  
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Invoice details
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    invoiceTime: new Date().toTimeString().slice(0, 5),
    
    // Customer details (Bill To)
    customerCompanyName: "",
    customerStreetAddress: "",
    customerCity: "",
    customerPhone: "",
    customerEmail: "",
    
    // Items
    items: [
      {
        id: Date.now(),
        description: "",
        price: "",
        quantity: "1",
        amount: 0,
      },
    ],
    
    // Totals
    subtotal: 0,
    discountPercentage: 0,
    discountAmount: 0,
    vatAmount: 0,
    vatIncluded: false,
    totalAmount: 0,
  });

  // Fetch customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      if (!isOpen) return;
      
      setLoadingCustomers(true);
      setCustomerError(null);
      
      try {
        console.log('Loading customers...');
        const customerData = await getAllCustomers();
        console.log('Customer data received:', customerData);
        
        // Handle the response format - it should be an array of customers
        const customerList = Array.isArray(customerData) ? customerData : [];
        console.log('Setting customers:', customerList);
        
        setCustomers(customerList);
        
        if (customerList.length === 0) {
          setCustomerError('No customers found. You can add a new customer below.');
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        setCustomerError(`Failed to load customers: ${error.message || 'Unknown error'}`);
        setCustomers([]);
      } finally {
        setLoadingCustomers(false);
      }
    };
    
    loadCustomers();
  }, [isOpen]);

  // Initialize with invoice data if provided
  useEffect(() => {
    if (invoice && mode === 'edit') {
      setFormData(prev => ({
        ...prev,
        invoiceNumber: invoice.invoice_number || '',
        invoiceDate: invoice.invoice_date || prev.invoiceDate,
        customerCompanyName: invoice.customer_name || '',
        customerStreetAddress: invoice.customer_address || '',
        customerCity: invoice.customer_city || '',
        customerPhone: invoice.customer_phone || '',
        customerEmail: invoice.customer_email || '',
        items: invoice.items && invoice.items.length > 0 ? invoice.items.map(item => ({
          id: item.id || Date.now(),
          description: item.description || '',
          price: item.unit_price || '',
          quantity: item.quantity || '1',
          amount: item.total_price || 0,
        })) : prev.items,
        subtotal: invoice.subtotal || 0,
        discountPercentage: invoice.discount_percentage || 0,
        discountAmount: invoice.discount_amount || 0,
        vatAmount: invoice.tax_amount || 0,
        totalAmount: invoice.total_amount || 0,
      }));
      
      // Set selected customer if editing
      if (invoice.customer) {
        const customer = customers.find(c => c.id === invoice.customer);
        setSelectedCustomer(customer || null);
        setShowNewCustomer(!customer);
      }
    } else if (mode === 'create') {
      // Generate new invoice/quotation number for create mode
      const now = new Date();
      const prefix = documentType === 'quotation' ? 'Q' : 'SS';
      const invoiceNum = `${prefix}${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      setFormData(prev => ({
        ...prev,
        invoiceNumber: invoiceNum,
      }));
      
      // Reset customer selection for new invoice
      setSelectedCustomer(null);
      setShowNewCustomer(false);
    }
  }, [invoice, mode, customers, documentType]);

  const validateForm = () => {
    // Validate invoice/quotation number
    const docLabel = documentType === 'quotation' ? 'quotation number' : 'invoice number';
    if (!formData.invoiceNumber.trim()) {
      alert(`Please enter ${docLabel}`);
      return false;
    }
    
    // Check if customer is selected or new customer data is provided
    if (!selectedCustomer && !showNewCustomer) {
      alert("Please select a customer or choose to add a new customer");
      return false;
    }
    
    // Validate customer data
    if (showNewCustomer) {
      if (!formData.customerCompanyName.trim()) {
        alert("Please enter customer company name");
        return false;
      }
      
      // Validate contact information - at least one contact method
      if (!formData.customerPhone.trim() && !formData.customerEmail.trim()) {
        alert("Please provide at least one contact method (phone or email)");
        return false;
      }
      
      // Basic email validation
      if (formData.customerEmail.trim() && !formData.customerEmail.includes('@')) {
        alert("Please enter a valid email address");
        return false;
      }
    }
    
    // Check if we have any items
    if (formData.items.length === 0) {
      alert("Please add at least one item to the invoice");
      return false;
    }
    
    // Validate all items have description and price
    for (const [index, item] of formData.items.entries()) {
      if (!item.description.trim()) {
        alert(`Please enter description for item #${index + 1}`);
        return false;
      }
      if (!item.price || parseFloat(item.price) <= 0) {
        alert(`Please enter valid price for item #${index + 1}`);
        return false;
      }
      if (!item.quantity || parseInt(item.quantity) <= 0) {
        alert(`Please enter valid quantity for item #${index + 1}`);
        return false;
      }
    }
    
    // Validate totals
    if (formData.totalAmount <= 0) {
      alert("Total invoice amount cannot be zero or negative");
      return false;
    }
    
    return true;
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === parseInt(customerId));
    setSelectedCustomer(customer);
    setShowNewCustomer(false);
    
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerCompanyName: customer.name,
        customerStreetAddress: customer.address || '',
        customerPhone: customer.phone || '',
        customerEmail: customer.email || '',
      }));
    }
  };

  const handleNewCustomerToggle = () => {
    setShowNewCustomer(true);
    setSelectedCustomer(null);
    setFormData(prev => ({
      ...prev,
      customerCompanyName: '',
      customerStreetAddress: '',
      customerCity: '',
      customerPhone: '',
      customerEmail: '',
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    
    // Calculate item amount
    if (field === "quantity" || field === "price") {
      const quantity = parseFloat(updatedItems[index].quantity) || 1;
      const price = parseFloat(updatedItems[index].price) || 0;
      updatedItems[index].amount = quantity * price;
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
    }));
    
    // Calculate totals after state update
    setTimeout(calculateTotals, 0);
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );
    
    // Calculate discount amount based on percentage
    const discountAmount = (subtotal * formData.discountPercentage) / 100;
    
    // Calculate subtotal after discount
    const subtotalAfterDiscount = subtotal - discountAmount;
    
    // VAT is optional - only calculate if vatIncluded is true
    // Round to 2 decimal places to avoid validation errors (max 12 digits total)
    const vatAmount = formData.vatIncluded ? parseFloat((subtotalAfterDiscount * 0.15).toFixed(2)) : 0; // 15% VAT
    const totalAmount = parseFloat((subtotalAfterDiscount + vatAmount).toFixed(2));
    
    setFormData(prev => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      vatAmount,
      totalAmount,
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),
          description: "",
          price: "",
          quantity: "1",
          amount: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return; // Keep at least one item
    
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
    }));
    
    // Calculate totals after state update
    setTimeout(calculateTotals, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      // Show loading state
      setLoading(true);
      
      // Add customer data and document type to formData for the formatter
      const formDataWithCustomer = {
        ...formData,
        customer_id: selectedCustomer?.id || null,
        document_type: documentType, // Pass the document type (invoice or quotation)
      };
      
      // Format the invoice data using our helper
      const invoiceData = formatInvoiceData(formDataWithCustomer);
      
      // Validate the formatted invoice data
      const { isValid, errors } = validateInvoice(invoiceData);
      
      if (!isValid) {
        // Show validation errors
        const errorMessage = errors.join('\n');
        showNotification(errorMessage, 'error');
        throw new Error(errorMessage);
      }
      
      let result;
      
      const docLabel = documentType === 'quotation' ? 'Quotation' : 'Invoice';
      
      if (mode === 'create') {
        // Create new invoice/quotation
        console.log(`Creating new ${docLabel.toLowerCase()}:`, invoiceData);
        result = await createInvoice(invoiceData);
        console.log(`${docLabel} created successfully:`, result);
        
        // Show success notification
        showNotification(`${docLabel} created successfully`, 'success');
      } else {
        // Update existing invoice/quotation
        console.log(`Updating ${docLabel.toLowerCase()}:`, invoice.id, invoiceData);
        result = await updateInvoice(invoice.id, invoiceData);
        console.log(`${docLabel} updated successfully:`, result);
        
        // Show success notification
        showNotification(`${docLabel} updated successfully`, 'success');
      }
      
      // Make sure to fetch the updated invoices list
      await fetchInvoices();
      
      // Close the modal after successful operation
      onClose();
      
      return result;
    } catch (error) {
      console.error(`Error saving ${documentType}:`, error);
      
      // Format error message
      const docLabel = documentType === 'quotation' ? 'Quotation' : 'Invoice';
      let errorMsg = mode === 'create' ? `${docLabel} creation failed.` : `${docLabel} update failed.`;
      
      // Handle different error formats
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          // Format object errors
          const detailedErrors = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          
          errorMsg += '\n' + detailedErrors;
        } else {
          // String error
          errorMsg += ` ${errorData}`;
        }
      } else if (error.message) {
        // Simple error message
        errorMsg += ` ${error.message}`;
      }
      
      // Show error notification instead of alert
      showNotification(errorMsg, 'error', 5000);
      
      // Rethrow to allow parent components to handle
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals when items change
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.vatIncluded, formData.discountPercentage]);

  const handlePrint = () => {
    // Get the print content
    const printContents = document.getElementById('invoice-print-area').innerHTML;
    const printWindow = window.open('', '', 'height=900,width=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice Print</title>
          <link rel="stylesheet" href="/src/index.css" />
          <style>
            @media print {
              @page {
                size: A4 portrait;
                margin: 5mm 5mm 5mm 5mm; /* Minimum margins */
              }
              html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                background: white;
                font-size: 12px; /* Slightly reduced font size */
              }
              #invoice-print-area, .p-6 {
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box;
                overflow: visible !important;
                padding: 10px !important; /* Reduced padding */
                margin: 0 !important;
                page-break-before: avoid;
                page-break-after: avoid;
              }
              .invoice-header {
                display: block;
                margin-bottom: 6px;
                margin-top: 6px;
                width: 100%;
                page-break-inside: avoid;
              }
              .invoice-header img {
                display: block;
                width: 100% !important;
                height: 80px !important;
                object-fit: fill !important;
                border: none;
              }
              .invoice-footer {
                display: block;
                margin-bottom: 6px;
                margin-top: 6px;
                width: 100%;
                page-break-inside: avoid;
              }
              .invoice-footer img {
                display: block;
                width: 100% !important;
                height: 80px !important;
                object-fit: fill !important;
                border: none;
              }
              .modal-footer, .print-btn {
                display: none !important;
              }
              table {
                width: 100% !important;
                font-size: 11px; /* Smaller font for table */
                border-collapse: collapse;
              }
              tr, td, th {
                page-break-inside: avoid;
                padding: 4px !important; /* Reduced cell padding */
              }
              /* Improved spacing and form elements */
              .grid {
                grid-gap: 8px !important; /* Reduced grid gap */
              }
              .space-y-6 {
                margin-top: 8px !important;
                margin-bottom: 8px !important;
              }
              textarea, input {
                padding: 3px !important;
                font-size: 11px !important;
              }
              .py-3 {
                padding-top: 4px !important;
                padding-bottom: 4px !important;
              }
              /* Make sure content fits within page */
              * {
                overflow-wrap: break-word !important;
                word-wrap: break-word !important;
              }
              
              /* Table specific styles for better printing */
              thead th {
                font-size: 8px !important;
                font-weight: bold !important;
              }
              
              /* Make items table more compact */
              textarea {
                min-height: 30px !important;
              }
              
              /* Ensure form fits on page */
              form.space-y-3 > div, form.space-y-4 > div {
                margin-top: 3px !important;
                margin-bottom: 3px !important;
              }
              
              /* Further reduce sizes for printing */
              .text-lg {
                font-size: 12px !important;
              }
              
              .text-base {
                font-size: 10px !important;
              }
              
              .text-sm {
                font-size: 8px !important;
              }
              
              h3 {
                font-size: 9px !important;
                margin-bottom: 2px !important;
              }
              
              /* Ensure all content scales properly */
              img {
                max-width: 100% !important;
              }
              
              /* Make invoice items table fit better for printing */
              .invoice-items-table {
                font-size: 8px !important;
              }
              
              .invoice-items-table td,
              .invoice-items-table th {
                padding: 1px 2px !important;
              }
              
              .invoice-items-table textarea,
              .invoice-items-table input {
                font-size: 8px !important;
                padding: 1px !important;
                min-height: 20px !important;
              }
              
              /* Reduce spacing in grid layouts */
              .grid.grid-cols-2 {
                grid-gap: 4px !important;
              }
              
              /* Remove extra padding from button areas when printing */
              .py-1, .py-2 {
                padding-top: 2px !important;
                padding-bottom: 2px !important;
              }
            }
          </style>
        </head>
        <body>
          <div>${printContents}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  printWindow.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" style={{ pointerEvents: 'none' }}>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col" style={{ pointerEvents: 'auto' }}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === "create" 
              ? (documentType === "quotation" ? "Create Quotation" : "Create Invoice")
              : (documentType === "quotation" ? "Edit Quotation" : "Edit Invoice")
            }
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            disabled={loading}
          >
            <Icon name="X" size={20} />
          </button>
        </div>

  {/* Modal Body */}
  <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          <div id="invoice-print-area">
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Print-only styling */}
              <style media="print">
                {`
                  .space-y-3 > * + * {
                    margin-top: 0.5rem !important;
                  }
                  .p-4 {
                    padding: 0.75rem !important;
                  }
                  .mb-3 {
                    margin-bottom: 0.5rem !important;
                  }
                  .gap-4 {
                    gap: 0.75rem !important;
                  }
                  .gap-3 {
                    gap: 0.5rem !important;
                  }
                  input, textarea, select {
                    font-size: 11px !important;
                    padding: 2px 4px !important;
                    height: auto !important;
                    min-height: auto !important;
                  }
                  .h-8 {
                    height: 1.5rem !important;
                  }
                  table {
                    font-size: 11px !important;
                  }
                  .invoice-items-table th {
                    padding: 2px 4px !important;
                    font-size: 10px !important;
                  }
                  .invoice-items-table td {
                    padding: 2px 4px !important;
                  }
                `}
              </style>
              {/* Company Header */}
              <div className="pb-1 invoice-header">
                <img src="/assets/images/Regimark_Logo_page-0001-1752221173479.jpg" alt="Regimark Motors" className="mx-auto h-auto" style={{maxHeight: '45px'}} />
              </div>

          {/* Invoice Details Section */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">Date & Time</h3>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Date"
                  name="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Time"
                  name="invoiceTime"
                  type="time"
                  value={formData.invoiceTime}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">
                {documentType === "quotation" ? "QNumber" : "Invoice No"}
              </h3>
              <Input
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                placeholder={documentType === "quotation" ? "Q241112-001" : "SS047"}
                required
              />
            </div>
          </div>

          {/* Bill To Section */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2 text-sm">Bill to</h3>
            
            {/* Customer Selection */}
            <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Existing Customer
                  </label>
                  <select
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={showNewCustomer || loadingCustomers}
                  >
                    <option value="">
                      {loadingCustomers ? 'Loading customers...' : 'Select existing customer...'}
                    </option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} {customer.phone && `(${customer.phone})`}
                      </option>
                    ))}
                  </select>
                  
                  {/* Loading indicator */}
                  {loadingCustomers && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <Icon name="Loader" size={16} className="animate-spin" />
                      Loading customers...
                    </div>
                  )}
                  
                  {/* Error message */}
                  {customerError && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">{customerError}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerError(null);
                          // Retry loading customers
                          const loadCustomers = async () => {
                            setLoadingCustomers(true);
                            try {
                              const customerData = await getAllCustomers();
                              const customerList = Array.isArray(customerData) ? customerData : [];
                              setCustomers(customerList);
                            } catch (error) {
                              setCustomerError(`Failed to load customers: ${error.message || 'Unknown error'}`);
                            } finally {
                              setLoadingCustomers(false);
                            }
                          };
                          loadCustomers();
                        }}
                        className="text-sm text-yellow-600 hover:text-yellow-800 mt-1 underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <span className="text-sm text-gray-600">or</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleNewCustomerToggle}
                    disabled={selectedCustomer !== null || loadingCustomers}
                  >
                    Add New Customer
                  </Button>
                </div>
              </div>
              
              {selectedCustomer && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Selected:</strong> {selectedCustomer.name}
                    {selectedCustomer.phone && ` • ${selectedCustomer.phone}`}
                    {selectedCustomer.email && ` • ${selectedCustomer.email}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setFormData(prev => ({
                        ...prev,
                        customerCompanyName: '',
                        customerStreetAddress: '',
                        customerCity: '',
                        customerPhone: '',
                        customerEmail: '',
                      }));
                    }}
                    className="text-sm text-green-600 hover:text-green-800 mt-1"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>
            
            {/* Customer Details Form */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Input
                  label="Company Name"
                  name="customerCompanyName"
                  value={formData.customerCompanyName}
                  onChange={handleInputChange}
                  required
                  disabled={selectedCustomer !== null}
                />
                <Input
                  label="Street Address"
                  name="customerStreetAddress"
                  value={formData.customerStreetAddress}
                  onChange={handleInputChange}
                  disabled={selectedCustomer !== null}
                />
                <Input
                  label="City"
                  name="customerCity"
                  value={formData.customerCity}
                  onChange={handleInputChange}
                  disabled={selectedCustomer !== null}
                />
              </div>
              <div className="space-y-3">
                <Input
                  label="Phone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  disabled={selectedCustomer !== null}
                />
                <Input
                  label="E-mail address"
                  name="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  disabled={selectedCustomer !== null}
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 invoice-items-table">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-1 px-1 border-b border-gray-300 text-left font-semibold text-sm">No</th>
                    <th className="py-1 px-1 border-b border-gray-300 text-left font-semibold text-sm">Product Description</th>
                    <th className="py-1 px-1 border-b border-gray-300 text-left font-semibold text-sm">Price</th>
                    <th className="py-1 px-1 border-b border-gray-300 text-left font-semibold text-sm">Qty</th>
                    <th className="py-1 px-1 border-b border-gray-300 text-left font-semibold text-sm">Amount</th>
                    <th className="py-1 px-1 border-b border-gray-300"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-1 px-2 text-center font-medium text-sm">{index + 1}</td>
                      <td className="py-1 px-2">
                        <textarea
                          className="w-full min-h-[40px] p-1 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          placeholder="Enter product/service description..."
                          required
                        />
                      </td>
                      <td className="py-1 px-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, "price", e.target.value)}
                          placeholder="0.00"
                          className="text-sm h-8"
                          required
                        />
                      </td>
                      <td className="py-1 px-2">
                        <Input
                          type="number"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          placeholder="1"
                          className="text-sm h-8"
                        />
                      </td>
                      <td className="py-1 px-2 font-medium text-sm">
                        ${(parseFloat(item.amount) || 0).toFixed(2)}
                      </td>
                      <td className="py-1 px-2">
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeItem(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-1">
              <Button
                type="button"
                onClick={addItem}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 py-1 px-2 text-xs"
              >
                <Icon name="Plus" size={12} />
                Add Item
              </Button>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end">
            {/* Totals Display Only - No Save Button Here */}
            <div className="flex flex-col w-64 space-y-1">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="font-medium text-sm">Sub-total</span>
                <span className="font-medium text-sm">${formData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-200">
                <div className="flex items-center gap-1">
                  <label htmlFor="discountPercentage" className="font-medium text-sm">Discount (%)</label>
                  <input
                    type="number"
                    id="discountPercentage"
                    min="0"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      discountPercentage: Math.min(Math.max(0, parseFloat(e.target.value) || 0), 100) 
                    }))}
                    className="w-14 px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    onBlur={() => calculateTotals()}
                  />
                </div>
                <span className="font-medium text-sm">-${formData.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    id="vatIncluded"
                    checked={formData.vatIncluded}
                    onChange={(e) => setFormData(prev => ({ ...prev, vatIncluded: e.target.checked }))}
                    className="w-3 h-3 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="vatIncluded" className="font-medium text-sm">VAT (15%)</label>
                </div>
                <span className="font-medium text-sm">${formData.vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-300">
                <span className="font-bold text-base">Total Amount</span>
                <span className="font-bold text-base">${formData.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

              {/* Footer */}
              <div className="pt-1 border-t border-gray-200 invoice-footer">
                <img src="/assets/images/invoice-footer.jpeg" alt="Regimark Motors Services" className="w-full" style={{display: 'block', width: '100%', height: '400px', objectFit: 'fill', border: 'none'}} />
              </div>
            </form>
          </div>
        </div>

  {/* Modal Footer */}
  <div className="flex flex-col gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 modal-footer" style={{ flexShrink: 0 }}>
          {loading && (
            <div className="bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-4 py-2 rounded-md mb-2 flex items-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving {documentType === "quotation" ? "quotation" : "invoice"}... Please wait
            </div>
          )}
          <div className="flex items-center gap-4 mb-2 justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">
                {documentType === "quotation" ? "Share Quotation:" : "Share Invoice:"}
              </span>
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-2 text-green-600 hover:text-green-700"
                onClick={() => {
                  // WhatsApp share logic (replace with real link)
                  const docLabel = documentType === "quotation" ? "Quotation" : "Invoice";
                  const url = window.location.href;
                  window.open(`https://wa.me/?text=${docLabel}%20from%20Regimark%20Motors:%20${url}`);
                }}
              >
                <Icon name="MessageSquare" size={20} className="text-green-600" />
                WhatsApp
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                onClick={() => {
                  // Email share logic (replace with real link)
                  const docLabel = documentType === "quotation" ? "Quotation" : "Invoice";
                  const subject = encodeURIComponent(`${docLabel} from Regimark Motors`);
                  const body = encodeURIComponent(`Please find your ${docLabel.toLowerCase()} attached.`);
                  window.open(`mailto:?subject=${subject}&body=${body}`);
                }}
              >
                <Icon name="Mail" size={20} className="text-blue-600" />
                Email
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-primary text-primary-foreground px-6 py-2 font-semibold"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Icon name="Loader" size={16} className="animate-spin" />
                    {mode === "create" ? "Creating..." : "Updating..."}
                  </div>
                ) : (
                  mode === "create" 
                    ? (documentType === "quotation" ? "Save Quotation" : "Save Invoice")
                    : (documentType === "quotation" ? "Update Quotation" : "Update Invoice")
                )}
              </Button>
              <Button 
                onClick={onClose} 
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="print-btn bg-blue-600 text-white px-4 py-2 rounded font-semibold ml-2"
                onClick={handlePrint}
                disabled={loading}
              >
                {documentType === "quotation" ? "Print Quotation" : "Print Invoice"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
