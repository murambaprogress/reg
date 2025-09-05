
import { useDebtors } from './DebtorContext';
import { useState } from 'react';

const stateColors = {
  overdue: 'bg-red-200 text-red-800',
  due: 'bg-yellow-200 text-yellow-800',
  paid: 'bg-green-200 text-green-800',
};

const PAGE_SIZE = 5;

const DebtorsTable = () => {
  const { debtors } = useDebtors();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const filtered = debtors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
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
  const totalAmount = filtered.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalPaid = filtered.reduce((sum, d) => sum + ((d.payments || []).reduce((pSum, p) => pSum + (p.amount || 0), 0)), 0);
  const totalDue = totalAmount - totalPaid;

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
          <button className="text-xs underline" onClick={() => handleSort('amount')}>Amount</button>
          <button className="text-xs underline" onClick={() => handleSort('dueDate')}>Due Date</button>
        </div>
      </div>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Products Supplied</th>
            <th className="py-2 px-4 border-b">Amount</th>
            <th className="py-2 px-4 border-b">State</th>
            <th className="py-2 px-4 border-b">Due Date</th>
          </tr>
        </thead>
        <tbody>
          {paginated.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-4 text-gray-400">No debtors found.</td></tr>
          ) : paginated.map(debtor => {
            const totalPaid = (debtor.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
            const amountDue = (debtor.amount || 0) - totalPaid;
            return (
              <tr key={debtor.id}>
                <td className="py-2 px-4 border-b">{debtor.name}</td>
                <td className="py-2 px-4 border-b">{debtor.productsSupplied || '-'}</td>
                <td className="py-2 px-4 border-b">
                  ${debtor.amount}
                  <div className="text-xs text-text-secondary mt-1">
                    Paid: <span className="text-green-700">${totalPaid}</span> <br />
                    Due: <span className="text-red-700">${amountDue}</span>
                  </div>
                </td>
                <td className={`py-2 px-4 border-b`}>
                  <span className={`px-2 py-1 rounded ${stateColors[debtor.state]}`}>{debtor.state}</span>
                </td>
                <td className="py-2 px-4 border-b">{debtor.dueDate}</td>
              </tr>
            );
          })}
          {/* Totals Row */}
          {filtered.length > 0 && (
            <tr className="bg-gray-100 font-heading-medium">
              <td className="py-2 px-4 text-right" colSpan={2}>Totals:</td>
              <td className="py-2 px-4 text-primary">
                ${totalAmount}
                <div className="text-xs text-text-secondary mt-1">
                  Paid: <span className="text-green-700">${totalPaid}</span> <br />
                  Due: <span className="text-red-700">${totalDue}</span>
                </div>
              </td>
              <td colSpan={2}></td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-50">Previous</button>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default DebtorsTable;
