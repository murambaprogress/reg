import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';

const PersonalExpensesModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    vendor: '',
    amount: '',
    date: '',
    paymentMethod: '',
    receipt: null
  });

  const categories = [
    { value: 'travel', label: 'Travel', icon: 'Car' },
    { value: 'meals', label: 'Meals & Entertainment', icon: 'Coffee' },
    { value: 'office', label: 'Office Supplies', icon: 'FileText' },
    { value: 'professional', label: 'Professional Development', icon: 'BookOpen' },
    { value: 'communication', label: 'Communication', icon: 'Phone' },
    { value: 'other', label: 'Other', icon: 'DollarSign' }
  ];

  const paymentMethods = [
    'Personal Card',
    'Cash',
    'Bank Transfer',
    'PayPal',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, receipt: file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Personal expense submitted:', formData);
    onClose();
  };

  const handleReset = () => {
    setFormData({
      category: '',
      description: '',
      vendor: '',
      amount: '',
      date: '',
      paymentMethod: '',
      receipt: null
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-modal p-4">
      <div className="modern-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="User" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-heading-semibold text-text-primary">Add Personal Expense</h2>
              <p className="text-sm text-text-secondary">Record admin personal expenses</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="modern-button p-2 hover:bg-background"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-heading-medium text-text-primary">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                  className={`modern-button p-3 rounded-lg border text-left transition-all ${
                    formData.category === category.value
                      ? 'border-primary bg-primary/5 text-primary glow-selection' :'border-border hover:border-primary/50 hover:bg-background/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon name={category.icon} size={16} />
                    <span className="text-sm font-body-medium">{category.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-heading-medium text-text-primary">
              Description
            </label>
            <Input
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g., Client lunch meeting, Conference attendance..."
              className="modern-input"
              required
            />
          </div>

          {/* Vendor/Payee */}
          <div className="space-y-2">
            <label className="block text-sm font-heading-medium text-text-primary">
              Vendor/Payee
            </label>
            <Input
              name="vendor"
              value={formData.vendor}
              onChange={handleInputChange}
              placeholder="e.g., Restaurant XYZ, Delta Airlines..."
              className="modern-input"
              required
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-heading-medium text-text-primary">
                Amount
              </label>
              <Input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                className="modern-input"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-heading-medium text-text-primary">
                Date
              </label>
              <Input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="modern-input"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="block text-sm font-heading-medium text-text-primary">
              Payment Method
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="modern-input w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:border-primary focus:glow-selection"
              required
            >
              <option value="">Select payment method...</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-heading-medium text-text-primary">
              Receipt (Optional)
            </label>
            <div className="modern-input border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 hover:bg-background/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                id="receipt-upload"
              />
              <label
                htmlFor="receipt-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Icon name="Upload" size={24} className="text-text-secondary" />
                <div className="text-sm text-text-secondary">
                  <span className="font-body-medium text-primary">Click to upload</span> or drag and drop
                </div>
                <div className="text-xs text-text-secondary">PNG, JPG, PDF up to 10MB</div>
              </label>
              {formData.receipt && (
                <div className="mt-2 text-sm text-text-primary">
                  Selected: {formData.receipt.name}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="modern-button border-border hover:border-primary"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="modern-button hover:bg-background"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="modern-button bg-primary text-primary-foreground shadow-lg hover:shadow-xl"
            >
              <Icon name="Plus" size={16} className="mr-2" />
              Add Expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalExpensesModal;