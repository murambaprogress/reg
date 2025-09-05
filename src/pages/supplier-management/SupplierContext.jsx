import React, { createContext, useContext, useState, useEffect } from 'react';
// don't import useToast here — SupplierProvider may be mounted outside a ToastProvider

const getAuthToken = () => {
  try { return localStorage.getItem('token'); } catch (e) { return null; }
};

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

const SupplierContext = createContext();

export const SupplierProvider = ({ children }) => {
  const [suppliers, setSuppliers] = useState([]);
  // prefer a global showToast helper if a ToastProvider mounted earlier set it
  const showToast = (typeof window !== 'undefined' && window.__SHOW_TOAST) ? window.__SHOW_TOAST : null;

  const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  const normalizeSupplier = (raw = {}) => {
    const obj = {};
    Object.keys(raw).forEach((k) => {
      const nk = toCamel(k);
      obj[nk] = raw[k];
    });
    // Ensure fields types and aliases
    if (obj.dueDate === undefined && raw.due_date !== undefined) obj.dueDate = raw.due_date;
    if (obj.productsSupplied === undefined && raw.products_supplied !== undefined) obj.productsSupplied = raw.products_supplied;
    // Parse payments/previous/future if they are JSON strings
    ['payments', 'previous', 'future'].forEach((key) => {
      const val = obj[key];
      if (typeof val === 'string') {
        try { obj[key] = JSON.parse(val); } catch (e) { obj[key] = []; }
      }
      if (!Array.isArray(obj[key])) obj[key] = obj[key] ? [obj[key]] : [];
    });
    // Ensure numeric amount
    obj.amount = Number(obj.amount || 0);
    return obj;
  };

  const refreshSuppliers = async () => {
    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/suppliers/`, { headers });
      const data = await res.json().catch(() => null);
      // Support paginated responses with `results` and plain array
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
      setSuppliers(list.map(normalizeSupplier));
      return list;
    } catch (e) {
      setSuppliers([]);
      return [];
    }
  };

  useEffect(() => { refreshSuppliers(); }, []);

  const toApiPayload = (payload = {}) => {
    // convert camelCase keys to snake_case expected by API
    const out = {};
    Object.keys(payload).forEach((k) => {
      const snake = k.replace(/([A-Z])/g, '_$1').toLowerCase();
      let val = payload[k];
      // for known array-backed text fields, stringify arrays so backend TextField accepts them
      if (Array.isArray(val) && ['previous', 'future', 'payments', 'productsSupplied'].includes(k)) {
        try { val = JSON.stringify(val); } catch (e) { val = String(val); }
      }
      // also accept camelCase key converted name for products_supplied
      if (Array.isArray(val) && snake === 'products_supplied') {
        try { val = JSON.stringify(val); } catch (e) { val = String(val); }
      }
      out[snake] = val;
    });
    return out;
  };

  const createSupplier = async (payload) => {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    const body = JSON.stringify(toApiPayload(payload));
  // debug: log request body
  // eslint-disable-next-line no-console
  console.log('[SupplierContext] createSupplier body ->', body);
    const r = await fetch(`${API_BASE}/suppliers/`, { method: 'POST', headers, body });
    const text = await r.text().catch(() => null);
  // eslint-disable-next-line no-console
  console.log('[SupplierContext] createSupplier response text ->', text);
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    if (!r.ok) {
      const msg = data && (data.message || JSON.stringify(data)) ? (data.message || JSON.stringify(data)) : (typeof data === 'string' ? data : 'Create failed');
      if (showToast) showToast(msg, 'error');
      throw new Error(msg);
    }
    await refreshSuppliers();
    if (showToast) showToast('Supplier created', 'success');
    return data;
  };

  const updateSupplier = async (id, payload) => {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    const body = JSON.stringify(toApiPayload(payload));
    const r = await fetch(`${API_BASE}/suppliers/${id}/`, { method: 'PATCH', headers, body });
    const text = await r.text().catch(() => null);
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    if (!r.ok) {
      const msg = data && (data.message || JSON.stringify(data)) ? (data.message || JSON.stringify(data)) : (typeof data === 'string' ? data : 'Update failed');
      if (showToast) showToast(msg, 'error');
      throw new Error(msg);
    }
    await refreshSuppliers();
    if (showToast) showToast('Supplier updated', 'success');
    return data;
  };

  const deleteSupplier = async (id) => {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const r = await fetch(`${API_BASE}/suppliers/${id}/`, { method: 'DELETE', headers });
    if (!r.ok) {
      const data = await r.json().catch(() => null);
      const msg = data ? JSON.stringify(data) : 'Delete failed';
      if (showToast) showToast(msg, 'error');
      throw new Error(msg);
    }
    await refreshSuppliers();
    if (showToast) showToast('Supplier deleted', 'success');
    return true;
  };

  return (
    <SupplierContext.Provider value={{ suppliers, setSuppliers, refreshSuppliers, createSupplier, updateSupplier, deleteSupplier }}>
      {children}
    </SupplierContext.Provider>
  );
};

export const useSuppliers = () => useContext(SupplierContext);
