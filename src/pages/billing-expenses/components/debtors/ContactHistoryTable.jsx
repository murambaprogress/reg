import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fetchDebtorContacts } from '../../../../api/billing';

const CONTACT_TYPE_LABELS = {
  phone: 'Phone Call',
  email: 'Email',
  letter: 'Letter',
  visit: 'In-Person Visit',
  sms: 'SMS',
};

const OUTCOME_LABELS = {
  no_answer: 'No Answer',
  promised_payment: 'Promised Payment',
  dispute: 'Dispute',
  payment_plan: 'Payment Plan Agreed',
  partial_payment: 'Partial Payment',
  full_payment: 'Full Payment',
  refused: 'Refused to Pay',
};

const ContactHistoryTable = ({ debtorId, onContactUpdate }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        const data = await fetchDebtorContacts(debtorId);
        setContacts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (debtorId) {
      loadContacts();
    }
  }, [debtorId, onContactUpdate]);

  if (loading) return <div className="animate-pulse">Loading contact history...</div>;
  if (error) return <div className="text-red-600">Error loading contacts: {error}</div>;
  if (!contacts.length) return <div className="text-gray-500">No contact history found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Outcome
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Notes
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact By
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {contacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(contact.contact_date), 'PP')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {CONTACT_TYPE_LABELS[contact.contact_type]}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOutcomeColor(contact.outcome)}`}>
                  {OUTCOME_LABELS[contact.outcome]}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                {contact.notes}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {contact.contacted_by_name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const getOutcomeColor = (outcome) => {
  switch (outcome) {
    case 'promised_payment':
    case 'payment_plan':
    case 'full_payment':
      return 'bg-green-100 text-green-800';
    case 'partial_payment':
      return 'bg-yellow-100 text-yellow-800';
    case 'no_answer':
      return 'bg-gray-100 text-gray-800';
    case 'dispute':
    case 'refused':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default ContactHistoryTable;