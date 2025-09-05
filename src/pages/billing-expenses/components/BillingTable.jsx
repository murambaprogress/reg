import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BillingTable = ({ searchTerm, dateRange }) => {
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const billingData = [
    {
      id: 'INV-001',
      customer: 'John Smith',
      vehicle: '2019 Honda Civic',
      service: 'Brake Pad Replacement',
      amount: '$285.00',
      status: 'Paid',
      date: '2025-01-08',
      dueDate: '2025-01-15',
      paymentMethod: 'Credit Card'
    },
    {
      id: 'INV-002',
      customer: 'Sarah Johnson',
      vehicle: '2020 Toyota Camry',
      service: 'Oil Change + Filter',
      amount: '$95.00',
      status: 'Paid',
      date: '2025-01-09',
      dueDate: '2025-01-16',
      paymentMethod: 'Cash'
    },
    {
      id: 'INV-003',
      customer: 'Mike Wilson',
      vehicle: '2018 Ford F-150',
      service: 'Transmission Repair',
      amount: '$1,250.00',
      status: 'Pending',
      date: '2025-01-10',
      dueDate: '2025-01-17',
      paymentMethod: 'Pending'
    },
    {
      id: 'INV-004',
      customer: 'Lisa Davis',
      vehicle: '2021 BMW X5',
      service: 'Electrical Diagnosis',
      amount: '$150.00',
      status: 'Overdue',
      date: '2025-01-05',
      dueDate: '2025-01-12',
      paymentMethod: 'Pending'
    },
    {
      id: 'INV-005',
      customer: 'Robert Brown',
      vehicle: '2019 Audi A4',
      service: 'Battery Replacement',
      amount: '$195.00',
      status: 'Paid',
      date: '2025-01-11',
      dueDate: '2025-01-18',
      paymentMethod: 'Bank Transfer'
    },
  ];

  const filteredData = billingData.filter(item => 
    item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-success/10 text-success border-success/20';
      case 'Pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Overdue':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid':
        return 'CheckCircle';
      case 'Pending':
        return 'Clock';
      case 'Overdue':
        return 'AlertCircle';
      default:
        return 'Circle';
    }
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

  // Helper to parse currency string to number
  const parseAmount = (amountStr) => {
    if (!amountStr) return 0;
    return Number(amountStr.replace(/[^\d.-]+/g, ''));
  };

  // Calculate total amount
  const totalAmount = filteredData.reduce((sum, invoice) => sum + parseAmount(invoice.amount), 0);

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
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="modern-button border-border hover:border-primary"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Export
            </Button>
            <Button
              size="sm"
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
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Invoice</th>
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
                  <div className="font-body-medium text-text-primary">{invoice.id}</div>
                  <div className="text-sm text-text-secondary">{invoice.date}</div>
                </td>
                <td className="p-4">
                  <div className="font-body-medium text-text-primary">{invoice.customer}</div>
                  <div className="text-sm text-text-secondary">{invoice.paymentMethod}</div>
                </td>
                <td className="p-4">
                  <div className="font-body-medium text-text-primary">{invoice.vehicle}</div>
                </td>
                <td className="p-4">
                  <div className="font-body-medium text-text-primary">{invoice.service}</div>
                </td>
                <td className="p-4">
                  <div className="font-heading-medium text-text-primary">{invoice.amount}</div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body-medium border ${getStatusColor(invoice.status)}`}>
                    <Icon name={getStatusIcon(invoice.status)} size={12} className="mr-1" />
                    {invoice.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-sm text-text-primary">{invoice.dueDate}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="modern-button p-1 hover:bg-background"
                    >
                      <Icon name="Eye" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="modern-button p-1 hover:bg-background"
                    >
                      <Icon name="Edit" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="modern-button p-1 hover:bg-background"
                    >
                      <Icon name="Download" size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {/* Totals Row */}
            <tr className="bg-background/75 font-heading-medium text-text-primary">
              <td className="p-4" colSpan={5}></td>
              <td className="p-4 border-t border-border">
                Total: ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="p-4 border-t border-border" colSpan={3}></td>
            </tr>
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
    </div>
  );
};

export default BillingTable;