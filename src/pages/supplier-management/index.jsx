import React, { useState } from 'react';
import { SupplierProvider } from './SupplierContext';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import SupplierList from './components/SupplierList';
import AddSupplierModal from './components/AddSupplierModal';

const SupplierManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          <div className="bg-surface rounded-lg border border-border shadow-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-heading-semibold text-text-primary">Suppliers</h1>
                <p className="text-text-secondary mt-1">Manage supplier records, payments, and due dates</p>
              </div>
              <button
                className="modern-button bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow hover:bg-primary/90"
                onClick={() => setShowAddModal(true)}
              >
                Add Supplier
              </button>
            </div>
            <SupplierList />
          </div>
        </div>
      </main>
      <AddSupplierModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
};

const WrappedSupplierManagement = () => (
  <SupplierProvider>
    <SupplierManagement />
  </SupplierProvider>
);

export default WrappedSupplierManagement;
