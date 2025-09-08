import React, { createContext, useContext, useState, useEffect } from 'react';

const CustomerContext = createContext();

const getAuthToken = () => {
  try { return localStorage.getItem('token'); } catch (e) { return null; }
};

const API_BASE = import.meta.env.VITE_API_BASE || 'https://progress.pythonanywhere.com/api';

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

  useEffect(() => {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
  fetch(`${API_BASE}/customers/`, { headers }).then(r => r.json()).then(data => Array.isArray(data) ? setCustomers(data) : setCustomers([])).catch(() => setCustomers([]));
  }, []);

  const refreshCustomers = () => {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  return fetch(`${API_BASE}/customers/`, { headers }).then(r => r.json()).then(data => { if (Array.isArray(data)) setCustomers(data); return data; });
  };

  const searchCustomers = (q) => {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const url = q ? `${API_BASE}/customers/?search=${encodeURIComponent(q)}` : `${API_BASE}/customers/`;
    return fetch(url, { headers }).then(async (r) => {
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        const msg = data && (data.message || JSON.stringify(data)) ? (data.message || JSON.stringify(data)) : 'Search failed';
        if (showToast) showToast(msg, 'error');
        throw new Error(msg);
      }
      if (Array.isArray(data)) setCustomers(data);
      return data;
    }).catch((err) => { if (showToast) showToast(err.message || 'Search failed', 'error'); return [] });
  };

  const createCustomer = (payload) => {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  return fetch(`${API_BASE}/customers/`, { method: 'POST', headers, body: JSON.stringify(payload) }).then(async (r) => {
      let text = null; try { text = await r.text(); } catch (e) { text = null; }
      let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
      if (!r.ok) {
        const msg = data && (data.message || JSON.stringify(data)) ? (data.message || JSON.stringify(data)) : (typeof data === 'string' ? data : 'Create failed');
        console.error('createCustomer error response:', data, 'raw:', text);
        if (showToast) showToast(msg, 'error');
        throw new Error(msg);
      }
      await refreshCustomers();
      return data;
    }).catch((err) => { if (showToast) showToast(err.message || 'Create failed', 'error'); throw err; });
  };

  const updateCustomer = (id, payload) => {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  return fetch(`${API_BASE}/customers/${id}/`, { method: 'PATCH', headers, body: JSON.stringify(payload) }).then(async (r) => {
      let text = null; try { text = await r.text(); } catch (e) { text = null; }
      let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
      if (!r.ok) {
        const msg = data && (data.message || JSON.stringify(data)) ? (data.message || JSON.stringify(data)) : (typeof data === 'string' ? data : 'Update failed');
        console.error('updateCustomer error response:', data, 'raw:', text);
        if (showToast) showToast(msg, 'error');
        throw new Error(msg);
      }
      await refreshCustomers();
      return data;
    }).catch((err) => { if (showToast) showToast(err.message || 'Update failed', 'error'); throw err; });
  };

  const deleteCustomer = (id) => {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return fetch(`${API_BASE}/customers/${id}/`, { method: 'DELETE', headers }).then(async (r) => {
      if (!r.ok) {
        const text = await r.text().catch(() => null);
        const data = text ? (JSON.parse(text) || text) : null;
        const msg = data && (data.message || JSON.stringify(data)) ? (data.message || JSON.stringify(data)) : (typeof data === 'string' ? data : 'Delete failed');
        if (showToast) showToast(msg, 'error');
        throw new Error(msg);
      }
      await refreshCustomers();
      return { success: true };
    }).catch((err) => { if (showToast) showToast(err.message || 'Delete failed', 'error'); throw err; });
  };

  return (
    <CustomerContext.Provider value={{ customers, setCustomers, refreshCustomers, searchCustomers, createCustomer, updateCustomer, deleteCustomer, prompt, promptState, closePrompt }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => useContext(CustomerContext);
