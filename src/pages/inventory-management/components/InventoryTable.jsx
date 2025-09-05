import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useInventory } from '../InventoryContext';

const InventoryTable = ({ 
  parts, 
  selectedParts, 
  onPartSelect, 
  onSelectAll, 
  onEditPart, 
  onAssignToJob, 
  onViewHistory,
  sortConfig,
  onSort 
}) => {
  const { exportParts, fetchPartHistory, prompt, openHistory, reorderPart } = useInventory();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getSortIcon = (column) => {
    if (sortConfig.key !== column) return 'ArrowUpDown';
    return sortConfig.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const getStockStatus = (current, minimum) => {
    if (current === 0) return { status: 'out-of-stock', color: 'text-error', bg: 'bg-error/10' };
    if (current <= minimum) return { status: 'low-stock', color: 'text-warning', bg: 'bg-warning/10' };
    return { status: 'in-stock', color: 'text-success', bg: 'bg-success/10' };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate total inventory value (unitCost * currentStock)
  const totalInventoryValue = parts.reduce((sum, part) => {
    const cost = Number(part.unit_cost ?? part.unitCost) || 0;
    const qty = Number(part.current_stock ?? part.currentStock) || 0;
    return sum + (cost * qty);
  }, 0);

  const totalPages = Math.ceil(parts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParts = parts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-surface rounded-lg border border-border">
      {/* Table Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-heading-medium text-text-primary">Parts Inventory</h3>
            <span className="text-sm text-text-secondary">
              {parts.length} items • {selectedParts.length} selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" iconName="Download" onClick={() => exportParts().catch(() => window.__SHOW_TOAST && window.__SHOW_TOAST('Export failed', 'error'))}>
              Export CSV
            </Button>
            {/* Scan Barcode removed */}
            <Button variant="primary" iconName="Plus" onClick={() => onEditPart(null)}>
              Add Part
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedParts.length === parts.length && parts.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-border focus:ring-accent"
                />
              </th>
              {[
                { key: 'partNumber', label: 'Part Number' },
                { key: 'description', label: 'Description' },
                { key: 'currentStock', label: 'Current Stock' },
                { key: 'minimumThreshold', label: 'Min. Threshold' },
                { key: 'supplier', label: 'Supplier' },
                { key: 'unitCost', label: 'Unit Cost' },
                { key: 'status', label: 'Status' }
              ].map((column) => (
                <th key={column.key} className="p-4 text-left">
                  <button
                    onClick={() => onSort(column.key)}
                    className="flex items-center space-x-1 text-sm font-heading-medium text-text-primary hover:text-accent micro-interaction"
                  >
                    <span>{column.label}</span>
                    <Icon name={getSortIcon(column.key)} size={14} />
                  </button>
                </th>
              ))}
              <th className="p-4 text-left">
                <span className="text-sm font-heading-medium text-text-primary">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
              {currentParts.map((part) => {
              const stockStatus = getStockStatus(part.current_stock ?? part.currentStock, part.minimum_threshold ?? part.minimumThreshold);
              return (
                <tr key={part.id} className="border-t border-border hover:bg-background/50 micro-transition">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedParts.includes(part.id)}
                      onChange={() => onPartSelect(part.id)}
                      className="rounded border-border focus:ring-accent"
                    />
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-data-normal text-text-primary">{part.part_number ?? part.partNumber}</span>
                  </td>
                  <td className="p-4">
                    <div>
                      <span className="text-sm font-body-medium text-text-primary">{part.description}</span>
                      <p className="text-xs text-text-secondary mt-1">{(part.category && part.category.name) || part.category}</p>
                    </div>
                  </td>
                  <td className="p-4">
                      <span className={`text-sm font-body-medium ${stockStatus.color}`}>
                      {part.current_stock ?? part.currentStock} {part.unit}
                    </span>
                  </td>
                  <td className="p-4">
                      <span className="text-sm text-text-secondary">
                      {part.minimum_threshold ?? part.minimumThreshold} {part.unit}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-text-primary">{part.supplier}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-data-normal text-text-primary">
                      {formatCurrency(part.unit_cost ?? part.unitCost)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-body-medium ${stockStatus.bg} ${stockStatus.color}`}>
                      {stockStatus.status === 'in-stock' && 'In Stock'}
                      {stockStatus.status === 'low-stock' && 'Low Stock'}
                      {stockStatus.status === 'out-of-stock' && 'Out of Stock'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        onClick={() => onEditPart(part)}
                        className="p-2"
                      >
                        <Icon name="Edit" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => onAssignToJob(part)}
                        className="p-2"
                      >
                        <Icon name="UserPlus" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          // prompt for quantity then optional notes
                            prompt({ title: 'Quantity to add', placeholder: 'e.g. 10', defaultValue: '1' }).then(val => {
                            const qty = parseInt(val) || 0;
                            if (!qty) return;
                            prompt({ title: 'Notes (optional)', placeholder: 'Supplier, batch, notes', defaultValue: '' }).then(notes => {
                              reorderPart({ partId: part.id, quantity: qty, notes }).then(() => window.__SHOW_TOAST && window.__SHOW_TOAST('Stock added', 'success')).catch(err => {
                                const msg = (err && err.message) ? err.message : 'Failed to add stock';
                                window.__SHOW_TOAST && window.__SHOW_TOAST(msg, 'error');
                              });
                            });
                          });
                        }}
                        className="p-2"
                      >
                        <Icon name="PlusSquare" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          fetchPartHistory(part.id).then(data => {
                            const entries = Array.isArray(data) ? data : [];
                            openHistory('Part History', entries);
                          }).catch(() => window.__SHOW_TOAST && window.__SHOW_TOAST('Failed to fetch history', 'error'));
                        }}
                        className="p-2"
                      >
                        <Icon name="History" size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {/* Totals Row */}
            <tr className="bg-background/75 font-heading-medium text-text-primary">
              <td className="p-4" colSpan={6}></td>
              <td className="p-4 border-t border-border" colSpan={2}>
                Total Inventory Value: {formatCurrency(totalInventoryValue)}
              </td>
              <td className="p-4 border-t border-border"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              Showing {startIndex + 1}-{Math.min(endIndex, parts.length)} of {parts.length} items
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                iconName="ChevronLeft"
              />
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "primary" : "outline"}
                  onClick={() => handlePageChange(page)}
                  className="w-10 h-10"
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                iconName="ChevronRight"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;