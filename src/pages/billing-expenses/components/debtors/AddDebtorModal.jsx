import React, { useState } from 'react';
import { createDebtor } from '../../../../api/billing';
import { createCustomer } from '../../../../api/customers';
import { useNotification } from '../../../../hooks/useNotification';
import Icon from '../../../../components/AppIcon';


const AddDebtorModal = ({ isOpen, onClose, onSuccess, onError }) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    initial_amount: '',
    due_date: '',
    description: '',
    payment_terms: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.customer_name || !formData.initial_amount) {
      onError({ message: 'Customer name and initial amount are required' });
      return;
    }

    setLoading(true);
    try {
      // First, create or find the customer
      let customerId;
      try {
        // Try to create the customer
        const customerData = {
          name: formData.customer_name,
          phone: formData.customer_phone || '',
          email: formData.customer_email || '',
          address: ''
        };
        const customer = await createCustomer(customerData);
        customerId = customer.id;
      } catch (customerError) {
        // If customer creation fails (e.g., customer already exists), 
        // we'll need to search for the customer by name/phone
        // For now, we'll show an error and let the user handle it
        const errorMessage = customerError.response?.data?.error || 
                            customerError.message || 
                            'Failed to create customer. The customer may already exist.';
        throw new Error(errorMessage);
      }

      // Prepare debtor data for backend
      const debtorData = {
        customer: customerId,
        initial_amount: parseFloat(formData.initial_amount) || 0,
        current_balance: parseFloat(formData.initial_amount) || 0, // Same as initial amount
        due_date: formData.due_date || new Date().toISOString().split('T')[0],
        description: formData.description || `Debt for ${formData.customer_name}`,
        payment_terms: formData.payment_terms || '',
        notes: formData.notes || ''
      };

      const result = await createDebtor(debtorData);
      showNotification('Debtor added successfully', 'success');
      onSuccess(result);
      
      // Reset form
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        initial_amount: '',
        due_date: '',
        description: '',
        payment_terms: '',
        notes: ''
      });
      
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add debtor';
      showNotification(errorMessage, 'error');
      onError({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Debtor</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={loading}
          >
            <Icon name="X" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Customer Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email address"
                />
              </div>
            </div>

            {/* Debt Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Amount ($) *
              </label>
              <input
                type="number"
                name="initial_amount"
                value={formData.initial_amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description of services or goods"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <input
                type="text"
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Payment terms and conditions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Add Debtor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDebtorModal;
