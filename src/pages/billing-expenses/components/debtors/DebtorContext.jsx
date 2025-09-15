import React, { createContext, useContext, useEffect } from 'react';
import { useBilling } from '../../BillingContext';

const DebtorContext = createContext();

export const DebtorProvider = ({ children }) => {
  const { debtors, fetchDebtors, loading, error } = useBilling();

  useEffect(() => {
    // Initial fetch (billing page already triggers, but safe if direct load)
    fetchDebtors();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DebtorContext.Provider value={{ debtors, loading, error }}>
      {children}
    </DebtorContext.Provider>
  );
};

export const useDebtors = () => useContext(DebtorContext);
