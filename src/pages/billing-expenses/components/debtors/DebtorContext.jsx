import React, { createContext, useContext, useState } from 'react';

const DebtorContext = createContext();

const initialDebtors = [
  {
    id: 1,
    name: 'John Doe',
    amount: 500,
    state: 'overdue',
    dueDate: '2025-08-10',
    productsSupplied: 'Car Repair',
    previous: [
      { date: '2025-07-10', amount: 300 },
      { date: '2025-06-10', amount: 200 },
    ],
    future: [
      { date: '2025-09-10', amount: 400 },
    ],
    payments: [
      { date: '2025-07-15', amount: 300 },
    ],
  },
  {
    id: 2,
    name: 'Jane Smith',
    amount: 200,
    state: 'due',
    dueDate: '2025-08-20',
    productsSupplied: 'Diagnostics',
    previous: [
      { date: '2025-07-20', amount: 150 },
    ],
    future: [
      { date: '2025-09-20', amount: 250 },
    ],
    payments: [
      { date: '2025-07-25', amount: 150 },
    ],
  },
  {
    id: 3,
    name: 'Bob Lee',
    amount: 100,
    state: 'paid',
    dueDate: '2025-08-01',
    productsSupplied: 'Battery Replacement',
    previous: [
      { date: '2025-07-01', amount: 100 },
    ],
    future: [],
    payments: [
      { date: '2025-08-01', amount: 100 },
    ],
  },
];

export const DebtorProvider = ({ children }) => {
  const [debtors, setDebtors] = useState(initialDebtors);
  return (
    <DebtorContext.Provider value={{ debtors, setDebtors }}>
      {children}
    </DebtorContext.Provider>
  );
};

export const useDebtors = () => useContext(DebtorContext);
