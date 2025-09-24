import React, { useState, useEffect } from 'react';
import ContactForm from './ContactForm';
import ContactHistoryTable from './ContactHistoryTable';
import { fetchDebtorContacts } from '../../../../api/billing';
import { useNotification } from '../../../../hooks/useNotification';

const DebtorContact = ({ debtorId, debtorName }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await fetchDebtorContacts(debtorId);
      setContacts(data);
    } catch (error) {
      showNotification('Failed to fetch contact history', 'error');
      console.error('Error fetching contact history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [debtorId]);

  const handleContactAdded = () => {
    fetchContacts();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Contact Management - {debtorName}
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Add new contact records and view contact history.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h4 className="text-lg font-medium mb-4">New Contact Record</h4>
          <ContactForm debtorId={debtorId} onContactAdded={handleContactAdded} />
        </div>
        <div>
          <h4 className="text-lg font-medium mb-4">Contact History</h4>
          <ContactHistoryTable 
            contacts={contacts} 
            loading={loading} 
          />
        </div>
      </div>
    </div>
  );
};

export default DebtorContact;
