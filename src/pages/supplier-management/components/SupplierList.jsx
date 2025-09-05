
import React, { useState } from 'react';
import { useSuppliers } from '../SupplierContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import EditSupplierModal from './EditSupplierModal';
import ConfirmModal from './ConfirmModal';

const PAGE_SIZE = 8;

const SupplierList = () => {
  const { suppliers, updateSupplier, deleteSupplier } = useSuppliers();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = (suppliers || []).filter(s => {
    const name = (s && s.name) ? String(s.name) : '';
    const contact = (s && s.contact) ? String(s.contact) : '';
    const phone = (s && s.phone) ? String(s.phone) : '';
    const q = String(search || '').toLowerCase();
    return name.toLowerCase().includes(q) || contact.toLowerCase().includes(q) || phone.includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = a && a[sortKey] !== undefined && a[sortKey] !== null ? a[sortKey] : '';
    const vb = b && b[sortKey] !== undefined && b[sortKey] !== null ? b[sortKey] : '';
    // coerce to string/number compare if possible
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
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

  const getStateColor = (state) => {
    switch (state) {
      case 'due': return 'bg-warning text-warning-foreground';
      case 'overdue': return 'bg-error text-error-foreground';
      case 'paid': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-text-secondary';
    }
  };

  // Calculate totals for all filtered suppliers
  const totalAmount = filtered.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalPaid = filtered.reduce((sum, s) => sum + ((s.payments || []).reduce((pSum, p) => pSum + (p.amount || 0), 0)), 0);
  const totalDue = totalAmount - totalPaid;

  return (
    <div className="flex flex-col">
      {/* Search, Sort, Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <div className="relative w-full sm:w-80">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
          <Input
            type="search"
            placeholder="Search suppliers..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-text-secondary">Sort by:</span>
          <Button variant="ghost" size="sm" onClick={() => handleSort('name')}>Name</Button>
          <Button variant="ghost" size="sm" onClick={() => handleSort('amount')}>Amount</Button>
          <Button variant="ghost" size="sm" onClick={() => handleSort('dueDate')}>Due Date</Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-heading-medium text-text-secondary uppercase tracking-wider">Name</th>
              <th className="py-3 px-4 text-left text-xs font-heading-medium text-text-secondary uppercase tracking-wider">Contact</th>
              <th className="py-3 px-4 text-left text-xs font-heading-medium text-text-secondary uppercase tracking-wider">Phone</th>
              <th className="py-3 px-4 text-left text-xs font-heading-medium text-text-secondary uppercase tracking-wider">Products Supplied</th>
              <th className="py-3 px-4 text-left text-xs font-heading-medium text-text-secondary uppercase tracking-wider">Amount</th>
              <th className="py-3 px-4 text-left text-xs font-heading-medium text-text-secondary uppercase tracking-wider">State</th>
              <th className="py-3 px-4 text-left text-xs font-heading-medium text-text-secondary uppercase tracking-wider">Due Date</th>
              <th className="py-3 px-4 text-left text-xs font-heading-medium text-text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border">
            {paginated.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-text-secondary">No suppliers found.</td></tr>
            ) : paginated.map(supplier => {
              const totalPaid = (supplier.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
              const amountDue = (supplier.amount || 0) - totalPaid;
              return (
                <tr key={supplier.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 font-body-medium text-text-primary">{supplier.name}</td>
                  <td className="py-3 px-4 text-text-secondary">{supplier.contact}</td>
                  <td className="py-3 px-4 text-text-secondary">{supplier.phone}</td>
                  <td className="py-3 px-4 text-text-secondary">{supplier.productsSupplied || '-'}</td>
                  <td className="py-3 px-4 text-text-primary">
                    ${supplier.amount}
                    <div className="text-xs text-text-secondary mt-1">
                      Paid: <span className="text-success">${totalPaid}</span> <br />
                      Due: <span className="text-error">${amountDue}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-body-medium ${getStateColor(supplier.state)}`}>
                      {supplier.state}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-text-secondary">{supplier.dueDate}</td>
                  <td className="py-3 px-4 text-text-secondary">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingSupplier(supplier); setShowEditModal(true); }}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => { setDeletingSupplier(supplier); setShowConfirm(true); }}>Delete</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {/* Totals Row */}
            {filtered.length > 0 && (
              <tr className="bg-muted font-heading-medium">
                <td className="py-3 px-4 text-right" colSpan={4}>Totals:</td>
                <td className="py-3 px-4 text-primary">
                  ${totalAmount}
                  <div className="text-xs text-text-secondary mt-1">
                    Paid: <span className="text-success">${totalPaid}</span> <br />
                    Due: <span className="text-error">${totalDue}</span>
                  </div>
                </td>
                <td colSpan={3}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </Button>
          <span className="text-xs text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      <EditSupplierModal
        isOpen={showEditModal}
        supplier={editingSupplier}
        onClose={() => { setShowEditModal(false); setEditingSupplier(null); }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        title="Delete supplier"
        message={deletingSupplier ? `Are you sure you want to delete ${deletingSupplier.name}? This cannot be undone.` : 'Are you sure?'}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onClose={() => { if (!deleting) { setShowConfirm(false); setDeletingSupplier(null); } }}
        onConfirm={async () => {
          if (!deletingSupplier) return;
          try {
            setDeleting(true);
            await deleteSupplier(deletingSupplier.id);
          } catch (e) {
            // swallow, context shows toast
          } finally {
            setDeleting(false);
            setShowConfirm(false);
            setDeletingSupplier(null);
          }
        }}
      />
    </div>
  );
};

export default SupplierList;
