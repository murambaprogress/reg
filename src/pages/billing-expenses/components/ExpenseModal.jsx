import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useBilling } from '../BillingContext';

const ExpenseModal = ({ isOpen, onClose, expense = null, mode = 'create', expenseType = 'business' }) => {
  const { createExpense, updateExpense, loading } = useBilling();
  const [jobs, setJobs] = useState([]);
  const [formData, setFormData] = useState({
    expense_id: '',
    expense_type: expenseType,
    category: '',
    description: '',
    vendor: '',
    amount: '',
    tax_amount: '0',
    status: 'pending',
    payment_method: 'pending',
    expense_date: '',
    due_date: '',
    receipt_url: '',
    notes: '',
    related_job: ''
  });
  const [errors, setErrors] = useState({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  // Category options based on expense type
  const getCategoryOptions = () => {
    if (expenseType === 'business') {
      return [
        { value: 'parts_supplies', label: 'Parts & Supplies' },
        { value: 'utilities', label: 'Utilities' },
        { value: 'equipment', label: 'Equipment' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'insurance', label: 'Insurance' },
        { value: 'rent', label: 'Rent' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'other', label: 'Other' }
      ];
    } else {
      return [
        { value: 'travel', label: 'Travel' },
        { value: 'meals', label: 'Meals' },
        { value: 'office_supplies', label: 'Office Supplies' },
        { value: 'professional_dev', label: 'Professional Development' },
        { value: 'other', label: 'Other' }
      ];
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const paymentMethodOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' }
  ];

  // Fetch jobs for business expenses
  useEffect(() => {
    if (isOpen && expenseType === 'business') {
      fetchJobs();
    }
  }, [isOpen, expenseType]);

  // Populate form when editing
  useEffect(() => {
    if (expense && mode === 'edit') {
      setFormData({
        expense_id: expense.expense_id || '',
        expense_type: expense.expense_type || expenseType,
        category: expense.category || '',
        description: expense.description || '',
        vendor: expense.vendor || '',
        amount: expense.amount || '',
        tax_amount: expense.tax_amount || '0',
        status: expense.status || 'pending',
        payment_method: expense.payment_method || 'pending',
        expense_date: expense.expense_date || '',
        due_date: expense.due_date || '',
        receipt_url: expense.receipt_url || '',
        notes: expense.notes || '',
        related_job: expense.related_job || ''
      });
    } else if (mode === 'create') {
      // Generate expense ID for new expenses
      const expenseId = `EXP-${Date.now()}`;
      setFormData(prev => ({
        ...prev,
        expense_id: expenseId,
        expense_type: expenseType,
        expense_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      }));
    }
  }, [expense, mode, expenseType, isOpen]);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/jobs/`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.expense_id.trim()) {
      newErrors.expense_id = 'Expense ID is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.vendor.trim()) {
      newErrors.vendor = 'Vendor is required';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!formData.expense_date) {
      newErrors.expense_date = 'Expense date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        tax_amount: parseFloat(formData.tax_amount) || 0
      };

      if (mode === 'create') {
        await createExpense(expenseData);
      } else {
        await updateExpense(expense.id, expenseData);
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      expense_id: '',
      expense_type: expenseType,
      category: '',
      description: '',
      vendor: '',
      amount: '',
      tax_amount: '0',
      status: 'pending',
      payment_method: 'pending',
      expense_date: '',
      due_date: '',
      receipt_url: '',
      notes: '',
      related_job: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-heading-semibold text-text-primary">
            {mode === 'create' ? `Create New ${expenseType === 'business' ? 'Business' : 'Personal'} Expense` : 'Edit Expense'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="modern-button p-2 hover:bg-background"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Expense ID *
                </label>
                <Input
                  name="expense_id"
                  value={formData.expense_id}
                  onChange={handleInputChange}
                  className="modern-input"
                  error={errors.expense_id}
                />
              </div>
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="modern-input w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:border-primary focus:glow-selection"
                >
                  <option value="">Select Category</option>
                  {getCategoryOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-error text-sm mt-1">{errors.category}</p>
                )}
              </div>
            </div>

            {/* Description and Vendor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Description *
                </label>
                <Input
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="modern-input"
                  placeholder="Expense description"
                  error={errors.description}
                />
              </div>
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Vendor *
                </label>
                <Input
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  className="modern-input"
                  placeholder="Vendor name"
                  error={errors.vendor}
                />
              </div>
            </div>

            {/* Amount and Tax */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Amount *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="modern-input"
                  placeholder="0.00"
                  error={errors.amount}
                />
              </div>
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Tax Amount
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  name="tax_amount"
                  value={formData.tax_amount}
                  onChange={handleInputChange}
                  className="modern-input"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Status and Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="modern-input w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:border-primary focus:glow-selection"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Payment Method
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  className="modern-input w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:border-primary focus:glow-selection"
                >
                  {paymentMethodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Expense Date *
                </label>
                <Input
                  type="date"
                  name="expense_date"
                  value={formData.expense_date}
                  onChange={handleInputChange}
                  className="modern-input"
                  error={errors.expense_date}
                />
              </div>
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Due Date
                </label>
                <Input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="modern-input"
                />
              </div>
            </div>

            {/* Related Job (for business expenses) */}
            {expenseType === 'business' && (
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Related Job (Optional)
                </label>
                <select
                  name="related_job"
                  value={formData.related_job}
                  onChange={handleInputChange}
                  className="modern-input w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:border-primary focus:glow-selection"
                >
                  <option value="">Select Job</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.service_description} - {job.customer_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Receipt URL */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Receipt URL
              </label>
              <Input
                type="url"
                name="receipt_url"
                value={formData.receipt_url}
                onChange={handleInputChange}
                className="modern-input"
                placeholder="https://example.com/receipt.pdf"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="modern-input w-full px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:border-primary focus:glow-selection resize-none"
                placeholder="Additional notes..."
              />
            </div>

            {/* Total Summary */}
            <div className="modern-card p-4 bg-background/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Total Amount (including tax):</span>
                <span className="text-lg font-heading-medium text-text-primary">
                  ${((parseFloat(formData.amount) || 0) + (parseFloat(formData.tax_amount) || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-border bg-background/25">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="modern-button border-border hover:border-primary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="modern-button bg-primary text-primary-foreground"
          >
            {loading ? (
              <>
                <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                {mode === 'create' ? 'Create Expense' : 'Update Expense'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;
