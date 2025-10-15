import React, { useState } from 'react';
import jsPDF from 'jspdf';
// autotable plugin might not attach in some bundler scenarios; will attempt dynamic import as fallback
import 'jspdf-autotable';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { addStandardFooter } from '../../../utils/pdfUtils';
import { useBilling } from '../BillingContext';
import InvoiceModal from './InvoiceModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import EmailModal from './EmailModal';

const BillingTable = ({ searchTerm, dateRange }) => {
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const { invoices, loading, error, markInvoicePaid, deleteInvoice, getInvoice, sendInvoiceEmail } = useBilling();

  const billingData = invoices || [];

  const filteredData = billingData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.customer_name?.toLowerCase().includes(searchLower) ||
      item.vehicle_model?.toLowerCase().includes(searchLower) ||
      item.vehicle_plate?.toLowerCase().includes(searchLower) ||
      item.service_description?.toLowerCase().includes(searchLower) ||
      item.invoice_number?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-success/10 text-success border-success/20';
      case 'sent':
      case 'draft':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'overdue':
        return 'bg-error/10 text-error border-error/20';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'CheckCircle';
      case 'sent':
      case 'draft':
        return 'Clock';
      case 'overdue':
        return 'AlertCircle';
      case 'cancelled':
        return 'XCircle';
      default:
        return 'Circle';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return `$${Number(amount).toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAll = () => {
    setSelectedInvoices(
      selectedInvoices.length === filteredData.length
        ? [] 
        : filteredData.map(item => item.id)
    );
  };

  // Calculate total amount
  const totalAmount = filteredData.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);

  const handleMarkPaid = async (invoice) => {
    try {
      await markInvoicePaid(invoice.id, {
        amount: invoice.total_amount,
        payment_method: 'cash',
        payment_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setModalMode('create');
    setIsInvoiceModalOpen(true);
  };

  const handleEditInvoice = async (invoice) => {
    try {
      // Show loading indicator
      setLoading(true);
      
      // Fetch full invoice details for editing
      const fullInvoice = await getInvoice(invoice.id);
      setSelectedInvoice(fullInvoice);
      setModalMode('edit');
      setIsInvoiceModalOpen(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      alert('Failed to load invoice details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteInvoice = async () => {
    try {
      await deleteInvoice(selectedInvoice.id);
      setIsDeleteModalOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) return;

    try {
      await Promise.all(selectedInvoices.map(id => deleteInvoice(id)));
      setSelectedInvoices([]);
    } catch (error) {
      console.error('Error deleting invoices:', error);
    }
  };

  // Export all (filtered) invoices to CSV
  const handleExport = () => {
    if (filteredData.length === 0) return;
    const headers = [
      'Invoice Number', 'Customer Name', 'Customer Email', 'Vehicle Model', 'Vehicle Plate',
      'Service Description', 'Subtotal', 'Tax Rate', 'Discount', 'Total Amount', 'Status', 'Invoice Date', 'Due Date'
    ];
    const rows = filteredData.map(inv => [
      inv.invoice_number,
      inv.customer_name,
      inv.customer_email,
      inv.vehicle_model || '',
      inv.vehicle_plate || '',
      (inv.service_description || '').replace(/\n/g,' '),
      inv.subtotal,
      inv.tax_rate,
      inv.discount_amount,
      inv.total_amount,
      inv.status,
      inv.invoice_date,
      inv.due_date
    ]);
    const csv = [headers, ...rows].map(r => r.map(val => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download single invoice as PDF - Soltam Steel Style
  const handleDownloadInvoice = async (invoice) => {
    try {
      const full = await getInvoice(invoice.id);
      if (!full) throw new Error('No invoice data');

      // Ensure plugin loaded (autoTable added to prototype)
      if (typeof jsPDF === 'function' && !jsPDF.API.autoTable) {
        try { await import('jspdf-autotable'); } catch (e) { console.warn('autoTable dynamic import failed', e); }
      }

      // Generate PDF - Soltam Steel Invoice Style
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 40;
      let y = 60;

      // Company Header - Logo Image
      try {
        const logoResponse = await fetch('/assets/images/Regimark_Logo_page-0001-1752221173479.jpg');
        const logoBlob = await logoResponse.blob();
        const logoData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });
        doc.addImage(logoData, 'JPEG', (pageWidth - 200) / 2, y - 40, 200, 50);
        y += 30;
      } catch (error) {
        console.warn('Failed to load logo image, using text fallback', error);
        // Fallback to text
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        const companyName = 'Regimark Motors';
        const companyNameWidth = doc.getTextWidth(companyName);
        doc.text(companyName, (pageWidth - companyNameWidth) / 2, y);
        y += 25;
      }

      // Address
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const address1 = '85 Plymouth Road';
      const address1Width = doc.getTextWidth(address1);
      doc.text(address1, (pageWidth - address1Width) / 2, y);

      y += 15;
      const address2 = 'Southerton, Harare';
      const address2Width = doc.getTextWidth(address2);
      doc.text(address2, (pageWidth - address2Width) / 2, y);

      y += 40;

      // Invoice Details Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Date & Time', margin, y);
      doc.text('Invoice No', pageWidth - margin - 100, y);
      
      y += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const invoiceDate = new Date(full.invoice_date || new Date()).toLocaleDateString();
      const invoiceTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      doc.text(`${invoiceDate} ${invoiceTime}`, margin, y);
      doc.text(full.invoice_number || 'SS047', pageWidth - margin - 100, y);

      y += 40;

      // Bill To Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill to', margin, y);
      
      y += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Customer details
      if (full.customer_name) {
        doc.setFont('helvetica', 'bold');
        doc.text('Company Name', margin, y);
        doc.setFont('helvetica', 'normal');
        y += 15;
        doc.text(full.customer_name, margin, y);
        y += 20;
      }
      
      if (full.customer_address) {
        doc.setFont('helvetica', 'bold');
        doc.text('Street Address', margin, y);
        doc.setFont('helvetica', 'normal');
        y += 15;
        doc.text(full.customer_address, margin, y);
        y += 20;
      }
      
      if (full.customer_city) {
        doc.setFont('helvetica', 'bold');
        doc.text('City', margin, y);
        doc.setFont('helvetica', 'normal');
        y += 15;
        doc.text(full.customer_city, margin, y);
        y += 20;
      }

      // Phone and Email in right column
      let rightY = y - 60;
      if (full.customer_phone) {
        doc.setFont('helvetica', 'bold');
        doc.text('Phone', pageWidth - margin - 200, rightY);
        doc.setFont('helvetica', 'normal');
        rightY += 15;
        doc.text(full.customer_phone, pageWidth - margin - 200, rightY);
        rightY += 20;
      }
      
      if (full.customer_email) {
        doc.setFont('helvetica', 'bold');
        doc.text('E-mail address', pageWidth - margin - 200, rightY);
        doc.setFont('helvetica', 'normal');
        rightY += 15;
        doc.text(full.customer_email, pageWidth - margin - 200, rightY);
      }

      y += 40;

      // Items Table
      if (Array.isArray(full.items) && full.items.length > 0 && doc.autoTable) {
        const tableRows = full.items.map((item, index) => [
          (index + 1).toString(),
          item.description || '',
          `$${(Number(item.unit_price || 0)).toFixed(2)}`,
          item.quantity || '1',
          `$${(Number(item.total_price || 0)).toFixed(2)}`
        ]);

        doc.autoTable({
          head: [['No', 'Product Description', 'Price', 'Quantity', 'Amount']],
          body: tableRows,
          startY: y,
          styles: { 
            fontSize: 10, 
            cellPadding: 8,
            lineColor: [0, 0, 0],
            lineWidth: 0.5
          },
          headStyles: { 
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 40 },
            1: { cellWidth: 250 },
            2: { halign: 'right', cellWidth: 80 },
            3: { halign: 'center', cellWidth: 60 },
            4: { halign: 'right', cellWidth: 80 }
          },
          margin: { left: margin, right: margin }
        });

        y = doc.lastAutoTable.finalY + 30;
      }

      // Totals Section
      const totalsX = pageWidth - margin - 150;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Sub-total
      doc.text('Sub-total', totalsX - 80, y);
      doc.text(`$${(Number(full.subtotal || 0)).toFixed(2)}`, totalsX, y);
      y += 20;
      
      // VAT (if applicable)
      if (full.tax_amount && Number(full.tax_amount) > 0) {
        doc.text('VAT', totalsX - 80, y);
        doc.text(`$${(Number(full.tax_amount || 0)).toFixed(2)}`, totalsX, y);
        y += 20;
      }
      
      // Total Amount
      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount', totalsX - 80, y);
      doc.text(`$${(Number(full.total_amount || 0)).toFixed(2)}`, totalsX, y);

      y += 60;

      // Footer - Company Services
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const footerY = pageHeight - 100;
      const emailText = 'Email: tinashe@regimarkauto.co.zw';
      const emailWidth = doc.getTextWidth(emailText);
      doc.text(emailText, (pageWidth - emailWidth) / 2, footerY);
      
      const addressText = '85 Plymouth Road, Southerton, Harare';
      const addressWidth = doc.getTextWidth(addressText);
      doc.text(addressText, (pageWidth - addressWidth) / 2, footerY + 15);
      
      doc.setFont('helvetica', 'bold');
      const servicesText = 'For all your auto electricals & computer diagnostics';
      const servicesWidth = doc.getTextWidth(servicesText);
      doc.text(servicesText, (pageWidth - servicesWidth) / 2, footerY + 30);
      
      const injectionText = 'Petrol & Diesel Injection';
      const injectionWidth = doc.getTextWidth(injectionText);
      doc.text(injectionText, (pageWidth - injectionWidth) / 2, footerY + 45);
      
      doc.setFont('helvetica', 'normal');
      const phoneText = '+263 772 980 161 / +263 719 980 161 / +263 732 980 161';
      const phoneWidth = doc.getTextWidth(phoneText);
      doc.text(phoneText, (pageWidth - phoneWidth) / 2, footerY + 60);

      // Save the PDF
      try {
        doc.save(`invoice_${full.invoice_number || 'SS047'}.pdf`);
      } catch (saveErr) {
        console.error('PDF save failed', saveErr);
        alert('Unable to download PDF in this browser environment.');
      }
    } catch (e) {
      console.error('Failed to download invoice:', e);
      alert('Invoice PDF generation failed. Check console for details.');
    }
  };

  const handlePrintInvoice = async (invoice) => {
    try {
      const full = await getInvoice(invoice.id);
      if (!full) throw new Error('No invoice data');
      
      // Generate PDF for printing
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 40;
      let y = 60;

      // Company Header - Centered address
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const address1 = '85 Plymouth Road';
      const address1Width = doc.getTextWidth(address1);
      doc.text(address1, (pageWidth - address1Width) / 2, y);

      y += 15;
      const address2 = 'Southerton';
      const address2Width = doc.getTextWidth(address2);
      doc.text(address2, (pageWidth - address2Width) / 2, y);

      y += 15;
      const address3 = 'Harare';
      const address3Width = doc.getTextWidth(address3);
      doc.text(address3, (pageWidth - address3Width) / 2, y);

      y += 40;

      // Invoice Details Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Date & Time', margin, y);
      doc.text('Invoice No', pageWidth - margin - 100, y);
      
      y += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const invoiceDate = new Date(full.invoice_date || new Date()).toLocaleDateString();
      const invoiceTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      doc.text(`${invoiceDate} ${invoiceTime}`, margin, y);
      doc.text(full.invoice_number || 'SS047', pageWidth - margin - 100, y);

      y += 40;

      // Bill To Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill to', margin, y);
      
      y += 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Customer details
      if (full.customer_name) {
        doc.setFont('helvetica', 'bold');
        doc.text('Company Name', margin, y);
        doc.setFont('helvetica', 'normal');
        y += 15;
        doc.text(full.customer_name, margin, y);
        y += 20;
      }
      
      if (full.customer_address) {
        doc.setFont('helvetica', 'bold');
        doc.text('Street Address', margin, y);
        doc.setFont('helvetica', 'normal');
        y += 15;
        doc.text(full.customer_address, margin, y);
        y += 20;
      }
      
      if (full.customer_city) {
        doc.setFont('helvetica', 'bold');
        doc.text('City', margin, y);
        doc.setFont('helvetica', 'normal');
        y += 15;
        doc.text(full.customer_city, margin, y);
        y += 20;
      }

      // Phone and Email in right column
      let rightY = y - 60;
      if (full.customer_phone) {
        doc.setFont('helvetica', 'bold');
        doc.text('Phone', pageWidth - margin - 200, rightY);
        doc.setFont('helvetica', 'normal');
        rightY += 15;
        doc.text(full.customer_phone, pageWidth - margin - 200, rightY);
        rightY += 20;
      }
      
      if (full.customer_email) {
        doc.setFont('helvetica', 'bold');
        doc.text('E-mail address', pageWidth - margin - 200, rightY);
        doc.setFont('helvetica', 'normal');
        rightY += 15;
        doc.text(full.customer_email, pageWidth - margin - 200, rightY);
      }

      y += 40;

      // Items Table
      if (Array.isArray(full.items) && full.items.length > 0 && doc.autoTable) {
        const tableRows = full.items.map((item, index) => [
          (index + 1).toString(),
          item.description || '',
          `$${(Number(item.unit_price || 0)).toFixed(2)}`,
          item.quantity || '1',
          `$${(Number(item.total_price || 0)).toFixed(2)}`
        ]);

        doc.autoTable({
          head: [['No', 'Product Description', 'Price', 'Quantity', 'Amount']],
          body: tableRows,
          startY: y,
          styles: { 
            fontSize: 10, 
            cellPadding: 8,
            lineColor: [0, 0, 0],
            lineWidth: 0.5
          },
          headStyles: { 
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 40 },
            1: { cellWidth: 250 },
            2: { halign: 'right', cellWidth: 80 },
            3: { halign: 'center', cellWidth: 60 },
            4: { halign: 'right', cellWidth: 80 }
          },
          margin: { left: margin, right: margin }
        });

        y = doc.lastAutoTable.finalY + 30;
      }

      // Totals Section
      const totalsX = pageWidth - margin - 150;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Sub-total
      doc.text('Sub-total', totalsX - 80, y);
      doc.text(`$${(Number(full.subtotal || 0)).toFixed(2)}`, totalsX, y);
      y += 20;
      
      // VAT (if applicable)
      if (full.tax_amount && Number(full.tax_amount) > 0) {
        doc.text('VAT', totalsX - 80, y);
        doc.text(`$${(Number(full.tax_amount || 0)).toFixed(2)}`, totalsX, y);
        y += 20;
      }
      
      // Total Amount
      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount', totalsX - 80, y);
      doc.text(`$${(Number(full.total_amount || 0)).toFixed(2)}`, totalsX, y);

      y += 60;

      // Footer - Company Services
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const footerY = pageHeight - 100;
      const emailText = 'Email: tinashe@regimarkauto.co.zw';
      const emailWidth = doc.getTextWidth(emailText);
      doc.text(emailText, (pageWidth - emailWidth) / 2, footerY);
      
      const addressText = '85 Plymouth Road, Southerton, Harare';
      const addressWidth = doc.getTextWidth(addressText);
      doc.text(addressText, (pageWidth - addressWidth) / 2, footerY + 15);
      
      doc.setFont('helvetica', 'bold');
      const servicesText = 'For all your auto electricals & computer diagnostics';
      const servicesWidth = doc.getTextWidth(servicesText);
      doc.text(servicesText, (pageWidth - servicesWidth) / 2, footerY + 30);
      
      const injectionText = 'Petrol & Diesel Injection';
      const injectionWidth = doc.getTextWidth(injectionText);
      doc.text(injectionText, (pageWidth - injectionWidth) / 2, footerY + 45);
      
      doc.setFont('helvetica', 'normal');
      const phoneText = '+263 772 980 161 / +263 719 980 161 / +263 732 980 161';
      const phoneWidth = doc.getTextWidth(phoneText);
      doc.text(phoneText, (pageWidth - phoneWidth) / 2, footerY + 60);

      // Print the PDF
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      
      if (printWindow) {
        printWindow.onload = function() {
          printWindow.print();
        };
      } else {
        alert('Please allow pop-ups to print invoices');
      }
    } catch (e) {
      console.error('Failed to print invoice:', e);
      alert('Invoice printing failed. Check console for details.');
    }
  };

  const handleShareWhatsApp = (invoice) => {
    const message = `Hello! Here is your invoice ${invoice.invoice_number} from Regimark Motors. Total amount: $${invoice.total_amount}. Please contact us at +263 772 980 161 for any questions.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendEmail = (invoice) => {
    setSelectedInvoice(invoice);
    setIsEmailModalOpen(true);
  };

  return (
    <div className="overflow-hidden">
      {/* Table Header with Actions */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-heading-medium text-text-primary">
              Customer Invoices
            </h3>
            <span className="text-sm text-text-secondary">
              {filteredData.length} invoices
            </span>
            {selectedInvoices.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-text-secondary">
                  {selectedInvoices.length} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="modern-button border-error text-error hover:bg-error hover:text-error-foreground"
                >
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filteredData.length === 0}
              className="modern-button border-border hover:border-primary disabled:opacity-50"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={handleCreateInvoice}
              className="modern-button bg-primary text-primary-foreground"
            >
              <Icon name="Plus" size={16} className="mr-2" />
              New Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background/50">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedInvoices.length === filteredData.length}
                  onChange={handleSelectAll}
                  className="modern-input w-4 h-4 text-primary border-border rounded"
                />
              </th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Invoice #</th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Customer</th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Vehicle</th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Service</th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Amount</th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Status</th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Due Date</th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredData.map((invoice) => (
              <tr key={invoice.id} className="micro-interaction hover:bg-background/50">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={() => handleSelectInvoice(invoice.id)}
                    className="modern-input w-4 h-4 text-primary border-border rounded"
                  />
                </td>
                <td className="p-4">
                  <div className="font-body-medium text-text-primary">{invoice.invoice_number}</div>
                  <div className="text-sm text-text-secondary">{formatDate(invoice.invoice_date)}</div>
                </td>
                <td className="p-4">
                  <div className="font-body-medium text-text-primary">{invoice.customer_name}</div>
                  <div className="text-sm text-text-secondary">{invoice.customer_email}</div>
                </td>
                <td className="p-4">
                  <div className="font-body-medium text-text-primary">{invoice.vehicle_model || 'N/A'}</div>
                  <div className="text-sm text-text-secondary">{invoice.vehicle_plate || 'N/A'}</div>
                </td>
                <td className="p-4">
                  <div className="font-body-medium text-text-primary truncate max-w-xs" title={invoice.service_description}>
                    {invoice.service_description || 'N/A'}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-heading-medium text-text-primary">{formatCurrency(invoice.total_amount)}</div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body-medium border ${getStatusColor(invoice.status)}`}>
                    <Icon name={getStatusIcon(invoice.status)} size={12} className="mr-1" />
                    {formatStatus(invoice.status)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-sm text-text-primary">{formatDate(invoice.due_date)}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="modern-button p-1 hover:bg-background"
                      title="View Invoice"
                    >
                      <Icon name="Eye" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditInvoice(invoice)}
                      className="modern-button p-1 hover:bg-background"
                      title="Edit Invoice"
                    >
                      <Icon name="Edit" size={16} />
                    </Button>
                    {invoice.status !== 'paid' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="modern-button p-1 hover:bg-success/10 text-success"
                        onClick={() => handleMarkPaid(invoice)}
                        title="Mark as Paid"
                      >
                        <Icon name="CheckCircle" size={16} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInvoice(invoice)}
                      className="modern-button p-1 hover:bg-error/10 text-error"
                      title="Delete Invoice"
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePrintInvoice(invoice)}
                      className="modern-button p-1 hover:bg-background"
                      title="Print Invoice"
                    >
                      <Icon name="Printer" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadInvoice(invoice)}
                      className="modern-button p-1 hover:bg-background"
                      title="Download Invoice (PDF)"
                    >
                      <Icon name="Download" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendEmail(invoice)}
                      className="modern-button p-1 hover:bg-blue-50 text-blue-600"
                      title="Send via Email"
                    >
                      <Icon name="Mail" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShareWhatsApp(invoice)}
                      className="modern-button p-1 hover:bg-green-50 text-green-600"
                      title="Share via WhatsApp"
                    >
                      <Icon name="MessageCircle" size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          // Reset selected invoice
          setSelectedInvoice(null);
          // Refresh the invoices list to ensure changes are reflected
          fetchInvoices();
        }}
        invoice={selectedInvoice}
        mode={modalMode}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteInvoice}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice?"
        itemName={selectedInvoice ? `${selectedInvoice.invoice_number} - ${selectedInvoice.customer_name}` : ''}
        loading={loading}
      />

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        invoice={selectedInvoice}
        onSendEmail={sendInvoiceEmail}
      />
    </div>
  );
};

export default BillingTable;
