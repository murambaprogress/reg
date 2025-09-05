import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { SalesProvider } from './SalesContext';
import SalesList from './components/SalesList';
import AddSaleModal from './components/AddSaleModal';
import { useSales } from './SalesContext';
import SalesErrorBoundary from './components/SalesErrorBoundary';

const SalesShop = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  
  const handleDeleteSale = (saleId) => {
    // The delete is handled in SalesList component
    console.log('Sale deleted:', saleId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          <div className="bg-surface rounded-lg border border-border shadow-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-heading-semibold text-text-primary">Parts Sales Shop</h1>
                <p className="text-text-secondary mt-1">Sell motor parts and record transactions into the financials</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm text-text-secondary">Total Sales</div>
                </div>
                <button
                  className="modern-button bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow hover:bg-primary/90"
                  onClick={() => setShowAdd(true)}
                >
                  New Sale
                </button>
              </div>
            </div>
            {/* Error boundary for SalesList */}
            <React.Suspense fallback={<div>Loading sales...</div>}>
              <SalesList onEdit={(s) => { setEditingSale(s); setShowAdd(false); }} onDelete={handleDeleteSale} />
            </React.Suspense>
          </div>
        </div>
      </main>
      {/* Only render one modal at a time */}
      <AddSaleModal
        isOpen={showAdd || !!editingSale}
        onClose={() => { setShowAdd(false); setEditingSale(null); }}
        sale={editingSale}
      />
    </div>
  );
};

const WrappedSalesShop = () => (
  <SalesErrorBoundary>
    <SalesProvider>
      <SalesShop />
    </SalesProvider>
  </SalesErrorBoundary>
);

export default WrappedSalesShop;
