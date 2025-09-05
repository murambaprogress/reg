import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ExpensesTable = ({ searchTerm, dateRange, isPersonal = false }) => {
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  // Expenses data should be provided from backend or context
  const expensesData = [];

  const filteredData = expensesData.filter(item => 
    item.category?.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
    item.description?.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
    item.vendor?.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
    item.id?.toLowerCase().includes(searchTerm?.toLowerCase() || '')
  );

  // Helper to parse currency string to number
  const parseAmount = (amountStr) => {
    if (!amountStr) return 0;
    return Number(amountStr.replace(/[^\d.-]+/g, ''));
  };

  // Calculate total amount
  const totalAmount = filteredData.reduce((sum, expense) => sum + parseAmount(expense.amount), 0);

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

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Parts & Supplies':
        return 'Package';
      case 'Utilities':
        return 'Zap';
      case 'Equipment':
        return 'Wrench';
      case 'Maintenance':
        return 'Settings';
      case 'Travel':
        return 'Car';
      case 'Meals':
        return 'Coffee';
      case 'Office Supplies':
        return 'FileText';
      case 'Professional Dev':
        return 'BookOpen';
      default:
        return 'DollarSign';
    }
  };

  const handleSelectExpense = (expenseId) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const handleSelectAll = () => {
    setSelectedExpenses(
      selectedExpenses.length === filteredData.length 
        ? [] 
        : filteredData.map(item => item.id)
    );
  };

  return (
    <div className="overflow-hidden">
      {/* Table Header with Actions */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-heading-medium text-text-primary">
              {isPersonal ? 'Personal Admin Expenses' : 'Business Expenses'}
            </h3>
            <span className="text-sm text-text-secondary">
              {filteredData.length} expenses
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
              Add Expense
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
                  checked={selectedExpenses.length === filteredData.length}
                  onChange={handleSelectAll}
                  className="modern-input w-4 h-4 text-primary border-border rounded"
                />
              </th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Expense</th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Category</th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Description</th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Vendor</th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Amount</th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Status</th>
              <th className="p-4 text-left text-sm font-heading-medium text-text-primary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredData.map((expense) => (
              <tr key={expense.id} className="micro-interaction hover:bg-background/50">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.includes(expense.id)}
                    onChange={() => handleSelectExpense(expense.id)}
                    className="modern-input w-4 h-4 text-primary border-border rounded"
                  />
                </td>
                <td className="p-4">
                  <div className="font-body-medium text-text-primary">{expense.id}</div>
                  <div className="text-sm text-text-secondary">{expense.date}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name={getCategoryIcon(expense.category)} size={14} className="text-primary" />
                    </div>
                    <div className="font-body-medium text-text-primary">{expense.category}</div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-body-medium text-text-primary">{expense.description}</div>
                </td>
                <td className="p-4">
                  <div className="font-body-medium text-text-primary">{expense.vendor}</div>
                  <div className="text-sm text-text-secondary">{expense.paymentMethod}</div>
                </td>
                <td className="p-4">
                  <div className="font-heading-medium text-text-primary">{expense.amount}</div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body-medium border ${getStatusColor(expense.status)}`}>
                    <Icon name={getStatusIcon(expense.status)} size={12} className="mr-1" />
                    {expense.status}
                  </span>
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
                    {expense.receipt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="modern-button p-1 hover:bg-background"
                      >
                        <Icon name="Paperclip" size={16} />
                      </Button>
                    )}
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
              <td className="p-4 border-t border-border" colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-6 border-t border-border bg-background/25">
        <div className="flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            Showing {filteredData.length} of {expensesData.length} expenses
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

export default ExpensesTable;