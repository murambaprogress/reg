import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useToast as useGlobalToast } from '../../components/ui/Toast';
import { getBaseUrl } from '../../utils/config';
import api, { apiHelpers } from '../../utils/axios';
import { useApi } from '../../utils/useApi';
import { endpoints } from '../../utils/urls';
import { useUser } from '../../components/UserContext';

// Constants
const API_BASE = getBaseUrl();
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
    const token = localStorage.getItem('token');
    console.log('Retrieved auth token:', token ? 'Token exists' : 'No token found');
    return token;
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
    
    console.log('Making API call to:', url);
    console.log('HTTP Method:', options.method || 'GET');
    console.log('Headers:', headers);
    console.log('Request body:', options.body ? 'Present' : 'None');
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers }
      });
      
      console.log('Response status:', response.status, response.statusText);

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
  // Authentication
  const { user, loading: authLoading } = useUser();
  
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
  const [userRole, setUserRole] = useState(null);

  // Toast functionality
  const showToast = useMemo(() => {
    return typeof window !== 'undefined' && window.__SHOW_TOAST 
      ? window.__SHOW_TOAST 
      : null;
  }, []);

  const apiCall = useApiCall(showToast);

  // Fetch suppliers with proper authentication
  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await api.get(endpoints.inventorySuppliers);
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.warn('Failed to fetch suppliers:', error);
      setSuppliers([]);
      if (showToast) {
        showToast('Failed to load suppliers', 'error');
      }
    }
  }, [showToast]);

  // Get user role from localStorage
  useEffect(() => {
    const role = localStorage.getItem('role');
    console.log('User role from localStorage:', role);
    setUserRole(role);
  }, []);

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
      // Fetch parts using centralized axios instance
      const fetchParts = async () => {
        try {
          const response = await api.get(endpoints.inventoryParts);
          return response.data;
        } catch (error) {
          console.warn('Failed to fetch parts using centralized API:', error);
          throw error;
        }
      };

      // Fetch categories using centralized axios instance
      const fetchCategories = async () => {
        try {
          const response = await api.get(endpoints.inventoryCategories);
          return response.data;
        } catch (error) {
          console.warn('Failed to fetch categories using centralized API:', error);
          throw error;
        }
      };
      
      const [partsData, categoriesData, suppliersData] = await Promise.allSettled([
        fetchParts(),
        fetchCategories(),
        api.get(endpoints.inventorySuppliers).then(response => response.data)
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

  // Fetch transactions using our centralized axios instance
  const fetchTransactions = useCallback(async () => {
    try {
      // Use the helper to ensure proper authentication and error handling
      const response = await apiHelpers.getInventoryTransactions();
      setRecentTransactions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.warn('Failed to fetch transactions:', error);
      setRecentTransactions([]);
      // Show toast if available
      if (showToast) {
        showToast('Failed to load inventory transactions', 'error');
      }
    }
  }, [showToast]);

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

    let changed = false;
    const updatedCategories = categories.map(category => {
      const newCount = counts[category.id] || 0;
      if (category.count !== newCount) {
        changed = true;
        return { ...category, count: newCount };
      }
      return category; // preserve reference if unchanged
    });

    if (changed) {
      setCategories(updatedCategories);
    }
  }, [categories, parts]);

  // Effects
  useEffect(() => {
    // Only fetch inventory data if user is authenticated and not loading
    if (user && !authLoading) {
      fetchInventoryData();
    }
  }, [fetchInventoryData, user, authLoading]);

  useEffect(() => {
    // Only fetch transactions if user is authenticated and not loading
    if (user && !authLoading) {
      fetchTransactions();
    }
  }, [fetchTransactions, user, authLoading]);

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
      const response = await apiHelpers.getInventoryParts();
      if (Array.isArray(response.data)) {
        const normalizedParts = response.data.map(normalizePartData);
        setParts(normalizedParts);
      }
      return response.data;
    } catch (error) {
      console.error('Failed to refresh parts:', error);
      throw error;
    }
  }, []);

  const searchParts = useCallback(async (query) => {
    try {
      // Use our centralized apiHelpers for search
      const response = await apiHelpers.searchInventoryParts(query);
      const data = response.data;
      
      if (Array.isArray(data)) {
        const normalizedParts = data.map(normalizePartData);
        setParts(normalizedParts);
      }
      
      return data;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }, []);

  const createPart = useCallback(async (payload) => {
    try {
      // Check role before creating
      if (userRole !== 'admin' && userRole !== 'supervisor') {
        const errorMessage = 'Only admin and supervisor can create parts';
        console.error(errorMessage);
        if (showToast) {
          showToast(errorMessage, 'error');
        }
        throw new Error(errorMessage);
      }

      // Use centralized axios instance
      const response = await api.post(endpoints.inventoryParts, payload);
      const data = response.data;

      await refreshParts();
      
      if (showToast) {
        showToast('Part created successfully', 'success');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to create part:', error);
      if (showToast) {
        showToast(error.message || 'Failed to create part', 'error');
      }
      throw error;
    }
  }, [refreshParts, showToast, userRole]);

  const updatePart = useCallback(async (id, payload) => {
    try {
      // Check role before updating
      if (userRole !== 'admin' && userRole !== 'supervisor') {
        const errorMessage = 'Only admin and supervisor can update parts';
        console.error(errorMessage);
        if (showToast) {
          showToast(errorMessage, 'error');
        }
        throw new Error(errorMessage);
      }

      // Use centralized axios instance
      const response = await api.patch(`${endpoints.inventoryParts}/${id}/`, payload);
      const data = response.data;

      await refreshParts();
      
      if (showToast) {
        showToast('Part updated successfully', 'success');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to update part:', error);
      if (showToast) {
        showToast(error.message || 'Failed to update part', 'error');
      }
      throw error;
    }
  }, [refreshParts, showToast, userRole]);

  const assignPart = useCallback(async ({ partId, jobId, quantity, notes }) => {
    try {
      // Check role before assigning
      if (!userRole) {
        const errorMessage = 'You must be logged in to assign parts';
        console.error(errorMessage);
        if (showToast) {
          showToast(errorMessage, 'error');
        }
        throw new Error(errorMessage);
      }

      // Use centralized axios instance
      const response = await api.post(`/inventory/assign-to-job/`, { 
        partId, jobId, quantity, notes 
      });
      const data = response.data;

      await Promise.all([refreshParts(), fetchTransactions()]);
      
      if (showToast) {
        showToast('Part assigned successfully', 'success');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to assign part:', error);
      if (showToast) {
        showToast(error.message || 'Failed to assign part', 'error');
      }
      throw error;
    }
  }, [refreshParts, fetchTransactions, showToast, userRole]);

  const reorderPart = useCallback(async ({ partId, quantity, notes } = {}) => {
    try {
      // Check role before reordering
      if (userRole !== 'admin' && userRole !== 'supervisor') {
        const errorMessage = 'Only admin and supervisor can reorder parts';
        console.error(errorMessage);
        if (showToast) {
          showToast(errorMessage, 'error');
        }
        throw new Error(errorMessage);
      }

      // Use centralized axios instance
      const response = await api.post(`/inventory/reorder/`, { 
        partId, quantity, notes 
      });
      const data = response.data;

      await refreshParts();
      
      if (showToast) {
        showToast('Reorder request submitted successfully', 'success');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to reorder part:', error);
      if (showToast) {
        showToast(error.message || 'Failed to reorder part', 'error');
      }
      throw error;
    }
  }, [refreshParts, showToast, userRole]);
  
  const deletePart = useCallback(async (id) => {
    try {
      // Check role before deleting
      if (userRole !== 'admin' && userRole !== 'supervisor') {
        const errorMessage = 'Only admin and supervisor can delete parts';
        console.error(errorMessage);
        if (showToast) {
          showToast(errorMessage, 'error');
        }
        throw new Error(errorMessage);
      }

      console.log(`Attempting to delete part with ID: ${id}`);
      // Use centralized axios instance
      await api.delete(`${endpoints.inventoryParts}/${id}/`);
      console.log(`Delete API call completed for part ID: ${id}`);

      await refreshParts();
      
      if (showToast) {
        showToast('Part deleted successfully', 'success');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete part:', error);
      if (showToast) {
        showToast(error.message || 'Failed to delete part', 'error');
      }
      throw error;
    }
  }, [refreshParts, showToast, userRole]);

  const fetchPartHistory = useCallback(async (partId) => {
    try {
      // Use centralized axios instance
      const response = await api.get(`${endpoints.inventoryParts}/${partId}/history/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch part history:', error);
      throw error;
    }
  }, []);

  const exportParts = useCallback(async () => {
    try {
      // Use our API helper for exporting parts
      const response = await apiHelpers.exportInventoryParts();
      
      const blob = response.data;
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
    userRole,
    
    // Prompt state
    promptState,
    historyState,
    
    // Actions
    setParts,
    refreshParts,
    searchParts,
    createPart,
    updatePart,
    deletePart,
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
    userRole,
    promptState,
    historyState,
    refreshParts,
    searchParts,
    createPart,
    updatePart,
    deletePart,
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
