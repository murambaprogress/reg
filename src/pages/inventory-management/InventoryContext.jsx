import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useToast as useGlobalToast } from '../../components/ui/Toast';

// Constants
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';
const DEFAULT_ICON = 'Package';
const INITIAL_PROMPT_STATE = { 
  open: false, 
  title: '', 
  placeholder: '', 
  defaultValue: '', 
  resolve: null 
};
const INITIAL_HISTORY_STATE = { 
  open: false, 
  entries: [], 
  title: 'History' 
};

// Utility functions
const getAuthToken = () => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.warn('Failed to retrieve auth token:', error);
    return null;
  }
};

const createAuthHeaders = (token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const safeJsonParse = async (response) => {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.warn('Failed to parse JSON response:', error);
    return null;
  }
};

const extractErrorMessage = (data, fallback = 'Operation failed') => {
  if (!data) return fallback;
  
  if (typeof data === 'string') return data;
  
  if (data.message) return data.message;
  if (data.non_field_errors) {
    return Array.isArray(data.non_field_errors) 
      ? data.non_field_errors.join(', ')
      : data.non_field_errors;
  }
  
  return typeof data === 'object' ? JSON.stringify(data) : fallback;
};

const normalizePartData = (part) => ({
  id: part.id,
  partNumber: part.part_number || part.partNumber,
  description: part.description,
  currentStock: part.current_stock ?? part.currentStock,
  unitCost: part.unit_cost ?? part.unitCost,
  minimumThreshold: part.minimum_threshold ?? part.minimumThreshold,
  category: part.category,
  name: part.description || part.part_number || part.partNumber,
});

const normalizeCategoryData = (category) => ({
  id: category.id,
  name: category.name,
  description: category.description || '',
  icon: category.icon || DEFAULT_ICON,
  count: typeof category.count === 'number' ? category.count : 0,
  subcategories: Array.isArray(category.subcategories) ? category.subcategories : []
});

// Context
const InventoryContext = createContext();

// Custom hook for API calls
const useApiCall = (showToast) => {
  const makeApiCall = useCallback(async (url, options = {}) => {
    const token = getAuthToken();
    const headers = createAuthHeaders(token);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers }
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        const errorMessage = extractErrorMessage(data, `Request failed with status ${response.status}`);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`API call failed for ${url}:`, error);
      if (showToast) {
        showToast(error.message || 'Network request failed', 'error');
      }
      throw error;
    }
  }, [showToast]);

  return makeApiCall;
};

