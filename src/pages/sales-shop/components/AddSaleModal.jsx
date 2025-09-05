import React, { useEffect, useState, useCallback } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useSales } from '../SalesContext';
import { useInventory } from '../../inventory-management/InventoryContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

const getAuthToken = () => { try { return localStorage.getItem('token'); } catch (e) { return null; } };

const AddSaleModal = ({ isOpen, onClose, sale = null, onSaleAdded }) => {
  // Initialize all hooks first
  const [customer, setCustomer] = useState(sale?.customer?.name || '');
  const [customerId, setCustomerId] = useState(sale?.customer?.id ?? null);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState(sale?.items || [{ partNumber: '', name: '', qty: '', unit: 0 }]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get context values after hooks
  const salesContext = useSales();
  const { addSale, editSale } = salesContext || {};
  const inventoryContext = useInventory();
  const { parts } = inventoryContext || { parts: [] };

  // Debug inventory data
  useEffect(() => {
    console.log('Available parts:', parts);
  }, [parts]);

  // Handlers
  const handleItemChange = useCallback((index, key, value) => {
    setItems(items => {
      const next = [...items];
      next[index][key] = value;
      return next;
    });
  }, []);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { partNumber: '', name: '', qty: 1, unit: 0 }]);
  }, []);

  const removeItem = useCallback((index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Effect for form reset and customer fetch
  useEffect(() => {
    if (!isOpen) return;

    // Reset form state
    setCustomer(sale?.customer?.name || '');
    setCustomerId(sale?.customer?.id ?? null);
    // Map backend fields to frontend fields
    const mappedItems = sale?.items?.map(item => ({
      partNumber: item.part_number || '',
      name: item.name || '',
      qty: item.qty || '',
      unit: item.unit || 0
    })) || [{ partNumber: '', name: '', qty: '', unit: 0 }];
    setItems(mappedItems);
    setError(null);

    // Fetch customers list
    const fetchCustomers = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/customers/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch customers');
        const data = await response.json();
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, [isOpen, sale]);

  // Effect for total calculation
  useEffect(() => {
    const newTotal = items.reduce((sum, item) => 
      sum + (Number(item.qty || 0) * Number(item.unit || 0)), 0
    );
    setTotal(newTotal);
  }, [items]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!addSale || !editSale) {
      setError('Sales context not available');
      return;
    }

    // Validate items
    const validItems = items.filter(item => 
      item.partNumber && 
      item.name && 
      item.qty && 
      Number(item.qty) > 0
    );

    if (validItems.length === 0) {
      setError('At least one valid item with part number, name, and positive quantity is required');
      return;
    }

    // Validate stock levels (for new sales or when editing)
    for (const item of validItems) {
      const part = parts.find(p => (p.partNumber || p.part_number) === item.partNumber);
      if (!part) {
        setError(`Part ${item.partNumber} not found in inventory`);
        return;
      }
      // For edits, we need to account for the original sale's quantities
      let availableStock = part.currentStock || part.current_stock || 0;
      if (sale) {
        // Add back the original quantities for this part
        const originalItem = sale.items?.find(i => i.part_number === item.partNumber);
        if (originalItem) {
          availableStock += Number(originalItem.qty || 0);
        }
      }
      if (Number(item.qty) > availableStock) {
        setError(`Insufficient stock for ${item.partNumber}. Available: ${availableStock}`);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const saleData = {
        // Only send customer_id if a customer was selected from the dropdown
        ...(customerId ? { customer_id: customerId } : {}),
        // Always send customer_name if there's a name entered
        ...(customer ? { customer_name: customer } : {}),
        // Only send valid items
        items: validItems.map(item => ({
          part_number: item.partNumber,
          name: item.name,
          qty: Number(item.qty),
          unit: Number(item.unit || 0)
        }))
      };

      let result;
      if (sale) {
        // Editing existing sale
        result = await editSale(sale.id, saleData);
      } else {
        // Creating new sale
        result = await addSale(saleData);
      }
      
      if (onSaleAdded) {
        onSaleAdded(result);
      }
      onClose();
    } catch (err) {
      console.error('Sale operation error:', err);
      let errorMessage = sale ? 'Failed to update sale' : 'Failed to create sale';

      if (err.response) {
        const contentType = err.response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await err.response.json();
          // Handle different error formats
          if (data.items) {
            // Handle validation errors for items
            errorMessage = Object.values(data.items).join(', ');
          } else if (data.message) {
            errorMessage = data.message;
          } else if (typeof data === 'object') {
            errorMessage = Object.values(data).flat().join(', ');
          }
        } else {
          errorMessage = err.response.statusText;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [addSale, editSale, customerId, customer, items, onSaleAdded, onClose, sale, parts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-lg p-6 w-full max-w-2xl">
        <h3 className="text-lg font-heading-medium text-text-primary mb-4">{sale ? 'Edit Sale' : 'New Sale'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <div className="w-1/2">
              <Input 
                placeholder="Enter customer name" 
                value={customer} 
                onChange={(e) => {
                  setCustomer(e.target.value);
                  // Clear selected customer ID when typing
                  if (customerId) setCustomerId(null);
                }}
              />
              {customers.length > 0 && !customerId && (
                <div className="mt-1 text-xs text-text-secondary">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => {
                      const existingCustomer = customers.find(c => c.name.toLowerCase() === customer.toLowerCase());
                      if (existingCustomer) {
                        setCustomerId(existingCustomer.id);
                      }
                    }}
                  >
                    Check for existing customer
                  </button>
                </div>
              )}
            </div>
            {customers.length > 0 && (
              <select 
                value={customerId ?? ''} 
                onChange={(e) => { 
                  const val = e.target.value;
                  setCustomerId(val ? Number(val) : null);
                  const sel = customers.find(c => String(c.id) === val);
                  setCustomer(sel ? sel.name : '');
                }} 
                className="p-2 border border-border rounded w-1/2"
              >
                <option value="">Select existing customer (optional)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <select 
                  className="col-span-6 p-2 border border-border rounded" 
                  value={it.partNumber || ''} 
                  onChange={(e) => {
                    const pn = e.target.value;
                    const part = (parts || []).find(p => (p.partNumber || p.part_number) === pn) || null;
                    handleItemChange(idx, 'partNumber', pn);
                    handleItemChange(idx, 'name', part ? (part.description || part.name || '') : '');
                    handleItemChange(idx, 'unit', part ? (part.unitCost || part.unit_cost || 0) : 0);
                    // Reset quantity when part changes
                    handleItemChange(idx, 'qty', '');
                  }}
                >
                  <option value="">-- Select part from inventory --</option>
                  {(parts || [])
                    .filter(p => (p.currentStock || p.current_stock) > 0) // Only show items with stock
                    .map(p => (
                      <option key={p.partNumber || p.part_number} value={p.partNumber || p.part_number}>
                        {p.partNumber || p.part_number} — {p.description || p.name} (Stock: {p.currentStock || p.current_stock})
                      </option>
                    ))
                  }
                </select>
                <input 
                  className="col-span-6 p-2 border border-border rounded" 
                  placeholder="Item name" 
                  value={it.name} 
                  onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                  readOnly={!!it.partNumber} // Make read-only if part is selected
                />
                <input 
                  type="number" 
                  className="col-span-2 p-2 border border-border rounded" 
                  value={it.qty} 
                  onChange={(e) => {
                    const newQty = parseInt(e.target.value, 10);
                    const part = parts.find(p => (p.partNumber || p.part_number) === it.partNumber);
                    // Validate quantity against current stock
                    const currentStock = part ? (part.currentStock || part.current_stock || 0) : 0;
                    if (part && newQty > currentStock) {
                      setError(`Only ${currentStock} units available for ${it.partNumber}`);
                      return;
                    }
                    setError(null);
                    handleItemChange(idx, 'qty', e.target.value);
                  }}
                  min="1"
                  max={it.partNumber ? (parts.find(p => (p.partNumber || p.part_number) === it.partNumber)?.currentStock || parts.find(p => (p.partNumber || p.part_number) === it.partNumber)?.current_stock || 1) : undefined}
                  placeholder="Qty"
                />
                <input 
                  type="number" 
                  className="col-span-3 p-2 border border-border rounded" 
                  value={it.unit} 
                  onChange={(e) => handleItemChange(idx, 'unit', e.target.value)} 
                  placeholder="Unit price" 
                  step="0.01"
                  min="0"
                />
                <button className="col-span-1 p-2 text-sm text-error" onClick={() => removeItem(idx)}>Remove</button>
              </div>
            ))}
            <button className="text-sm text-primary" onClick={addItem}>+ Add item</button>
          </div>

          {error && <div className="text-red-500">{error}</div>}
          <div className="flex items-center justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Adding...' : (sale ? 'Update Sale' : 'Save Sale')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSaleModal;
