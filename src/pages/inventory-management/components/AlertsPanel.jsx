import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useInventory } from '../InventoryContext';

const AlertsPanel = ({ lowStockAlerts, recentTransactions, onReorderPart, onViewTransaction }) => {
  const { reorderPart, prompt } = useInventory();
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'stock-in': return 'ArrowDown';
      case 'stock-out': return 'ArrowUp';
      case 'adjustment': return 'Edit';
      case 'transfer': return 'ArrowRightLeft';
      default: return 'Package';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'stock-in': return 'text-success';
      case 'stock-out': return 'text-error';
      case 'adjustment': return 'text-warning';
      case 'transfer': return 'text-accent';
      default: return 'text-text-secondary';
    }
  };

  const totalParts = recentTransactions.length > 0 ? new Set(recentTransactions.map(t => t.part && t.part.part_number)).size : 0;
  const totalValue = recentTransactions.reduce((s, t) => s + (Number(t.value) || 0), 0) || 0;
  const outOfStock = lowStockAlerts.filter(a => (a.currentStock ?? 0) === 0).length;

  return (
    <div className="space-y-6">
      {/* Low Stock Alerts */}
      <div className="bg-surface rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading-medium text-text-primary">Low Stock Alerts</h3>
            <span className="bg-warning/10 text-warning px-2 py-1 rounded-full text-xs font-body-medium">
              {lowStockAlerts.length} items
            </span>
          </div>
        </div>
        <div className="p-4">
          {lowStockAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="CheckCircle" size={48} className="text-success mx-auto mb-3" />
              <p className="text-sm text-text-secondary">All items are well stocked</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                      <Icon name="AlertTriangle" size={20} className="text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-body-medium text-text-primary">{alert.partNumber}</p>
                      <p className="text-xs text-text-secondary">{alert.description}</p>
                      <p className="text-xs text-warning mt-1">
                        {alert.currentStock} left (Min: {alert.minimumThreshold})
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      prompt({ title: 'Quantity to reorder', placeholder: '10', defaultValue: '10' }).then(val => {
                        const qty = parseInt(val) || 0;
                        if (!qty) return;
                        prompt({ title: 'Notes (optional)', placeholder: 'Supplier, batch, notes', defaultValue: '' }).then(notes => {
                          reorderPart({ partId: alert.id, quantity: qty, notes }).then(() => window.__SHOW_TOAST && window.__SHOW_TOAST('Reordered', 'success')).catch(() => window.__SHOW_TOAST && window.__SHOW_TOAST('Reorder failed', 'error'));
                        });
                      });
                    }}
                    className="text-xs"
                  >
                    Reorder
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-surface rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading-medium text-text-primary">Recent Transactions</h3>
            <Button variant="text" className="text-xs">
              View All
            </Button>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-background rounded-lg micro-transition">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center">
                    <Icon 
                      name={getTransactionIcon(transaction.type)} 
                      size={16} 
                      className={getTransactionColor(transaction.type)}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-body-medium text-text-primary">{transaction.partNumber}</p>
                    <p className="text-xs text-text-secondary">
                      {transaction.type === 'stock-in' && `+${transaction.quantity} added`}
                      {transaction.type === 'stock-out' && `-${transaction.quantity} used`}
                      {transaction.type === 'adjustment' && `Adjusted by ${transaction.quantity}`}
                      {transaction.type === 'transfer' && `Transferred ${transaction.quantity}`}
                    </p>
                    <p className="text-xs text-text-secondary">{formatDate(transaction.timestamp)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-data-normal text-text-primary">
                    {formatCurrency(transaction.value)}
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => onViewTransaction(transaction)}
                    className="p-1 mt-1"
                  >
                    <Icon name="Eye" size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-surface rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-heading-medium text-text-primary">Quick Actions</h3>
        </div>
        <div className="p-4 space-y-3">
          <Button variant="outline" fullWidth iconName="Plus">
            Add New Part
          </Button>
          <Button variant="outline" fullWidth iconName="FileText">
            Generate Report
          </Button>
          <Button variant="outline" fullWidth iconName="Settings">
            Inventory Settings
          </Button>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="bg-surface rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-heading-medium text-text-primary">Inventory Summary</h3>
        </div>
          <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Total Parts</span>
            <span className="text-sm font-body-medium text-text-primary">{totalParts}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Total Value</span>
            <span className="text-sm font-body-medium text-text-primary">{formatCurrency(totalValue)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Low Stock Items</span>
            <span className="text-sm font-body-medium text-warning">{lowStockAlerts.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Out of Stock</span>
            <span className="text-sm font-body-medium text-error">{outOfStock}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;