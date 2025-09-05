import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useInventory } from '../../pages/inventory-management/InventoryContext';
import { useUser } from '../../components/UserContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

const getAuthToken = () => { try { return localStorage.getItem('token'); } catch (e) { return null; } };

const SalesContext = createContext();

export const useSales = () => useContext(SalesContext);

export const SalesProvider = ({ children }) => {
  const { user, loading: authLoading } = useUser();
  const inventoryContext = useInventory();
  const { parts = [], setParts = () => {} } = inventoryContext || {};
  
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sales from API only when authenticated
  useEffect(() => {
    const fetchSales = async () => {
      // Only fetch if we have completed auth loading and have a user token
      if (authLoading || !user?.token) {
        return;
      }

      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        
        const response = await fetch(`${API_BASE}/sales/`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch sales data');
        }
        
        const data = await response.json();
        setSales(Array.isArray(data) ? data : []);
      } catch (err) {
        setSales([]); // Reset sales on error
        setError(err.message);
        console.error('Error fetching sales:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [user?.token, authLoading]);

  const addSale = async (saleData) => {
    // Validate inventory first
    for (const item of saleData.items || []) {
      const part = parts.find(p => p.partNumber === item.part_number);
      if (part && Number(part.currentStock || 0) < Number(item.qty || 0)) {
        throw new Error(`Insufficient stock for ${item.part_number}`);
      }
    }

    try {
      if (!user?.token) {
        throw new Error('You must be logged in to create a sale');
      }

      const response = await fetch(`${API_BASE}/sales/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...saleData,
          total: saleData.items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unit || 0)), 0)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create sale');
      }

      const newSale = await response.json();
      setSales(prev => [newSale, ...prev]);

      // Update inventory
      const updatedParts = parts.map(p => {
        const soldQty = newSale.items?.reduce((sum, item) => 
          item.part_number === p.partNumber ? sum + Number(item.qty || 0) : sum, 0);
        return soldQty > 0 
          ? { ...p, currentStock: Math.max(0, Number(p.currentStock || 0) - soldQty) }
          : p;
      });
      setParts(updatedParts);
      return newSale;
    } catch (err) {
      console.error('Error adding sale:', err);
      throw err;
    }
  };



  const editSale = async (saleId, updatedSaleData) => {
    try {
      if (!user?.token) {
        throw new Error('You must be logged in to edit a sale');
      }

      const response = await fetch(`${API_BASE}/sales/${saleId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedSaleData,
          total: updatedSaleData.items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unit || 0)), 0)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update sale');
      }

      const updatedSale = await response.json();
      setSales(prev => prev.map(s => s.id === saleId ? updatedSale : s));

      // Refresh inventory data by refetching parts
      if (inventoryContext && inventoryContext.fetchParts) {
        await inventoryContext.fetchParts();
      }

      return updatedSale;
    } catch (err) {
      console.error('Error editing sale:', err);
      throw err;
    }
  };

  const removeSale = (saleId) => {
    const saleToRemove = sales.find(s => s.id === saleId);
    setSales(prev => prev.filter(s => s.id !== saleId));
    // Attempt to restore inventory
    try {
      if (saleToRemove && parts && parts.length > 0) {
        const updatedParts = parts.map(p => {
          const restoreQty = saleToRemove.items?.reduce((s, it) => {
            if (it.partNumber && p.partNumber === it.partNumber) return s + Number(it.qty || 0);
            if (!it.partNumber && p.description && p.description.toLowerCase().includes((it.name || '').toLowerCase())) return s + Number(it.qty || 0);
            return s;
          }, 0);
          if (restoreQty > 0) {
            return { ...p, currentStock: Number(p.currentStock || 0) + restoreQty };
          }
          return p;
        });
        setParts(updatedParts);
      }
    } catch (e) {
      console.warn('Failed to restore inventory for removed sale', e);
    }
  };

  const totalSales = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

  const contextValue = {
    sales,
    addSale,
    editSale,
    removeSale,
    loading,
    error,
    totalSales: sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
  };

  // Don't show loading/error UI in the provider
  return (
    <SalesContext.Provider value={{
      ...contextValue,
      loading: loading || authLoading,
      error: error
    }}>
      {children}
    </SalesContext.Provider>
  );
};

export default SalesContext;
