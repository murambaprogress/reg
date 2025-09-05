
import React, { useState, useMemo, useEffect } from 'react';
import { InventoryProvider, useInventory } from './InventoryContext';
import { ToastProvider } from '../../components/ui/Toast';
import { PromptModal, HistoryModal } from '../../components/ui/Modals';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import Icon from '../../components/AppIcon';
import Input from '../../components/ui/Input';
import CategorySidebar from './components/CategorySidebar';
import InventoryTable from './components/InventoryTable';
import AlertsPanel from './components/AlertsPanel';
import AssignToJobModal from './components/AssignToJobModal';
import EditPartModal from './components/EditPartModal';

const InventoryManagement = () => {
  const { parts = [], categories = [], lowStockAlerts = [], recentTransactions = [], searchParts, promptState, closePrompt, historyState, closeHistory } = useInventory() || {};
  const [filters, setFilters] = useState({ search: '', supplier: '', stockStatus: 'all', priceRange: { min: '', max: '' } });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedParts, setSelectedParts] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });

  const handleCategorySelect = (cat) => setSelectedCategory(cat);
  const handleFilterChange = (newFilters) => setFilters(newFilters);
  const handlePartSelect = (id) => setSelectedParts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleSelectAll = () => setSelectedParts(parts.map(p => p.id));
  const handleEditPart = (part) => { setSelectedPart(part); setShowEditModal(true); };
  const handleAssignToJob = (part) => { setSelectedPart(part); setShowAssignModal(true); };
  const handleViewHistory = (part) => {};
  const handleReorderPart = (part) => {};
  const handleViewTransaction = (transaction) => {};
  const handleAssignPart = (assignmentData) => setShowAssignModal(false);
  const handleSavePart = (updatedPart) => setShowEditModal(false);
  const handleSort = (config) => setSortConfig(config);

  const filteredParts = useMemo(() => {
    let filtered = parts || [];
    if (selectedCategory !== 'all') {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) filtered = filtered.filter(p => (p.category === category.name) || (p.category === category.id));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(part => (String(part.part_number ?? part.partNumber ?? '')).toLowerCase().includes(q) || (String(part.description ?? '')).toLowerCase().includes(q));
    }
    if (filters.supplier) filtered = filtered.filter(part => part.supplier === filters.supplier);
    if (filters.stockStatus !== 'all') {
      if (filters.stockStatus === 'in-stock') filtered = filtered.filter(p => Number(p.current_stock ?? p.currentStock) > Number(p.minimum_threshold ?? p.minimumThreshold));
      if (filters.stockStatus === 'low-stock') filtered = filtered.filter(p => Number(p.current_stock ?? p.currentStock) <= Number(p.minimum_threshold ?? p.minimumThreshold) && Number(p.current_stock ?? p.currentStock) > 0);
      if (filters.stockStatus === 'out-of-stock') filtered = filtered.filter(p => Number(p.current_stock ?? p.currentStock) === 0);
    }
    return filtered;
  }, [parts, categories, selectedCategory, filters]);

  useEffect(() => {
    if (!searchParts) return;
    const t = setTimeout(() => searchParts(filters.search || ''), 350);
    return () => clearTimeout(t);
  }, [filters.search, searchParts]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-heading-semibold text-text-primary">Inventory Management</h1>
                <p className="text-text-secondary mt-1">Track parts, monitor stock levels, and manage inventory</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => { setSelectedPart(null); setShowAddModal(true); }}
                  className="modern-button bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow hover:bg-primary/90 flex items-center gap-2"
                >
                  <Icon name="Plus" size={16} />
                  Add Part
                </button>
                <div className="relative">
                  <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                  <Input
                    type="search"
                    placeholder="Search parts..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                    className="pl-10 w-80"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-3">
              <CategorySidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={handleCategorySelect}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
            <div className="col-span-12 lg:col-span-6">
              <InventoryTable
                parts={filteredParts}
                selectedParts={selectedParts}
                onPartSelect={handlePartSelect}
                onSelectAll={handleSelectAll}
                onEditPart={handleEditPart}
                onAssignToJob={handleAssignToJob}
                onViewHistory={handleViewHistory}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-12 lg:col-span-3">
              <AlertsPanel
                lowStockAlerts={lowStockAlerts}
                recentTransactions={recentTransactions}
                onReorderPart={handleReorderPart}
                onViewTransaction={handleViewTransaction}
              />
            </div>
          </div>
        </div>
      </div>

      <AssignToJobModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        part={selectedPart}
        onAssign={handleAssignPart}
      />
      <EditPartModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        part={selectedPart}
        onSave={handleSavePart}
      />
      <EditPartModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        part={null}
        onSave={() => setShowAddModal(false)}
      />

      <PromptModal
        isOpen={promptState?.open}
        title={promptState?.title}
        placeholder={promptState?.placeholder}
        defaultValue={promptState?.defaultValue}
        onCancel={() => closePrompt(null)}
        onConfirm={(v) => closePrompt(v)}
      />
      <HistoryModal
        isOpen={historyState?.open}
        title={historyState?.title}
        entries={historyState?.entries}
        onClose={() => closeHistory()}
      />
    </div>
  );
};

const WrappedInventoryManagement = () => (
  <ToastProvider>
    <InventoryProvider>
      <InventoryManagement />
    </InventoryProvider>
  </ToastProvider>
);

export default WrappedInventoryManagement;
