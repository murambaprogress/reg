import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBaseUrl } from '../../utils/config';

const BillingContext = createContext();

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

export const BillingProvider = ({ children }) => {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [stats, setStats] = useState({
    billing: [],
    expenses: [],
    personal: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Import API base URL from config - will use PythonAnywhere in production
  const API_BASE_URL = getBaseUrl();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  // Fetch invoices
  const fetchInvoices = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });
      
      const response = await fetch(`${API_BASE_URL}/billing/invoices/?${queryParams}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const data = await response.json();
      setInvoices(data.results || data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch expenses
  const fetchExpenses = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });
      
      const response = await fetch(`${API_BASE_URL}/billing/expenses/?${queryParams}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      
      const data = await response.json();
      setExpenses(data.results || data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch debtors
  const fetchDebtors = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });
      
      const response = await fetch(`${API_BASE_URL}/billing/debtors/?${queryParams}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch debtors');
      }
      
      const data = await response.json();
      setDebtors(data.results || data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching debtors:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch debtor contacts
  const fetchDebtorContacts = async (debtorId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/debtors/${debtorId}/contacts/`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch debtor contacts');
      }
      
      const data = await response.json();
      return data.results || data;
    } catch (err) {
      console.error('Error fetching debtor contacts:', err);
      throw err;
    }
  };

  // Add new contact record
  const addDebtorContact = async (debtorId, contactData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/debtors/${debtorId}/add_contact/`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add contact record');
      }
      
      const data = await response.json();
      // Refresh debtors list to get updated contact information
      await fetchDebtors();
      return data;
    } catch (err) {
      console.error('Error adding debtor contact:', err);
      throw err;
    }
  };

  // Fetch billing stats
  const fetchBillingStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/billing/invoices/stats/`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing stats');
      }
      
      const data = await response.json();
      
      // Transform the data to match the expected format
      // Store basic values; dynamic effect will overwrite with accurate deltas
      setStats(prevStats => ({
        ...prevStats,
        billing: [
          { title: 'Total Revenue', value: `$${data.total_revenue?.toLocaleString() || '0'}`, change: '', changeType: 'neutral', icon: 'DollarSign', color: 'success' },
          { title: 'Outstanding Invoices', value: `$${data.outstanding_invoices?.toLocaleString() || '0'}`, change: '', changeType: 'neutral', icon: 'Clock', color: 'warning' },
          { title: 'Paid This Month', value: `$${data.paid_this_month?.toLocaleString() || '0'}`, change: '', changeType: 'neutral', icon: 'CheckCircle', color: 'success' },
          { title: 'Avg. Invoice Value', value: `$${data.avg_invoice_value?.toLocaleString() || '0'}`, change: '', changeType: 'neutral', icon: 'TrendingUp', color: 'accent' },
        ],
      }));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching billing stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recompute billing cards locally whenever invoices change to ensure they reflect actual totals
  useEffect(() => {
    if (!Array.isArray(invoices)) return;
    const currency = (v) => `$${Number(v || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    const pct = (curr, prev) => {
      if (prev === 0) {
        if (curr === 0) return { change: '0%', changeType: 'neutral' };
        return { change: '+100%', changeType: 'increase' };
      }
      const diff = ((curr - prev) / prev) * 100;
      const rounded = diff.toFixed(1).replace(/\.0$/,'');
      return {
        change: `${diff > 0 ? '+' : ''}${rounded}%`,
        changeType: diff > 0 ? 'increase' : (diff < 0 ? 'decrease' : 'neutral')
      };
    };
    // Month boundaries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // last day previous month
    const inRange = (dateStr, start, end) => {
      if (!dateStr) return false; const d = new Date(dateStr); return d >= start && d <= end; };

    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
    const totalRevenuePrev = invoices
      .filter(inv => inv.status === 'paid' && inRange(inv.paid_date || inv.invoice_date, prevMonthStart, prevMonthEnd))
      .reduce((s,inv)=> s + Number(inv.total_amount||0),0);
    const outstanding = invoices
      .filter(inv => ['sent','overdue','draft'].includes(inv.status))
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
    // Approx previous month outstanding: invoices sent/overdue/draft whose invoice_date fell previous month
    const outstandingPrev = invoices
      .filter(inv => ['sent','overdue','draft'].includes(inv.status) && inRange(inv.invoice_date, prevMonthStart, prevMonthEnd))
      .reduce((s,inv)=> s + Number(inv.total_amount||0),0);
    // Paid this month
    const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const paidThisMonth = invoices
      .filter(inv => {
        if (inv.status !== 'paid') return false;
        const dateStr = inv.paid_date || inv.invoice_date;
        if (!dateStr) return false;
        return dateStr.startsWith(ym); // YYYY-MM prefix match
      })
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
    const prevMonthYm = `${prevMonthStart.getFullYear()}-${String(prevMonthStart.getMonth()+1).padStart(2,'0')}`;
    const paidPrevMonth = invoices.filter(inv => inv.status==='paid' && (inv.paid_date||inv.invoice_date||'').startsWith(prevMonthYm))
      .reduce((s,inv)=> s + Number(inv.total_amount||0),0);
    const avgValue = invoices.length
      ? invoices.reduce((s, inv) => s + Number(inv.total_amount || 0), 0) / invoices.length
      : 0;
    const prevMonthInvoices = invoices.filter(inv => inRange(inv.invoice_date, prevMonthStart, prevMonthEnd));
    const avgValuePrev = prevMonthInvoices.length ? prevMonthInvoices.reduce((s,inv)=> s + Number(inv.total_amount||0),0)/prevMonthInvoices.length : 0;

    const revDelta = pct(totalRevenue, totalRevenuePrev);
    const outDelta = pct(outstanding, outstandingPrev);
    const paidDelta = pct(paidThisMonth, paidPrevMonth);
    const avgDelta = pct(avgValue, avgValuePrev);

    const dynamicBillingStats = [
      { title: 'Total Revenue', value: currency(totalRevenue), ...revDelta, icon: 'DollarSign', color: 'success' },
      { title: 'Outstanding Invoices', value: currency(outstanding), ...outDelta, icon: 'Clock', color: 'warning' },
      { title: 'Paid This Month', value: currency(paidThisMonth), ...paidDelta, icon: 'CheckCircle', color: 'success' },
      { title: 'Avg. Invoice Value', value: currency(avgValue), ...avgDelta, icon: 'TrendingUp', color: 'accent' },
    ];

    setStats(prev => ({ ...prev, billing: dynamicBillingStats }));
  }, [invoices]);

  // Recompute expense / personal cards locally whenever expenses change
  useEffect(() => {
    if (!Array.isArray(expenses)) return;
    const currency = (v) => `$${Number(v || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    // We only want to show percentage deltas if we actually have previous month data present in the loaded set.
    // Because the expenses list is already filtered (e.g. by dateRange on the page), relying on it for prev-month
    // calculations can produce misleading +100% spikes. So: compute deltas only when BOTH prev and current month
    // records exist in the local dataset; otherwise leave change blank/neutral.
    const pct = (curr, prev, enabled) => {
      if (!enabled) return { change: '', changeType: 'neutral' };
      if (prev === 0) return { change: '', changeType: 'neutral' }; // avoid artificial +100%
      const diff = ((curr - prev)/prev)*100; const rounded = diff.toFixed(1).replace(/\.0$/,'');
      return { change: `${diff>0?'+':''}${rounded}%`, changeType: diff>0?'increase':(diff<0?'decrease':'neutral') };
    };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const inRange = (dateStr, start, end) => { if(!dateStr) return false; const d = new Date(dateStr); return d>=start && d<=end; };

  const business = expenses.filter(e => (e.expense_type || 'business') === 'business');
  const personal = expenses.filter(e => e.expense_type === 'personal');

    const sum = (arr, predicate) => arr.filter(predicate).reduce((s,e)=> s + Number((Number(e.amount)||0) + (Number(e.tax_amount)||0)),0);
    const sumPrev = (arr, predicate) => arr.filter(predicate).filter(e => inRange(e.expense_date, prevMonthStart, prevMonthEnd))
      .reduce((s,e)=> s + Number((Number(e.amount)||0) + (Number(e.tax_amount)||0)),0);

    // Business groupings
    const totalBusiness = sum(business, () => true);
    const partsSupplies = sum(business, e => e.category === 'parts_supplies');
    const utilities = sum(business, e => e.category === 'utilities');
    const equipment = sum(business, e => e.category === 'equipment');
    const totalBusinessPrev = sumPrev(business, () => true);
    const partsSuppliesPrev = sumPrev(business, e => e.category === 'parts_supplies');
    const utilitiesPrev = sumPrev(business, e => e.category === 'utilities');
    const equipmentPrev = sumPrev(business, e => e.category === 'equipment');

    // Decide if we can show deltas for business (needs both current & prev month data present)
    const hasCurrBusiness = business.some(e => inRange(e.expense_date, monthStart, now));
    const hasPrevBusiness = business.some(e => inRange(e.expense_date, prevMonthStart, prevMonthEnd));
    const enableBusinessPct = hasCurrBusiness && hasPrevBusiness;

    const businessStats = [
      { title: 'Total Expenses', value: currency(totalBusiness), ...pct(totalBusiness, totalBusinessPrev, enableBusinessPct), icon: 'TrendingDown', color: 'error' },
      { title: 'Parts & Supplies', value: currency(partsSupplies), ...pct(partsSupplies, partsSuppliesPrev, enableBusinessPct), icon: 'Package', color: 'warning' },
      { title: 'Utilities', value: currency(utilities), ...pct(utilities, utilitiesPrev, enableBusinessPct), icon: 'Zap', color: 'accent' },
      { title: 'Equipment', value: currency(equipment), ...pct(equipment, equipmentPrev, enableBusinessPct), icon: 'Wrench', color: 'secondary' },
    ];

    // Personal groupings (mirroring backend grouping intent)
    const admin = sum(personal, e => ['office_supplies','other'].includes(e.category));
    const travelMeals = sum(personal, e => ['travel','meals'].includes(e.category));
    const officeSupplies = sum(personal, e => e.category === 'office_supplies');
    const professionalDev = sum(personal, e => e.category === 'professional_dev');
    const adminPrev = sumPrev(personal, e => ['office_supplies','other'].includes(e.category));
    const travelMealsPrev = sumPrev(personal, e => ['travel','meals'].includes(e.category));
    const officeSuppliesPrev = sumPrev(personal, e => e.category === 'office_supplies');
    const professionalDevPrev = sumPrev(personal, e => e.category === 'professional_dev');

    const hasCurrPersonal = personal.some(e => inRange(e.expense_date, monthStart, now));
    const hasPrevPersonal = personal.some(e => inRange(e.expense_date, prevMonthStart, prevMonthEnd));
    const enablePersonalPct = hasCurrPersonal && hasPrevPersonal;

    const personalStats = [
      { title: 'Admin Expenses', value: currency(admin), ...pct(admin, adminPrev, enablePersonalPct), icon: 'User', color: 'primary' },
      { title: 'Travel & Meals', value: currency(travelMeals), ...pct(travelMeals, travelMealsPrev, enablePersonalPct), icon: 'Car', color: 'warning' },
      { title: 'Office Supplies', value: currency(officeSupplies), ...pct(officeSupplies, officeSuppliesPrev, enablePersonalPct), icon: 'FileText', color: 'accent' },
      { title: 'Professional Dev', value: currency(professionalDev), ...pct(professionalDev, professionalDevPrev, enablePersonalPct), icon: 'BookOpen', color: 'success' },
    ];

    setStats(prev => ({ ...prev, expenses: businessStats, personal: personalStats }));
  }, [expenses]);

  // Fetch expense stats
  const fetchExpenseStats = async (expenseType = 'business') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/billing/expenses/stats/?expense_type=${expenseType}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch expense stats');
      }
      
      const data = await response.json();
      
      let expenseStats = [];
      
      if (expenseType === 'business') {
        expenseStats = [
          { title: 'Total Expenses', value: `$${data.total_expenses?.toLocaleString() || '0'}`, change: '', changeType: 'neutral', icon: 'TrendingDown', color: 'error' },
          { title: 'Parts & Supplies', value: `$${data.parts_supplies_expenses?.toLocaleString() || '0'}`, change: '', changeType: 'neutral', icon: 'Package', color: 'warning' },
          { title: 'Utilities', value: `$${data.utilities_expenses?.toLocaleString() || '0'}`, change: '', changeType: 'neutral', icon: 'Zap', color: 'accent' },
          { title: 'Equipment', value: `$${data.equipment_expenses?.toLocaleString() || '0'}`, change: '', changeType: 'neutral', icon: 'Wrench', color: 'secondary' },
        ];
      } else {
        expenseStats = [
          { title: 'Admin Expenses', value: `$${data.admin_expenses?.toLocaleString() || '0'}`, change: '', changeType: 'neutral', icon: 'User', color: 'primary' },
          { title: 'Travel & Meals', value: `$${data.travel_meals_expenses?.toLocaleString() || '0'}`, change: '', changeType: 'neutral', icon: 'Car', color: 'warning' },
          { title: 'Office Supplies', value: `$${data.office_supplies_expenses?.toLocaleString() || '0'}`, change: '', changeType: 'neutral', icon: 'FileText', color: 'accent' },
          { title: 'Professional Dev', value: `$${data.professional_dev_expenses?.toLocaleString() || '0'}`, change: '', changeType: 'neutral', icon: 'BookOpen', color: 'success' },
        ];
      }

      setStats(prevStats => ({
        ...prevStats,
        [expenseType === 'business' ? 'expenses' : 'personal']: expenseStats,
      }));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching expense stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create invoice
  const createInvoice = async (invoiceData) => {
    setLoading(true);
    setError(null);
    try {
      // Log the data being sent
      console.log('Creating invoice with data:', invoiceData);
      
      // Enhanced validation for invoice data
      if (!invoiceData.invoice_number) {
        throw new Error('Invoice number is required');
      }
      
      if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
        throw new Error('Invoice must contain at least one item');
      }
      
      // Validate required fields in invoice items
      invoiceData.items.forEach((item, index) => {
        if (!item.description) {
          throw new Error(`Item ${index + 1} description is required`);
        }
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          throw new Error(`Item ${index + 1} must have a valid quantity`);
        }
        if (!item.unit_price || parseFloat(item.unit_price) < 0) {
          throw new Error(`Item ${index + 1} must have a valid price`);
        }
      });
      
      // Use the API function from src/api/billing.js
      try {
        const newInvoice = await window.billingApi.createInvoice(invoiceData);
        
        // Success - add to invoice list
        console.log('Invoice created successfully:', newInvoice);
        
        // Update the invoices list with the new invoice
        setInvoices(prev => [newInvoice, ...prev]);
        
        // Display success notification
        const event = new CustomEvent('showNotification', { 
          detail: {
            type: 'success',
            message: 'Invoice created successfully',
            duration: 3000
          }
        });
        window.dispatchEvent(event);
        
        // Return the created invoice
        return newInvoice;
      } catch (apiError) {
        // Handle API error specifically
        console.error('API Error:', apiError);
        
        // Extract error details from the API response
        const errorDetails = apiError.response?.data;
        let errorMessage = 'Failed to create invoice';
        
        if (errorDetails) {
          if (typeof errorDetails === 'object') {
            // Format nested error objects into readable message
            errorMessage += ': ' + Object.entries(errorDetails)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ');
          } else if (typeof errorDetails === 'string') {
            errorMessage += ': ' + errorDetails;
          }
        }
        
        throw new Error(errorMessage);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error creating invoice:', err);
      
      // Display error notification
      const event = new CustomEvent('showNotification', { 
        detail: {
          type: 'error',
          message: err.message || 'Failed to create invoice',
          duration: 5000
        }
      });
      window.dispatchEvent(event);
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create expense
  const createExpense = async (expenseData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/billing/expenses/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(expenseData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create expense');
      }
      
      const newExpense = await response.json();
      setExpenses(prev => [newExpense, ...prev]);
      return newExpense;
    } catch (err) {
      setError(err.message);
      console.error('Error creating expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update invoice
  const updateInvoice = async (invoiceId, invoiceData) => {
    setLoading(true);
    setError(null);
    try {
      // Log the data being sent for update
      console.log(`Updating invoice ${invoiceId} with data:`, invoiceData);
      
      // Enhanced validation
      if (!invoiceId) {
        throw new Error('Invoice ID is required for updates');
      }
      
      if (!invoiceData.invoice_number) {
        throw new Error('Invoice number is required');
      }
      
      if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
        throw new Error('Invoice must contain at least one item');
      }
      
      // Validate required fields in invoice items
      invoiceData.items.forEach((item, index) => {
        if (!item.description) {
          throw new Error(`Item ${index + 1} description is required`);
        }
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          throw new Error(`Item ${index + 1} must have a valid quantity`);
        }
        if (!item.unit_price || parseFloat(item.unit_price) < 0) {
          throw new Error(`Item ${index + 1} must have a valid price`);
        }
      });
      
      // Use the API function from src/api/billing.js
      try {
        const updatedInvoice = await window.billingApi.updateInvoice(invoiceId, invoiceData);
        
        // Success - update in invoice list
        console.log('Invoice updated successfully:', updatedInvoice);
        
        setInvoices(prev => prev.map(invoice => 
          invoice.id === invoiceId ? updatedInvoice : invoice
        ));
        
        // Display success notification
        const event = new CustomEvent('showNotification', { 
          detail: {
            type: 'success',
            message: 'Invoice updated successfully',
            duration: 3000
          }
        });
        window.dispatchEvent(event);
        
        return updatedInvoice;
      } catch (apiError) {
        // Handle API error specifically
        console.error('API Error:', apiError);
        
        // Extract error details from the API response
        const errorDetails = apiError.response?.data;
        let errorMessage = 'Failed to update invoice';
        
        if (errorDetails) {
          if (typeof errorDetails === 'object') {
            // Format nested error objects into readable message
            errorMessage += ': ' + Object.entries(errorDetails)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ');
          } else if (typeof errorDetails === 'string') {
            errorMessage += ': ' + errorDetails;
          }
        }
        
        throw new Error(errorMessage);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error updating invoice:', err);
      
      // Display error notification
      const event = new CustomEvent('showNotification', { 
        detail: {
          type: 'error',
          message: err.message || 'Failed to update invoice',
          duration: 5000
        }
      });
      window.dispatchEvent(event);
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update expense
  const updateExpense = async (expenseId, expenseData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/billing/expenses/${expenseId}/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(expenseData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update expense');
      }
      
      const updatedExpense = await response.json();
      setExpenses(prev => prev.map(expense => 
        expense.id === expenseId ? updatedExpense : expense
      ));
      return updatedExpense;
    } catch (err) {
      setError(err.message);
      console.error('Error updating expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete invoice
  const deleteInvoice = async (invoiceId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }
      
      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete expense
  const deleteExpense = async (expenseId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/billing/expenses/${expenseId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }
      
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get single invoice
  const getInvoice = async (invoiceId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}/`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }
      
      const invoice = await response.json();
      return invoice;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching invoice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get single expense
  const getExpense = async (expenseId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/billing/expenses/${expenseId}/`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch expense');
      }
      
      const expense = await response.json();
      return expense;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Mark invoice as paid
  const markInvoicePaid = async (invoiceId, paymentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}/mark_paid/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark invoice as paid');
      }
      
      // Refresh invoices
      await fetchInvoices();
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error marking invoice as paid:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Mark expense as paid
  const markExpensePaid = async (expenseId, paymentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/billing/expenses/${expenseId}/mark_paid/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark expense as paid');
      }
      
      // Optimistically update local state instead of full refetch
      setExpenses(prev => prev.map(exp => {
        if (exp.id === expenseId) {
          return {
            ...exp,
            status: 'paid',
            paid_date: paymentData.paid_date || new Date().toISOString().split('T')[0],
            payment_method: paymentData.payment_method || exp.payment_method || 'cash'
          };
        }
        return exp;
      }));
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error marking expense as paid:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // State
    invoices,
    expenses,
    debtors,
    stats,
    loading,
    error,
    
    // Actions
    fetchInvoices,
    fetchExpenses,
    fetchDebtors,
    fetchBillingStats,
    fetchExpenseStats,
    createInvoice,
    createExpense,
    updateInvoice,
    updateExpense,
    deleteInvoice,
    deleteExpense,
    getInvoice,
    getExpense,
    markInvoicePaid,
    markExpensePaid,
    
    // Debtor Contact Management
    fetchDebtorContacts,
    addDebtorContact,
    
    // Utilities
    setError,
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
};