export const InventoryProvider = ({ children }) => {
  // State
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [promptState, setPromptState] = useState(INITIAL_PROMPT_STATE);
  const [historyState, setHistoryState] = useState(INITIAL_HISTORY_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Toast functionality
  const showToast = useMemo(() => {
    return typeof window !== 'undefined' && window.__SHOW_TOAST 
      ? window.__SHOW_TOAST 
      : null;
  }, []);

  const apiCall = useApiCall(showToast);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await apiCall(`${API_BASE}/suppliers/`);
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Failed to fetch suppliers:', error);
      setSuppliers([]);
    }
  }, [apiCall]);

  // Fetch inventory data
  const fetchInventoryData = useCallback(async () => {
    if (!getAuthToken()) {
      console.warn('No auth token available');
      setParts([]);
      setCategories([]);
      setSuppliers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch parts with fallback URL handling
      const fetchParts = async () => {
        try {
          return await apiCall(`${API_BASE}/inventory/parts/`);
        } catch (error) {
          // Fallback to URL without trailing slash
          return await apiCall(`${API_BASE}/inventory/parts`);
        }
      };

      const [partsData, categoriesData, suppliersData] = await Promise.allSettled([
        fetchParts(),
        apiCall(`${API_BASE}/inventory/categories/`),
        apiCall(`${API_BASE}/suppliers/`)
      ]);

      // Handle parts data
      if (partsData.status === 'fulfilled' && Array.isArray(partsData.value)) {
        const normalizedParts = partsData.value.map(normalizePartData);
        setParts(normalizedParts);
      } else {
        console.warn('Failed to fetch parts:', partsData.reason);
        setParts([]);
      }

      // Handle categories data
      if (categoriesData.status === 'fulfilled' && Array.isArray(categoriesData.value)) {
        const normalizedCategories = categoriesData.value.map(normalizeCategoryData);
        setCategories(normalizedCategories);
      } else {
        console.warn('Failed to fetch categories:', categoriesData.reason);
        setCategories([]);
      }

      // Handle suppliers data
      if (suppliersData.status === 'fulfilled' && Array.isArray(suppliersData.value)) {
        setSuppliers(suppliersData.value);
      } else {
        console.warn('Failed to fetch suppliers:', suppliersData.reason);
        setSuppliers([]);
      }

    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setError(error.message);
      setParts([]);
      setCategories([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      const data = await apiCall(`${API_BASE}/inventory/transactions`);
      setRecentTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Failed to fetch transactions:', error);
      setRecentTransactions([]);
    }
  }, [apiCall]);

  // Calculate low stock alerts
  const calculateLowStockAlerts = useCallback(() => {
    const alerts = parts
      .filter(part => {
        const currentStock = Number(part.currentStock) || 0;
        const threshold = Number(part.minimumThreshold) || 0;
        return currentStock <= threshold && currentStock > 0;
      })
      .map(part => ({
        id: part.id,
        partNumber: part.partNumber,
        description: part.description,
        currentStock: part.currentStock,
        minimumThreshold: part.minimumThreshold
      }));
    
    setLowStockAlerts(alerts);
  }, [parts]);

  // Update category counts
  const updateCategoryCounts = useCallback(() => {
    if (!Array.isArray(categories) || categories.length === 0) return;

    const counts = {};
    parts.forEach(part => {
      const category = part.category;
      const categoryId = category && typeof category === 'object' 
        ? (category.id ?? category) 
        : category;
      
      if (categoryId) {
        counts[categoryId] = (counts[categoryId] || 0) + 1;
      }
    });

    const updatedCategories = categories.map(category => ({
      ...category,
      count: counts[category.id] || 0
    }));

    setCategories(updatedCategories);
  }, [categories, parts]);

  // Effects
  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    calculateLowStockAlerts();
  }, [calculateLowStockAlerts]);

  useEffect(() => {
    updateCategoryCounts();
  }, [updateCategoryCounts]);

  // Prompt helpers
  const prompt = useCallback(({ title = '', placeholder = '', defaultValue = '' } = {}) => {
    return new Promise((resolve) => {
      setPromptState({ open: true, title, placeholder, defaultValue, resolve });
    });
  }, []);

  const closePrompt = useCallback((value) => {
    const resolver = promptState.resolve;
    setPromptState(INITIAL_PROMPT_STATE);
    if (typeof resolver === 'function') {
      resolver(value);
    }
  }, [promptState.resolve]);

  // History helpers
  const openHistory = useCallback((title, entries) => {
    setHistoryState({ open: true, title, entries });
  }, []);

  const closeHistory = useCallback(() => {
    setHistoryState(INITIAL_HISTORY_STATE);
  }, []);

  // API operations
  const refreshParts = useCallback(async () => {
    try {
      const data = await apiCall(`${API_BASE}/inventory/parts`);
      if (Array.isArray(data)) {
        const normalizedParts = data.map(normalizePartData);
        setParts(normalizedParts);
      }
      return data;
    } catch (error) {
      console.error('Failed to refresh parts:', error);
      throw error;
    }
  }, [apiCall]);

  const searchParts = useCallback(async (query) => {
    try {
      const url = query 
        ? `${API_BASE}/inventory/parts?search=${encodeURIComponent(query)}`
        : `${API_BASE}/inventory/parts`;
      
      const data = await apiCall(url);
      
      if (Array.isArray(data)) {
        const normalizedParts = data.map(normalizePartData);
        setParts(normalizedParts);
      }
      
      return data;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }, [apiCall]);

  const createPart = useCallback(async (payload) => {
    try {
      const data = await apiCall(`${API_BASE}/inventory/parts/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      await refreshParts();
      
      if (showToast) {
        showToast('Part created successfully', 'success');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to create part:', error);
      throw error;
    }
  }, [apiCall, refreshParts, showToast]);

  const updatePart = useCallback(async (id, payload) => {
    try {
      const data = await apiCall(`${API_BASE}/inventory/parts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      await refreshParts();
      
      if (showToast) {
        showToast('Part updated successfully', 'success');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to update part:', error);
      throw error;
    }
  }, [apiCall, refreshParts, showToast]);

  const assignPart = useCallback(async ({ partId, jobId, quantity, notes }) => {
    try {
      const data = await apiCall(`${API_BASE}/inventory/assign-to-job`, {
        method: 'POST',
        body: JSON.stringify({ partId, jobId, quantity, notes })
      });

      await Promise.all([refreshParts(), fetchTransactions()]);
      
      if (showToast) {
        showToast('Part assigned successfully', 'success');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to assign part:', error);
      throw error;
    }
  }, [apiCall, refreshParts, fetchTransactions, showToast]);

  const reorderPart = useCallback(async ({ partId, quantity, notes } = {}) => {
    try {
      const data = await apiCall(`${API_BASE}/inventory/reorder`, {
        method: 'POST',
        body: JSON.stringify({ partId, quantity, notes })
      });

      await refreshParts();
      
      if (showToast) {
        showToast('Reorder request submitted successfully', 'success');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to reorder part:', error);
      throw error;
    }
  }, [apiCall, refreshParts, showToast]);

  const fetchPartHistory = useCallback(async (partId) => {
    try {
      return await apiCall(`${API_BASE}/inventory/parts/${partId}/history`);
    } catch (error) {
      console.error('Failed to fetch part history:', error);
      throw error;
    }
  }, [apiCall]);

  const exportParts = useCallback(async () => {
    try {
      const token = getAuthToken();
      const headers = createAuthHeaders(token);
      
      const response = await fetch(`${API_BASE}/inventory/export`, { headers });
      
      if (!response.ok) {
        const data = await safeJsonParse(response);
        const errorMessage = extractErrorMessage(data, 'Export failed');
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `parts-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      if (showToast) {
        showToast('Parts exported successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to export parts:', error);
      if (showToast) {
        showToast(error.message || 'Export failed', 'error');
      }
      throw error;
    }
  }, [showToast]);

  // Context value
  const contextValue = useMemo(() => ({
    // State
    parts,
    categories,
    suppliers,
    lowStockAlerts,
    recentTransactions,
    loading,
    error,
    
    // Prompt state
    promptState,
    historyState,
    
    // Actions
    setParts,
    refreshParts,
    searchParts,
    createPart,
    updatePart,
    assignPart,
    reorderPart,
    fetchPartHistory,
    exportParts,
    fetchSuppliers,
    
    // Prompt actions
    prompt,
    closePrompt,
    openHistory,
    closeHistory,
    
    // Utilities
    fetchInventoryData
  }), [
    parts,
    categories,
    suppliers,
    lowStockAlerts,
    recentTransactions,
    loading,
    error,
    promptState,
    historyState,
    refreshParts,
    searchParts,
    createPart,
    updatePart,
    assignPart,
    reorderPart,
    fetchPartHistory,
    exportParts,
    fetchSuppliers,
    prompt,
    closePrompt,
    openHistory,
    closeHistory,
    fetchInventoryData
  ]);

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
