
import { useDebtors } from './DebtorContext';
import { useState, useMemo } from 'react';

const stateColors = {
  overdue: 'bg-red-200 text-red-800',
  due: 'bg-yellow-200 text-yellow-800',
  paid: 'bg-green-200 text-green-800',
};

const PAGE_SIZE = 5;

const DebtorsTable = () => {
  const { debtors, loading, error } = useDebtors();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const normalized = useMemo(() => (debtors || []).map(d => ({
    id: d.id,
    name: d.customer_name || d.name || 'Unknown',
    phone: d.customer_phone || '',
    amount: Number(d.total_outstanding || 0),
    status: d.status,
    oldestInvoiceDate: d.oldest_invoice_date || '',
    daysOverdue: d.days_overdue || 0,
  })), [debtors]);

  const filtered = normalized.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
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

  return (
    <div>
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
            <th className="py-2 px-4 border-b">Oldest Invoice</th>
            <th className="py-2 px-4 border-b">Days Overdue</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={8} className="text-center py-4 text-gray-400">Loading...</td></tr>
          )}
          {!loading && paginated.length === 0 && (
            <tr><td colSpan={8} className="text-center py-4 text-gray-400">No debtors found.</td></tr>
          )}
          {!loading && paginated.map(debtor => (
            <tr key={debtor.id}>
              <td className="py-2 px-4 border-b">{debtor.name}</td>
              <td className="py-2 px-4 border-b">${debtor.amount.toFixed(2)}</td>
              <td className="py-2 px-4 border-b">
                <span className={`px-2 py-1 rounded ${stateColors[debtor.status in stateColors ? debtor.status : (debtor.amount>0?'overdue':'paid')]}`}>{debtor.status || (debtor.amount>0?'overdue':'paid')}</span>
              </td>
              <td className="py-2 px-4 border-b">{debtor.oldestInvoiceDate || '-'}</td>
              <td className="py-2 px-4 border-b">{debtor.daysOverdue}</td>
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
    </div>
  );
};

export default DebtorsTable;
