import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { useBilling } from "../BillingContext";
import { getAllCustomers, searchCustomers } from "../../../api/customers";

const InvoiceModal = ({ isOpen, onClose, invoice = null, mode = "create" }) => {
  const { createInvoice, updateInvoice, fetchInvoices, loading } = useBilling();
  
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerError, setCustomerError] = useState(null);
  
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
      // Generate new invoice number for create mode
      const now = new Date();
      const invoiceNum = `SS${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      setFormData(prev => ({
        ...prev,
        invoiceNumber: invoiceNum,
      }));
      
      // Reset customer selection for new invoice
      setSelectedCustomer(null);
      setShowNewCustomer(false);
    }
  }, [invoice, mode, customers]);

  const validateForm = () => {
    if (!formData.invoiceNumber.trim()) {
      alert("Please enter invoice number");
      return false;
    }
    
    // Check if customer is selected or new customer data is provided
    if (!selectedCustomer && !showNewCustomer) {
      alert("Please select a customer or choose to add a new customer");
      return false;
    }
    
    if (showNewCustomer && !formData.customerCompanyName.trim()) {
      alert("Please enter customer company name");
      return false;
    }
    
    // Validate all items have description and price
    for (const item of formData.items) {
      if (!item.description.trim()) {
        alert("Please enter description for all items");
        return false;
      }
      if (!item.price || parseFloat(item.price) <= 0) {
        alert("Please enter valid price for all items");
        return false;
      }
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
    
    // VAT is optional - only calculate if vatIncluded is true
    const vatAmount = formData.vatIncluded ? (subtotal * 0.15) : 0; // 15% VAT
    const totalAmount = subtotal + vatAmount;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
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
      const invoiceData = {
        invoice_number: formData.invoiceNumber,
        invoice_date: formData.invoiceDate,
        due_date: formData.invoiceDate, // You may want to allow user to set due date
        service_description: formData.items.map(item => item.description).join(', '),
        subtotal: formData.subtotal,
        tax_rate: formData.vatIncluded ? 15 : 0,
        discount_amount: 0,
        status: 'draft',
        payment_method: 'pending',
        items: formData.items.map(item => ({
          item_type: 'service', // If you support other types, set accordingly
          description: item.description,
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.price) || 0,
          part_number: '',
        })),
      };

      // Handle customer data - match serializer field names exactly
      if (selectedCustomer) {
        // Use existing customer
        invoiceData.customer = selectedCustomer.id;
      } else if (showNewCustomer) {
        // Send customer data for creation - use exact field names from serializer
        invoiceData.customer_company_name = formData.customerCompanyName;
        invoiceData.customer_address = formData.customerStreetAddress;
        invoiceData.customer_city = formData.customerCity;
        if (formData.customerPhone) invoiceData.customer_phone_input = formData.customerPhone;
        if (formData.customerEmail) invoiceData.customer_email_input = formData.customerEmail;
      }

      if (mode === 'create') {
        await createInvoice(invoiceData);
        await fetchInvoices();
      } else {
        await updateInvoice(invoice.id, invoiceData);
        await fetchInvoices();
      }
      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
      let errorMsg = 'Invoice creation failed.';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          errorMsg += '\n' + Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
        } else {
          errorMsg += ` ${errorData}`;
        }
      } else if (error.message) {
        errorMsg += ` ${error.message}`;
      }
      alert(errorMsg);
    }
  };

  // Calculate totals when items change
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.vatIncluded]);

  const handlePrint = () => {
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
                margin: 16mm 10mm 16mm 10mm;
              }
              html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                background: white;
              }
              #invoice-print-area, .p-6 {
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box;
                overflow: visible !important;
                page-break-inside: avoid;
              }
              .invoice-header {
                display: block;
                margin-bottom: 12px;
                margin-top: 12px;
                width: 100%;
                page-break-inside: avoid;
              }
              .invoice-header img {
                max-height: 70px !important;
                width: auto !important;
                object-fit: contain !important;
                display: block;
                margin: 0 auto;
              }
              .invoice-footer {
                display: block;
                margin-bottom: 20px;
                margin-top: 20px;
                width: 100%;
                page-break-inside: avoid;
              }
              .modal-footer, .print-btn {
                display: none !important;
              }
              table {
                width: 100% !important;
                page-break-inside: avoid;
              }
              tr, td, th {
                page-break-inside: avoid;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--color-surface)] dark:bg-[var(--color-background)] text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)] rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]">
            {mode === "create" ? "Create Invoice" : "Edit Invoice"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-background)] dark:hover:bg-[var(--color-surface)] rounded-full transition-colors"
            disabled={loading}
          >
            <Icon name="X" size={20} />
          </button>
        </div>

  {/* Modal Body */}
  <div className="flex-1 overflow-y-auto">
          <div id="invoice-print-area">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Company Header */}
              <div className="pb-4 invoice-header">
                <img src="/assets/images/Regimark_Logo_page-0001-1752221173479.jpg" alt="Regimark Motors" className="mx-auto h-auto" />
              </div>

          {/* Invoice Details Section */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Date & Time</h3>
              <div className="grid grid-cols-2 gap-3">
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
              <h3 className="font-semibold text-gray-700 mb-3">Invoice No</h3>
              <Input
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                placeholder="SS047"
                required
              />
            </div>
          </div>

          {/* Bill To Section */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Bill to</h3>
            
            {/* Customer Selection */}
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-center gap-4 mb-3">
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
              <table className="w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 border-b border-gray-300 text-left font-semibold">No</th>
                    <th className="py-3 px-4 border-b border-gray-300 text-left font-semibold">Product Description</th>
                    <th className="py-3 px-4 border-b border-gray-300 text-left font-semibold">Price</th>
                    <th className="py-3 px-4 border-b border-gray-300 text-left font-semibold">Quantity</th>
                    <th className="py-3 px-4 border-b border-gray-300 text-left font-semibold">Amount</th>
                    <th className="py-3 px-4 border-b border-gray-300"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-3 px-4 text-center font-medium">{index + 1}</td>
                      <td className="py-3 px-4">
                        <textarea
                          className="w-full min-h-[60px] p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          placeholder="Enter product/service description..."
                          required
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, "price", e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          type="number"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          placeholder="1"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium">
                        ${(parseFloat(item.amount) || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
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
            
            <div className="mt-3">
              <Button
                type="button"
                onClick={addItem}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Icon name="Plus" size={16} />
                Add Item
              </Button>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end">
            {/* Save/Create Invoice Button - Far Right */}
            <div className="flex flex-col w-80 space-y-2">
              <div className="flex justify-end mb-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground px-6 py-2 font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Icon name="Loader" size={16} className="animate-spin" />
                      {mode === "create" ? "Creating..." : "Updating..."}
                    </div>
                  ) : (
                    mode === "create" ? "Save Invoice" : "Update Invoice"
                  )}
                </Button>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium">Sub-total</span>
                <span className="font-medium">${formData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="vatIncluded"
                    checked={formData.vatIncluded}
                    onChange={(e) => setFormData(prev => ({ ...prev, vatIncluded: e.target.checked }))}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="vatIncluded" className="font-medium">VAT (15%)</label>
                </div>
                <span className="font-medium">${formData.vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-300">
                <span className="font-bold text-lg">Total Amount</span>
                <span className="font-bold text-lg">${formData.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

              {/* Footer */}
              <div className="pt-6 border-t border-gray-200 invoice-footer">
                <img src="/assets/images/invoice-footer.png" alt="Regimark Motors Services" className="w-full h-auto" />
              </div>
            </form>
          </div>
        </div>

  {/* Modal Footer */}
  <div className="flex flex-col gap-3 p-6 border-t border-gray-200 bg-gray-50 modal-footer" style={{ flexShrink: 0 }}>
          <div className="flex items-center gap-4 mb-2 justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">Share Invoice:</span>
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-2 text-green-600 hover:text-green-700"
                onClick={() => {
                  // WhatsApp share logic (replace with real link)
                  const url = window.location.href;
                  window.open(`https://wa.me/?text=Invoice%20from%20Regimark%20Motors:%20${url}`);
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
                  const subject = encodeURIComponent('Invoice from Regimark Motors');
                  const body = encodeURIComponent('Please find your invoice attached.');
                  window.open(`mailto:?subject=${subject}&body=${body}`);
                }}
              >
                <Icon name="Mail" size={20} className="text-blue-600" />
                Email
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground px-6 py-2 font-semibold"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Icon name="Loader" size={16} className="animate-spin" />
                    {mode === "create" ? "Creating..." : "Updating..."}
                  </div>
                ) : (
                  mode === "create" ? "Save Invoice" : "Update Invoice"
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
                Print Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
