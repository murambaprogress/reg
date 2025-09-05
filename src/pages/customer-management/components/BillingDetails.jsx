import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BillingDetails = ({ customer }) => {
  const [activeTab, setActiveTab] = useState('invoices');

  if (!customer) {
    return (
      <div className="bg-surface rounded-lg border border-border h-full flex items-center justify-center">
        <div className="text-center">
          <Icon name="CreditCard" size={48} className="text-text-secondary mb-4 mx-auto" />
          <p className="text-text-secondary">Select a customer to view billing details</p>
        </div>
      </div>
    );
  }

  const invoices = customer.invoices || [];
  const payments = customer.payments || [];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInvoiceStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'overdue':
        return 'bg-error/10 text-error';
      case 'draft':
        return 'bg-text-secondary/10 text-text-secondary';
      default:
        return 'bg-text-secondary/10 text-text-secondary';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'credit-card':
        return 'CreditCard';
      case 'cash':
        return 'DollarSign';
      case 'check':
        return 'FileText';
      case 'bank-transfer':
        return 'Building';
      default:
        return 'DollarSign';
    }
  };

  const totalOutstanding = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="bg-surface rounded-lg border border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading-semibold text-text-primary">Billing Details</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              iconName="FileText"
              iconPosition="left"
              className="text-sm"
            >
              New Invoice
            </Button>
            <Button
              variant="primary"
              iconName="DollarSign"
              iconPosition="left"
              className="text-sm"
            >
              Record Payment
            </Button>
          </div>
        </div>

        {/* Billing Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-background rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Icon name="DollarSign" size={16} className="text-success" />
              <span className="text-sm text-text-secondary">Total Paid</span>
            </div>
            <p className="text-lg font-heading-semibold text-text-primary mt-1">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          
          <div className="bg-background rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} className="text-warning" />
              <span className="text-sm text-text-secondary">Outstanding</span>
            </div>
            <p className="text-lg font-heading-semibold text-text-primary mt-1">
              {formatCurrency(totalOutstanding)}
            </p>
          </div>
          
          <div className="bg-background rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Icon name="TrendingUp" size={16} className="text-accent" />
              <span className="text-sm text-text-secondary">Total Spent</span>
            </div>
            <p className="text-lg font-heading-semibold text-text-primary mt-1">
              {formatCurrency(customer.totalSpent)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'invoices', label: 'Invoices', icon: 'FileText' },
            { id: 'payments', label: 'Payment History', icon: 'DollarSign' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 text-sm font-body-medium border-b-2 micro-interaction ${
                activeTab === tab.id
                  ? 'border-accent text-accent' :'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'invoices' && (
          <div className="p-6">
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="FileText" size={48} className="text-text-secondary mb-4 mx-auto" />
                <h3 className="text-lg font-heading-medium text-text-primary mb-2">No Invoices</h3>
                <p className="text-text-secondary">No invoices found for this customer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="bg-background rounded-lg p-4 border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-body-medium text-text-primary">
                          Invoice #{invoice.invoiceNumber}
                        </h4>
                        <p className="text-sm text-text-secondary">
                          Job #{invoice.jobId} • {formatDate(invoice.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${getInvoiceStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                        <p className="text-lg font-body-medium text-text-primary mt-1">
                          {formatCurrency(invoice.amount)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {invoice.services?.map((service, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-text-secondary">{service.name}</span>
                          <span className="text-text-primary">{formatCurrency(service.cost)}</span>
                        </div>
                      ))}
                      
                      {invoice.parts?.map((part, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-text-secondary">
                            {part.name} (Qty: {part.quantity})
                          </span>
                          <span className="text-text-primary">{formatCurrency(part.cost)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
                      <div className="text-sm text-text-secondary">
                        Due: {formatDate(invoice.dueDate)}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" className="text-xs">
                          View PDF
                        </Button>
                        {invoice.status !== 'paid' && (
                          <Button variant="primary" className="text-xs">
                            Record Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="p-6">
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="DollarSign" size={48} className="text-text-secondary mb-4 mx-auto" />
                <h3 className="text-lg font-heading-medium text-text-primary mb-2">No Payments</h3>
                <p className="text-text-secondary">No payment history found for this customer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="bg-background rounded-lg p-4 border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-success/10 rounded-lg">
                          <Icon 
                            name={getPaymentMethodIcon(payment.method)} 
                            size={16} 
                            className="text-success" 
                          />
                        </div>
                        <div>
                          <h4 className="font-body-medium text-text-primary">
                            Payment #{payment.paymentNumber}
                          </h4>
                          <p className="text-sm text-text-secondary">
                            {formatDate(payment.date)} • {payment.method.replace('-', ' ')}
                          </p>
                          {payment.invoiceNumber && (
                            <p className="text-sm text-text-secondary">
                              For Invoice #{payment.invoiceNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-body-medium text-success">
                          {formatCurrency(payment.amount)}
                        </p>
                        {payment.reference && (
                          <p className="text-xs text-text-secondary font-data-normal">
                            Ref: {payment.reference}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingDetails;