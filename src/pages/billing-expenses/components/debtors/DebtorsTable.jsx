import { useDebtors } from './DebtorContext';
import { useState, useMemo } from 'react';
import DebtorContact from './DebtorContact';
import ImportDebtorsModal from './ImportDebtorsModal';
import AddDebtorModal from './AddDebtorModal';
import axios from '../../../../utils/axios';

const stateColors = {
  overdue: 'bg-red-200 text-red-800',
  due: 'bg-yellow-200 text-yellow-800',
  paid: 'bg-green-200 text-green-800',
};

const PAGE_SIZE = 5;

const DebtorsTable = () => {
  const { debtors, loading, error, refetch } = useDebtors();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [addStatus, setAddStatus] = useState(null);

  const normalized = useMemo(() => (debtors || []).map(d => ({
    id: d.id,
    name: d.customer_name || d.name || 'Unknown',
    phone: d.customer_phone || '',
    amount: Number(d.current_balance || 0),
    initialAmount: Number(d.initial_amount || 0),
    status: d.status,
    dueDate: d.due_date || '',
    daysDue: d.days_due || 0,
    description: d.description || '',
    totalPaid: Number(d.total_paid || 0),
  })), [debtors]);

  const filtered = normalized.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.toLowerCase().includes(search.toLowerCase())
  );

  // Always sort by ascending dueDate (import date) first
  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.dueDate);
    const dateB = new Date(b.dueDate);
    if (dateA < dateB) return -1;
    if (dateA > dateB) return 1;
    // If dates are equal, fallback to sortKey
    if (a[sortKey] < b[sortKey]) return sortDir === 'asc' ? -1 : 1;
    if (a[sortKey] > b[sortKey]) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Calculate totals for all filtered debtors
  const totalOutstanding = filtered.reduce((sum, d) => sum + (d.amount || 0), 0);

  const handleImportSuccess = (result) => {
    setImportStatus({
      type: 'success',
      message: `Successfully imported ${result.success_count || 0} debtors`
    });
    refetch(); // Refresh the debtors list
    setTimeout(() => setImportStatus(null), 5000);
  };

  const handleImportError = (error) => {
    setImportStatus({
      type: 'error',
      message: error.message || 'Failed to import debtors'
    });
    setTimeout(() => setImportStatus(null), 5000);
  };

  const handleAddSuccess = (result) => {
    setAddStatus({
      type: 'success',
      message: 'Debtor added successfully'
    });
    refetch(); // Refresh the debtors list
    setTimeout(() => setAddStatus(null), 5000);
  };

  const handleAddError = (error) => {
    setAddStatus({
      type: 'error',
      message: error.message || 'Failed to add debtor'
    });
    setTimeout(() => setAddStatus(null), 5000);
  };

  const handleRecordPayment = async (debtor) => {
    const amount = prompt(`Enter payment amount for ${debtor.name} (Outstanding: $${debtor.amount.toFixed(2)}):`);
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount > debtor.amount) {
      alert('Payment amount cannot exceed outstanding balance');
      return;
    }

    try {
  const response = await axios.post(`billing/debtors/${debtor.id}/record_payment/`, {
        amount_paid: paymentAmount,
        payment_method: 'cash',
        payment_date: new Date().toISOString().split('T')[0],
        notes: `Payment recorded via web interface`
      });

      setAddStatus({
        type: 'success',
        message: `Payment of $${paymentAmount.toFixed(2)} recorded successfully. New balance: $${response.data.new_balance}`
      });
      refetch();
      setTimeout(() => setAddStatus(null), 5000);
    } catch (error) {
      setAddStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to record payment'
      });
      setTimeout(() => setAddStatus(null), 5000);
    }
  };

  const handleClearDebt = async (debtor) => {
    if (!confirm(`Are you sure you want to clear the debt for ${debtor.name}? This will mark the remaining balance of $${debtor.amount.toFixed(2)} as paid/written off.`)) {
      return;
    }

    try {
  const response = await axios.post(`billing/debtors/${debtor.id}/clear_debt/`, {
        payment_method: 'cash',
        notes: 'Debt cleared via web interface'
      });

      setAddStatus({
        type: 'success',
        message: `Debt cleared successfully for ${debtor.name}`
      });
      refetch();
      setTimeout(() => setAddStatus(null), 5000);
    } catch (error) {
      setAddStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to clear debt'
      });
      setTimeout(() => setAddStatus(null), 5000);
    }
  };

  return (
    <div>
      {/* Header with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h3 className="text-lg font-medium text-gray-900">Debtors Management</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Debtor
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Import from Excel/CSV
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {importStatus && (
        <div className={`mb-4 p-3 rounded-md ${
          importStatus.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {importStatus.message}
        </div>
      )}

      {addStatus && (
        <div className={`mb-4 p-3 rounded-md ${
          addStatus.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {addStatus.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
        <input
          className="border rounded px-2 py-1 w-full sm:w-64"
          placeholder="Search debtors..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          aria-label="Search debtors"
        />
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500">Sort by:</span>
          <button className="text-xs underline" onClick={() => handleSort('name')}>Name</button>
          <button className="text-xs underline" onClick={() => handleSort('amount')}>Outstanding</button>
          <button className="text-xs underline" onClick={() => handleSort('oldestInvoiceDate')}>Oldest</button>
        </div>
      </div>
      {error && (<div className="text-red-600 text-sm mb-2">{error}</div>)}
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Outstanding</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Due Date</th>
            <th className="py-2 px-4 border-b">Days Due</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={6} className="text-center py-4 text-gray-400">Loading...</td></tr>
          )}
          {!loading && paginated.length === 0 && (
            <tr><td colSpan={6} className="text-center py-4 text-gray-400">No debtors found.</td></tr>
          )}
          {!loading && paginated.map(debtor => (
            <tr key={debtor.id}>
              <td className="py-2 px-4 border-b">{debtor.name}</td>
              <td className="py-2 px-4 border-b">${debtor.amount.toFixed(2)}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 py-1 rounded text-xs ${
                  debtor.status === 'paid' ? 'bg-green-200 text-green-800' :
                  debtor.status === 'active' ? 'bg-blue-200 text-blue-800' :
                  debtor.daysDue < 0 ? 'bg-red-200 text-red-800' :
                  'bg-yellow-200 text-yellow-800'
                }`}>
                  {debtor.status === 'paid' ? 'Paid' :
                   debtor.status === 'active' ? 'Active' :
                   debtor.daysDue < 0 ? 'Overdue' : 'Due'}
                </span>
              </td>
              <td className="py-2 px-4 border-b">{debtor.dueDate || '-'}</td>
              <td className="py-2 px-4 border-b">
                <span className={`${debtor.daysDue < 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                  {debtor.daysDue < 0 ? `${Math.abs(debtor.daysDue)} overdue` : `${debtor.daysDue} days`}
                </span>
              </td>
              <td className="py-2 px-4 border-b">
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setSelectedDebtor(debtor);
                      setShowContactModal(true);
                    }}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Contact
                  </button>
                  {debtor.amount > 0 && (
                    <>
                      <button
                        onClick={() => handleRecordPayment(debtor)}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Payment
                      </button>
                      <button
                        onClick={() => handleClearDebt(debtor)}
                        className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {/* Totals Row */}
          {!loading && filtered.length > 0 && (
            <tr className="bg-gray-100 font-heading-medium">
              <td className="py-2 px-4 text-right" colSpan={1}>Totals:</td>
              <td className="py-2 px-4 text-primary">${totalOutstanding.toFixed(2)}</td>
              <td colSpan={3}></td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-500">Page {page} of {totalPages || 1}</span>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-50">Previous</button>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
      
      {/* Import Modal */}
      <ImportDebtorsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
        onError={handleImportError}
      />

      {/* Add Debtor Modal */}
      <AddDebtorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        onError={handleAddError}
      />

      {showContactModal && selectedDebtor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium">Contact Management</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <DebtorContact 
                debtorId={selectedDebtor.id} 
                debtorName={selectedDebtor.name} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtorsTable;
