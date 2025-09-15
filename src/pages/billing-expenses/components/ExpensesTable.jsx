import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useBilling } from '../BillingContext';
import ExpenseModal from './ExpenseModal';
import DeleteConfirmModal from './DeleteConfirmModal';

const ExpensesTable = ({ searchTerm, dateRange, isPersonal = false }) => {
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const { expenses, loading, error, deleteExpense, getExpense, markExpensePaid } = useBilling();

  const expensesData = expenses || [];

  const filteredData = expensesData.filter(item => {
    const searchLower = searchTerm?.toLowerCase() || '';
    return (
      item.category?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.vendor?.toLowerCase().includes(searchLower) ||
      item.expense_id?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate total amount
  const totalAmount = filteredData.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
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
      case 'pending':
        return 'Clock';
      case 'overdue':
        return 'AlertCircle';
      case 'cancelled':
        return 'XCircle';
      default:
        return 'Circle';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'parts_supplies':
        return 'Package';
      case 'utilities':
        return 'Zap';
      case 'equipment':
        return 'Wrench';
      case 'maintenance':
        return 'Settings';
      case 'travel':
        return 'Car';
      case 'meals':
        return 'Coffee';
      case 'office_supplies':
        return 'FileText';
      case 'professional_dev':
        return 'BookOpen';
      case 'insurance':
        return 'Shield';
      case 'rent':
        return 'Home';
      case 'marketing':
        return 'Megaphone';
      default:
        return 'DollarSign';
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

  const formatCategory = (category) => {
    if (!category) return 'Other';
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

  const handleCreateExpense = () => {
    setSelectedExpense(null);
    setModalMode('create');
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = async (expense) => {
    try {
      // Fetch full expense details for editing
      const fullExpense = await getExpense(expense.id);
      setSelectedExpense(fullExpense);
      setModalMode('edit');
      setIsExpenseModalOpen(true);
    } catch (error) {
      console.error('Error fetching expense details:', error);
    }
  };

  const handleDeleteExpense = (expense) => {
    setSelectedExpense(expense);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteExpense = async () => {
    try {
      await deleteExpense(selectedExpense.id);
      setIsDeleteModalOpen(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedExpenses.length === 0) return;
    
    try {
      await Promise.all(selectedExpenses.map(id => deleteExpense(id)));
      setSelectedExpenses([]);
    } catch (error) {
      console.error('Error deleting expenses:', error);
    }
  };

  const handleMarkPaid = async (expense) => {
    try {
      await markExpensePaid(expense.id, {
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: expense.payment_method || 'cash'
      });
    } catch (error) {
      console.error('Error marking expense as paid:', error);
    }
  };

  // Export filtered expenses to CSV
  const handleExport = () => {
    if (filteredData.length === 0) return;
    const headers = [
      'Expense ID','Type','Category','Description','Vendor','Amount','Tax Amount','Status','Payment Method','Expense Date','Due Date','Paid Date'
    ];
    const rows = filteredData.map(exp => [
      exp.expense_id,
      exp.expense_type,
      exp.category,
      (exp.description || '').replace(/\n/g,' '),
      exp.vendor,
      exp.amount,
      exp.tax_amount,
      exp.status,
      exp.payment_method,
      exp.expense_date,
      exp.due_date || '',
      exp.paid_date || ''
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
    a.download = `expenses_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadExpense = async (expense) => {
    try {
      const full = await getExpense(expense.id);
      if (!full) throw new Error('No expense data');
      if (typeof jsPDF === 'function' && !jsPDF.API.autoTable) {
        try { await import('jspdf-autotable'); } catch (e) { console.warn('autoTable dynamic import failed', e); }
      }
      const doc = new jsPDF({ unit: 'pt' });
      const left = 40;
      let y = 50;
      doc.setFontSize(18);
      doc.text(`EXPENSE ${full.expense_id}`, left, y);
      doc.setFontSize(10);
      y += 20;
      doc.text(`Date: ${full.expense_date || ''}`, left, y); y += 14;
      if (full.due_date) { doc.text(`Due: ${full.due_date}`, left, y); y += 14; }
      if (full.paid_date) { doc.text(`Paid: ${full.paid_date}`, left, y); y += 14; }
      y += 6;
      doc.setFontSize(12);
      doc.text('Vendor / Category', left, y); y += 14;
      doc.setFontSize(10);
      doc.text(`${full.vendor || ''}  |  ${formatCategory(full.category)}`, left, y); y += 18;
      doc.setFontSize(12);
      doc.text('Description', left, y); y += 14;
      doc.setFontSize(10);
      const descLines = doc.splitTextToSize(full.description || '', 520);
      doc.text(descLines, left, y);
      y += descLines.length * 12 + 12;
      // Summary table
      const tableBody = [
        ['Amount', formatCurrency(full.amount)],
        ['Tax', formatCurrency(full.tax_amount)],
        ['Status', formatStatus(full.status)],
        ['Payment Method', formatCategory(full.payment_method || 'pending')]
      ];
      if (doc.autoTable) {
        doc.autoTable({
          head: [['Field','Value']],
          body: tableBody,
          startY: y,
          styles: { fontSize: 9, cellPadding: 4 },
          headStyles: { fillColor: [30,41,59] }
        });
        y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : y + 20;
      } else {
        tableBody.forEach(row => { doc.text(`${row[0]}: ${row[1]}`, left, y); y += 12; });
      }
      if (full.notes) {
        doc.setFontSize(12); doc.text('Notes', left, y); y += 14; doc.setFontSize(10);
        const noteLines = doc.splitTextToSize(full.notes, 520);
        doc.text(noteLines, left, y); y += noteLines.length * 12 + 10;
      }
      doc.setFontSize(9);
      doc.text('Generated by System', left, y + 20);
      doc.save(`expense_${full.expense_id}.pdf`);
    } catch (e) {
      console.error('Failed to download expense:', e);
      alert('Expense PDF generation failed. Check console for details.');
    }
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
            {selectedExpenses.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-text-secondary">
                  {selectedExpenses.length} selected
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
              onClick={handleCreateExpense}
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
                  <div className="font-body-medium text-text-primary">{expense.expense_id}</div>
                  <div className="text-sm text-text-secondary">{formatDate(expense.expense_date)}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name={getCategoryIcon(expense.category)} size={14} className="text-primary" />
                    </div>
                    <div className="font-body-medium text-text-primary">{formatCategory(expense.category)}</div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-body-medium text-text-primary truncate max-w-xs" title={expense.description}>
                    {expense.description || 'N/A'}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-body-medium text-text-primary">{expense.vendor}</div>
                  <div className="text-sm text-text-secondary">{formatCategory(expense.payment_method || 'pending')}</div>
                </td>
                <td className="p-4">
                  <div className="font-heading-medium text-text-primary">{formatCurrency(expense.amount)}</div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body-medium border ${getStatusColor(expense.status)}`}>
                    <Icon name={getStatusIcon(expense.status)} size={12} className="mr-1" />
                    {formatStatus(expense.status)}
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
                      onClick={() => handleEditExpense(expense)}
                      className="modern-button p-1 hover:bg-background"
                      title="Edit Expense"
                    >
                      <Icon name="Edit" size={16} />
                    </Button>
                    {expense.status !== 'paid' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkPaid(expense)}
                        className="modern-button p-1 hover:bg-success/10 text-success"
                        title="Mark as Paid"
                      >
                        <Icon name="CheckCircle" size={16} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteExpense(expense)}
                      className="modern-button p-1 hover:bg-error/10 text-error"
                      title="Delete Expense"
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadExpense(expense)}
                      className="modern-button p-1 hover:bg-background"
                      title="Download Expense (PDF)"
                    >
                      <Icon name="Download" size={16} />
                    </Button>
                    {expense.receipt_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="modern-button p-1 hover:bg-background"
                        title="View Receipt"
                        onClick={() => window.open(expense.receipt_url, '_blank')}
                      >
                        <Icon name="Paperclip" size={16} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-text-secondary">
                  <Icon name="Receipt" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No expenses found</p>
                  {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-text-secondary">
                  <Icon name="Loader" size={24} className="mx-auto mb-2 animate-spin" />
                  <p>Loading expenses...</p>
                </td>
              </tr>
            )}
            {/* Totals Row */}
            {filteredData.length > 0 && (
              <tr className="bg-background/75 font-heading-medium text-text-primary">
                <td className="p-4" colSpan={5}></td>
                <td className="p-4 border-t border-border">
                  Total: {formatCurrency(totalAmount)}
                </td>
                <td className="p-4 border-t border-border" colSpan={2}></td>
              </tr>
            )}
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

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expense={selectedExpense}
        mode={modalMode}
        expenseType={isPersonal ? 'personal' : 'business'}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this expense?"
        itemName={selectedExpense ? `${selectedExpense.expense_id} - ${selectedExpense.description}` : ''}
        loading={loading}
      />
    </div>
  );
};

export default ExpensesTable;
