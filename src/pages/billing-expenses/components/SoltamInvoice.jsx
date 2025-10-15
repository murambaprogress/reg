import React, { useState, useRef } from "react";
import { AppIcon } from "../../../components/AppIcon";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { Modal } from "../../../components/Modal";
import { useBilling } from '../BillingContext';

export const InvoiceModal = ({
  visible,
  close,
  initialData = {},
  onSubmit,
}) => {
  const { createInvoice } = useBilling();
  const [formData, setFormData] = useState({
    // Company details
    companyName: "SOLTAM STEEL SOLUTIONS",
    companyRegistration: "2016/039822/07",
    companyVatNumber: "4280275392",
    companyAddress1: "3A Blades Street, Industria West",
    companyAddress2: "Johannesburg, 2093",
    companyPhone: "011 473 5614",
    companyEmail: "accounts@soltamsteel.co.za",
    companyWebsite: "www.soltamsteel.co.za",
    
    // Invoice details
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    customerAddress: "",
    customerPhone: "",
    customerEmail: "",
    customerVatNumber: "",
    
    // Items
    items: [
      {
        id: Date.now(),
        code: "",
        description: "",
        quantity: "",
        unitPrice: "",
        total: 0,
      },
    ],
    
    // Totals
    subtotal: 0,
    vatPercentage: 15,
    vatAmount: 0,
    grandTotal: 0,
    
    // Payment details
    bankName: "FIRST NATIONAL BANK",
    accountName: "SOLTAM STEEL SOLUTIONS (PTY) LTD",
    accountNumber: "62758070728",
    branchCode: "250655",
    branchName: "Parktown",
    reference: "",
    
    ...initialData,
  });

  const validateForm = () => {
    // Simple validation
    if (!formData.customerName) {
      alert("Please enter customer name");
      return false;
    }
    
    // Validate all items have description and values
    for (const item of formData.items) {
      if (!item.description || !item.quantity || !item.unitPrice) {
        alert("Please complete all item details");
        return false;
      }
    }
    
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    
    // Calculate item total
    if (field === "quantity" || field === "unitPrice") {
      const quantity = parseFloat(updatedItems[index].quantity) || 0;
      const unitPrice = parseFloat(updatedItems[index].unitPrice) || 0;
      updatedItems[index].total = quantity * unitPrice;
    }
    
    // Calculate totals
    const subtotal = updatedItems.reduce(
      (sum, item) => sum + (parseFloat(item.total) || 0),
      0
    );
    
    const vatAmount = (subtotal * formData.vatPercentage) / 100;
    const grandTotal = subtotal + vatAmount;
    
    // Update form data with new items and totals
    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      vatAmount,
      grandTotal,
    });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + (parseFloat(item.total) || 0),
      0
    );
    
    const vatAmount = (subtotal * formData.vatPercentage) / 100;
    const grandTotal = subtotal + vatAmount;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      vatAmount,
      grandTotal,
    }));
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          id: Date.now(),
          code: "",
          description: "",
          quantity: "",
          unitPrice: "",
          total: 0,
        },
      ],
    });
  };

  const removeItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    // Calculate totals after removing item
    const subtotal = updatedItems.reduce(
      (sum, item) => sum + (parseFloat(item.total) || 0),
      0
    );
    
    const vatAmount = (subtotal * formData.vatPercentage) / 100;
    const grandTotal = subtotal + vatAmount;
    
    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      vatAmount,
      grandTotal,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Call the parent component's onSubmit function
      onSubmit && onSubmit(formData);
      close();
    }
  };

  const handleCreateInvoice = async () => {
    if (validateForm()) {
      try {
        await createInvoice(formData);
        alert('Invoice created successfully!');
        close();
      } catch (error) {
        alert('Failed to create invoice.');
      }
    }
  };

  const printRef = useRef();
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      title="Invoice"
      visible={visible}
      onClose={close}
      width="1100px"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={close} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handlePrint} type="button" variant="primary">
            Print Invoice
          </Button>
        </div>
      }
    >
      <div ref={printRef} className="print-invoice">
        <form onSubmit={handleSubmit} className="p-4">
          {/* Share Invoice Row */}
          <div className="flex items-center gap-4 mb-6" style={{ zIndex: 10, position: 'relative' }}>
            <span className="font-medium">Share Invoice:</span>
            <Button type="button" variant="ghost" className="flex items-center gap-2 text-green-600 hover:text-green-700" onClick={() => window.open(`https://wa.me/?text=Invoice%20${formData.invoiceNumber}`)}>
              <AppIcon icon="whatsapp" className="mr-1" /> WhatsApp
            </Button>
            <Button type="button" variant="ghost" className="flex items-center gap-2 text-blue-600 hover:text-blue-700" onClick={() => window.open(`mailto:${formData.customerEmail}?subject=Invoice%20${formData.invoiceNumber}`)}>
              <AppIcon icon="mail" className="mr-1" /> Email
            </Button>
          </div>

          {/* Header Image (Regimark) */}
          <div className="flex justify-center mb-6 pt-4">
            <img 
              src="/assets/images/regimark_header.png" 
              alt="Regimark Header" 
              style={{ 
                maxWidth: '100%', 
                height: '300px', /* Fixed height to match footer */
                width: '100%', 
                objectFit: 'fill', /* Changed to fill to stretch the image */
                marginTop: '15px',
                transform: 'scale(1.3)' /* Scale up the image by 30% */
              }} 
            />
          </div>
          {/* Company Header */}
          <div className="bg-blue-50 p-4 mb-6 border border-blue-200 rounded">
            <div className="flex justify-between">
              <div>
                <h1 className="text-3xl font-bold text-blue-800">{formData.companyName}</h1>
                <p className="text-sm">Registration: {formData.companyRegistration}</p>
                <p className="text-sm">VAT Number: {formData.companyVatNumber}</p>
                <p className="text-sm">{formData.companyAddress1}</p>
                <p className="text-sm">{formData.companyAddress2}</p>
                <p className="text-sm">Tel: {formData.companyPhone}</p>
                <p className="text-sm">Email: {formData.companyEmail}</p>
                <p className="text-sm">Web: {formData.companyWebsite}</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-blue-800">TAX INVOICE</h2>
                <div className="mt-4">
                  <Input
                    label="Invoice Number"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    label="Date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        
        {/* Customer Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-bold mb-2">Bill To:</h3>
            <Input
              label="Customer Name"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Customer Address"
              name="customerAddress"
              value={formData.customerAddress}
              onChange={handleInputChange}
            />
            <Input
              label="Phone"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleInputChange}
            />
            <Input
              label="Email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleInputChange}
            />
            <Input
              label="VAT Number"
              name="customerVatNumber"
              value={formData.customerVatNumber}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <h3 className="font-bold mb-2">Reference:</h3>
            <Input
              label="Reference"
              name="reference"
              value={formData.reference}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Form Actions - under Customer Billing */}
        <div className="flex justify-end mt-4 mb-6">
          <Button onClick={handleCreateInvoice} type="button" variant="primary" style={{ fontWeight: 'bold', fontSize: '1rem' }}>
            Save Invoice
          </Button>
        </div>
        
        {/* Items Table */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">Items:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b border-gray-300 text-left">Code</th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left">Description</th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left">Quantity</th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left">Unit Price</th>
                  <th className="py-2 px-4 border-b border-gray-300 text-left">Total</th>
                  <th className="py-2 px-4 border-b border-gray-300"></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="py-2 px-4 border-b border-gray-300">
                      <Input
                        name={`item-${index}-code`}
                        value={item.code}
                        onChange={(e) => handleItemChange(index, "code", e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-4 border-b border-gray-300">
                      <Input
                        name={`item-${index}-description`}
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        required
                      />
                    </td>
                    <td className="py-2 px-4 border-b border-gray-300">
                      <Input
                        name={`item-${index}-quantity`}
                        value={item.quantity}
                        type="number"
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        required
                      />
                    </td>
                    <td className="py-2 px-4 border-b border-gray-300">
                      <Input
                        name={`item-${index}-unitPrice`}
                        value={item.unitPrice}
                        type="number"
                        onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                        required
                      />
                    </td>
                    <td className="py-2 px-4 border-b border-gray-300">
                      R {(parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)).toFixed(2)}
                    </td>
                    <td className="py-2 px-4 border-b border-gray-300">
                      {formData.items.length > 1 && (
                        <Button
                          onClick={() => removeItem(index)}
                          variant="danger"
                          size="sm"
                        >
                          <AppIcon icon="trash" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2">
            <Button
              onClick={addItem}
              variant="outlined"
              size="sm"
              type="button"
            >
              <AppIcon icon="plus" className="mr-1" />
              Add Item
            </Button>
          </div>
        </div>
        
        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-64">
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Subtotal:</span>
              <span>R {formData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">VAT ({formData.vatPercentage}%):</span>
              <span>R {formData.vatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>R {formData.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
          {/* Banking Details */}
          <div className="bg-blue-50 p-4 border border-blue-200 rounded">
            <h3 className="font-bold mb-2">Banking Details:</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm"><span className="font-semibold">Bank:</span> {formData.bankName}</p>
                <p className="text-sm"><span className="font-semibold">Account Name:</span> {formData.accountName}</p>
                <p className="text-sm"><span className="font-semibold">Account Number:</span> {formData.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm"><span className="font-semibold">Branch Code:</span> {formData.branchCode}</p>
                <p className="text-sm"><span className="font-semibold">Branch:</span> {formData.branchName}</p>
                <p className="text-sm"><span className="font-semibold">Reference:</span> {formData.reference || formData.invoiceNumber}</p>
              </div>
            </div>
          </div>

          {/* Footer Image (Regimark) */}
          <div className="flex justify-center mt-12 pb-12 w-full">
            <img 
              src="/assets/images/regimark_footer.png" 
              alt="Regimark Footer" 
              style={{ 
                maxWidth: '100%', 
                height: '300px', /* Fixed height instead of auto to ensure stretching */
                width: '100%', 
                objectFit: 'fill', /* Changed to fill to stretch the image */
                marginBottom: '30px',
                transform: 'scale(1.3)', /* Scale up the image by 30% */
              }} 
            />
          </div>

          </form>
      </div>
    </Modal>
  );
};
