import React, { useState } from 'react';
import { useNotification } from '../../../../hooks/useNotification';
import { addDebtorContact } from '../../../../api/billing';

const ContactForm = ({ debtorId, onContactAdded }) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    contact_type: 'PHONE',
    notes: '',
    outcome: 'PENDING',
    follow_up_date: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDebtorContact(debtorId, formData);
      showNotification('Contact record added successfully', 'success');
      setFormData({
        contact_type: 'PHONE',
        notes: '',
        outcome: 'PENDING',
        follow_up_date: '',
      });
      if (onContactAdded) {
        onContactAdded();
      }
    } catch (error) {
      showNotification('Failed to add contact record', 'error');
      console.error('Error adding contact record:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700">Contact Type</label>
        <select
          name="contact_type"
          value={formData.contact_type}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="PHONE">Phone</option>
          <option value="EMAIL">Email</option>
          <option value="SMS">SMS</option>
          <option value="LETTER">Letter</option>
          <option value="IN_PERSON">In Person</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter contact details..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Outcome</label>
        <select
          name="outcome"
          value={formData.outcome}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="PENDING">Pending</option>
          <option value="SUCCESSFUL">Successful</option>
          <option value="NO_ANSWER">No Answer</option>
          <option value="CALLBACK_REQUESTED">Callback Requested</option>
          <option value="PROMISE_TO_PAY">Promise to Pay</option>
          <option value="DISPUTED">Disputed</option>
          <option value="WRONG_CONTACT">Wrong Contact</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
        <input
          type="date"
          name="follow_up_date"
          value={formData.follow_up_date}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Add Contact Record
      </button>
    </form>
  );
};

export default ContactForm;