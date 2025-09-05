import React from 'react';
import { useSales } from '../SalesContext';
import Button from '../../../components/ui/Button';

const SalesList = ({ onEdit = () => {}, onDelete = () => {} }) => {
  const { sales = [], totalSales = 0, removeSale } = useSales() || {};

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleDelete = async (saleId) => {
    if (window.confirm('Are you sure you want to delete this sale? This will restore the inventory quantities.')) {
      try {
        // Call the API to delete the sale
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api'}/sales/${saleId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete sale');
        }

        // Update local state
        if (removeSale) {
          removeSale(saleId);
        }
        
        // Call the parent callback
        onDelete(saleId);
      } catch (error) {
        console.error('Error deleting sale:', error);
        alert('Failed to delete sale: ' + error.message);
      }
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-text-secondary">{sales.length} transactions</div>
        <div className="text-lg font-heading-medium text-text-primary">Total: {formatCurrency(totalSales)}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background/50">
            <tr>
              <th className="p-4 text-left">#</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Items</th>
              <th className="p-4 text-left">Total</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sales.map((s, i) => (
              <tr key={s.id} className="hover:bg-background/50 micro-interaction">
                <td className="p-4">{i + 1}</td>
                <td className="p-4">{new Date(s.date).toLocaleString()}</td>
                <td className="p-4">{s.customer?.name || 'Walk-in'}</td>
                <td className="p-4">
                  {s.items?.map((it, idx) => (
                    <div key={`${it.part_number || it.name}-${idx}`} className="text-sm text-text-secondary">
                      {it.qty} x {it.name} @ {formatCurrency(Number(it.unit) || 0)}
                    </div>
                  ))}
                </td>
                <td className="p-4">{formatCurrency(Number(s.total) || 0)}</td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(s)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-error" onClick={() => handleDelete(s.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td className="p-6 text-text-secondary" colSpan={6}>No sales yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesList;
