import React from 'react';
import DebtorsTable from './DebtorsTable';
import { DebtorProvider } from './DebtorContext';

const Debtors = () => (
  <DebtorProvider>
    <div className="bg-surface rounded-lg border border-border shadow-lg p-6 mt-8">
      <h2 className="text-2xl font-heading-semibold text-text-primary mb-4">Debtors</h2>
      <DebtorsTable />
    </div>
  </DebtorProvider>
);

export default Debtors;
