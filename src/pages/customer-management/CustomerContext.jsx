import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { apiHelpers } from '../../utils/axios';
import { endpoints } from '../../utils/urls';
import { getBaseUrl } from '../../utils/config';

const CustomerContext = createContext();

const API_BASE = getBaseUrl();

export const CustomerProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [promptState, setPromptState] = useState({ open: false, title: '', placeholder: '', defaultValue: '', resolve: null });
  const showToast = typeof window !== 'undefined' && window.__SHOW_TOAST ? window.__SHOW_TOAST : null;

  const prompt = ({ title = '', placeholder = '', defaultValue = '' } = {}) => new Promise((resolve) => {
    setPromptState({ open: true, title, placeholder, defaultValue, resolve });
  });
  const closePrompt = (value) => {
    const resolver = promptState.resolve;
    setPromptState({ open: false, title: '', placeholder: '', defaultValue: '', resolve: null });
    if (typeof resolver === 'function') resolver(value);
  };

  // Helper to normalize backend fields to camelCase
  const normalizeCustomer = (raw = {}) => {
    const obj = { ...raw };
    if (raw.amount_received !== undefined) obj.amountReceived = raw.amount_received;
    if (raw.full_cost !== undefined) obj.fullCost = raw.full_cost;
    if (raw.inventory_sold !== undefined) {
      try {
        obj.inventorySold = JSON.parse(raw.inventory_sold);
      } catch {
        obj.inventorySold = raw.inventory_sold;
      }
    }
    return obj;
  };

  useEffect(() => {
    // Use centralized axios instance for proper auth handling
    apiHelpers.getCustomers()
      .then(response => {
        const data = response.data;
        Array.isArray(data) ? setCustomers(data.map(normalizeCustomer)) : setCustomers([]);
      })
      .catch(error => {
        console.error("Failed to fetch customers:", error);
        setCustomers([]);
      });
  }, []);

  const refreshCustomers = () => {
    // Use centralized axios instance for proper auth handling
    return apiHelpers.getCustomers()
      .then(response => {
        const data = response.data;
        if (Array.isArray(data)) setCustomers(data.map(normalizeCustomer));
        return Array.isArray(data) ? data.map(normalizeCustomer) : data;
      })
      .catch(error => {
        console.error("Failed to refresh customers:", error);
        throw error;
      });
  };

  const searchCustomers = (q) => {
    const url = q ? `${endpoints.customers}?search=${encodeURIComponent(q)}` : endpoints.customers;
    return api.get(url)
      .then(response => {
        const data = response.data;
        if (Array.isArray(data)) {
          setCustomers(data.map(normalizeCustomer));
        }
        return Array.isArray(data) ? data.map(normalizeCustomer) : [];
      })
      .catch(error => {
        console.error("Failed to search customers:", error);
        if (showToast) showToast(error.message || 'Search failed', 'error');
        return [];
      });
  };

  const createCustomer = (payload) => {
    // Add support for amountReceived, inventorySold, and fullCost fields
    const apiPayload = { ...payload };
    if (payload.amountReceived !== undefined) {
      apiPayload.amount_received = Number(payload.amountReceived);
    }
    if (payload.inventorySold !== undefined) {
      apiPayload.inventory_sold = Array.isArray(payload.inventorySold) ? JSON.stringify(payload.inventorySold) : String(payload.inventorySold);
    }
    if (payload.fullCost !== undefined) {
      apiPayload.full_cost = Number(payload.fullCost);
    }
    
    // Use centralized axios instance for proper auth handling
    return api.post(endpoints.customers, apiPayload)
      .then(async (response) => {
        const data = response.data;
        await refreshCustomers();
        return data;
      })
      .catch(error => {
        console.error('createCustomer error:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to create customer';
        if (showToast) showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      });
  };

  const updateCustomer = (id, payload) => {
    // Use centralized axios instance for proper auth handling
    return api.patch(`${endpoints.customers}/${id}/`, payload)
      .then(async (response) => {
        const data = response.data;
        await refreshCustomers();
        return data;
      })
      .catch(error => {
        console.error('updateCustomer error:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to update customer';
        if (showToast) showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      });
  };

  const deleteCustomer = (id) => {
    // Use centralized axios instance for proper auth handling
    return api.delete(`${endpoints.customers}/${id}/`)
      .then(async () => {
        await refreshCustomers();
        return { success: true };
      })
      .catch(error => {
        console.error('deleteCustomer error:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to delete customer';
        if (showToast) showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      });
  };

  return (
    <CustomerContext.Provider value={{ customers, setCustomers, refreshCustomers, searchCustomers, createCustomer, updateCustomer, deleteCustomer, prompt, promptState, closePrompt }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => useContext(CustomerContext);
