import React, { useState } from 'react';
import jsPDF from 'jspdf';
// autotable plugin might not attach in some bundler scenarios; will attempt dynamic import as fallback
import 'jspdf-autotable';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useBilling } from '../BillingContext';
import InvoiceModal from './InvoiceModal';
import DeleteConfirmModal from './DeleteConfirmModal';

const BillingTable = ({ searchTerm, dateRange }) => {
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const { invoices, loading, error, markInvoicePaid, deleteInvoice, getInvoice } = useBilling();

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
      // Fetch full invoice details for editing
      const fullInvoice = await getInvoice(invoice.id);
      setSelectedInvoice(fullInvoice);
      setModalMode('edit');
      setIsInvoiceModalOpen(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
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

  // Download single invoice as JSON (placeholder for future PDF)
  const handleDownloadInvoice = async (invoice) => {
    try {
      const full = await getInvoice(invoice.id);
      if (!full) throw new Error('No invoice data');
      // Ensure plugin loaded (autoTable added to prototype)
      if (typeof jsPDF === 'function' && !jsPDF.API.autoTable) {
        try { await import('jspdf-autotable'); } catch (e) { console.warn('autoTable dynamic import failed', e); }
      }
      // Generate PDF
      const doc = new jsPDF({ unit: 'pt' });
      const left = 40;
      let y = 50;
      doc.setFontSize(18);
      doc.text(`INVOICE ${full.invoice_number}`, left, y);
      doc.setFontSize(10);
      y += 20;
      doc.text(`Date: ${full.invoice_date || ''}`, left, y);
      y += 14;
      doc.text(`Due: ${full.due_date || ''}`, left, y);
      y += 20;
      doc.setFontSize(12);
      doc.text('Bill To:', left, y);
      y += 14;
      doc.setFontSize(10);
      doc.text(`${full.customer_name || ''}`, left, y); y += 12;
      if (full.customer_email) { doc.text(full.customer_email, left, y); y += 12; }
      if (full.customer_phone) { doc.text(full.customer_phone, left, y); y += 12; }
      y += 10;
      doc.setFontSize(12);
      doc.text('Service Description:', left, y); y += 14;
      doc.setFontSize(10);
      const serviceLines = doc.splitTextToSize(full.service_description || '', 520);
      doc.text(serviceLines, left, y);
      y += serviceLines.length * 12 + 10;
      // Items table
      let afterTableY = y;
      if (Array.isArray(full.items) && full.items.length > 0 && doc.autoTable) {
        const tableRows = full.items.map(it => [
          it.item_type || '',
          (it.description || '').substring(0,120),
          it.quantity || 0,
          (Number(it.unit_price || 0)).toFixed(2),
          (Number(it.total_price || 0)).toFixed(2)
        ]);
        doc.autoTable({
          head: [['Type','Description','Qty','Unit Price','Total']],
            body: tableRows,
            startY: y,
            styles: { fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: [30,41,59] }
        });
        afterTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : y + 20;
      } else {
        // No items table, just move spacer
        afterTableY = y + 10;
      }
      // Summary
      const summaryX = 320;
      let sy = afterTableY;
      doc.setFontSize(11);
      doc.text('Summary', summaryX, sy); sy += 14;
      doc.setFontSize(10);
      const money = (v) => (Number(v || 0).toFixed(2));
      const lines = [
        ['Subtotal', money(full.subtotal)],
        ['Tax Rate', `${money(full.tax_rate)}%`],
        ['Tax Amount', money(full.tax_amount)],
        ['Discount', money(full.discount_amount)],
        ['Total', money(full.total_amount)]
      ];
      lines.forEach(row => { doc.text(`${row[0]}: ${row[1]}`, summaryX, sy); sy += 12; });
      if (full.status) { sy += 6; doc.text(`Status: ${full.status}`, summaryX, sy); }
      // Footer
      doc.setFontSize(9);
      doc.text('Generated by System', left, sy + 40);
      try {
        doc.save(`invoice_${full.invoice_number}.pdf`);
      } catch (saveErr) {
        console.error('PDF save failed', saveErr);
        alert('Unable to download PDF in this browser environment.');
      }
    } catch (e) {
      console.error('Failed to download invoice:', e);
      alert('Invoice PDF generation failed. Check console for details.');
    }
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
                      onClick={() => handleDownloadInvoice(invoice)}
                      className="modern-button p-1 hover:bg-background"
                      title="Download Invoice (PDF)"
                    >
                      <Icon name="Download" size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-text-secondary">
                  <Icon name="FileText" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No invoices found</p>
                  {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-text-secondary">
                  <Icon name="Loader" size={24} className="mx-auto mb-2 animate-spin" />
                  <p>Loading invoices...</p>
                </td>
              </tr>
            )}
            {/* Totals Row */}
            {filteredData.length > 0 && (
              <tr className="bg-background/75 font-heading-medium text-text-primary">
                <td className="p-4" colSpan={4}></td>
                <td className="p-4 border-t border-border">
                  Total: {formatCurrency(totalAmount)}
                </td>
                <td className="p-4 border-t border-border" colSpan={3}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-6 border-t border-border bg-background/25">
        <div className="flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            Showing {filteredData.length} of {billingData.length} invoices
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="modern-button border-border hover:border-primary"
            >
              <Icon name="ChevronLeft" size={16} />
            </Button>
            <span className="text-sm text-text-primary px-3 py-1">1 of 1</span>
            <Button
              variant="outline"
              size="sm"
              className="modern-button border-border hover:border-primary"
            >
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
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
    </div>
  );
};

export default BillingTable;
