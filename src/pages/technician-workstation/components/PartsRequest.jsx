import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PartsRequest = ({ jobId, onRequestParts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParts, setSelectedParts] = useState([]);
  const [requestNotes, setRequestNotes] = useState('');

  const availableParts = [
    { id: 'P001', name: 'Brake Pads - Front', partNumber: 'BP-F-001', stock: 15, price: 45.99 },
    { id: 'P002', name: 'Oil Filter', partNumber: 'OF-001', stock: 8, price: 12.50 },
    { id: 'P003', name: 'Air Filter', partNumber: 'AF-001', stock: 12, price: 18.75 },
    { id: 'P004', name: 'Spark Plugs (Set of 4)', partNumber: 'SP-004', stock: 6, price: 32.00 },
    { id: 'P005', name: 'Brake Fluid', partNumber: 'BF-001', stock: 20, price: 8.99 },
    { id: 'P006', name: 'Transmission Fluid', partNumber: 'TF-001', stock: 3, price: 24.50 },
    { id: 'P007', name: 'Windshield Wipers', partNumber: 'WW-001', stock: 10, price: 22.99 },
    { id: 'P008', name: 'Battery', partNumber: 'BAT-001', stock: 4, price: 89.99 }
  ];

  const filteredParts = availableParts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePartSelect = (part) => {
    const existingPart = selectedParts.find(p => p.id === part.id);
    if (existingPart) {
      setSelectedParts(prev => prev.map(p => 
        p.id === part.id ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedParts(prev => [...prev, { ...part, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (partId, quantity) => {
    if (quantity <= 0) {
      setSelectedParts(prev => prev.filter(p => p.id !== partId));
    } else {
      setSelectedParts(prev => prev.map(p => 
        p.id === partId ? { ...p, quantity: Math.min(quantity, p.stock) } : p
      ));
    }
  };

  const handleSubmitRequest = () => {
    if (selectedParts.length > 0) {
      onRequestParts(jobId, selectedParts, requestNotes);
      setSelectedParts([]);
      setRequestNotes('');
      setSearchTerm('');
    }
  };

  const totalCost = selectedParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);

  const getStockStatus = (stock) => {
    if (stock <= 3) return { color: 'text-error', label: 'Low Stock' };
    if (stock <= 10) return { color: 'text-warning', label: 'Medium Stock' };
    return { color: 'text-success', label: 'In Stock' };
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading-semibold text-text-primary">Parts Request</h3>
        <div className="flex items-center space-x-2">
          <Icon name="Package" size={16} className="text-text-secondary" />
          <span className="text-sm text-text-secondary">Inventory Lookup</span>
        </div>
      </div>

      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search parts by name or part number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-heading-medium text-text-primary mb-3">Available Parts</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredParts.map(part => {
              const stockStatus = getStockStatus(part.stock);
              return (
                <div
                  key={part.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-background micro-interaction"
                >
                  <div className="flex-1">
                    <h5 className="text-sm font-body-medium text-text-primary">{part.name}</h5>
                    <p className="text-xs text-text-secondary">{part.partNumber}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm font-body-medium text-text-primary">${part.price}</span>
                      <span className={`text-xs ${stockStatus.color}`}>
                        {part.stock} {stockStatus.label}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handlePartSelect(part)}
                    disabled={part.stock === 0}
                    className="text-sm"
                  >
                    <Icon name="Plus" size={16} />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-heading-medium text-text-primary mb-3">
            Selected Parts ({selectedParts.length})
          </h4>
          {selectedParts.length > 0 ? (
            <div className="space-y-3">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedParts.map(part => (
                  <div key={part.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex-1">
                      <h5 className="text-sm font-body-medium text-text-primary">{part.name}</h5>
                      <p className="text-xs text-text-secondary">{part.partNumber}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleQuantityChange(part.id, part.quantity - 1)}
                        className="p-1"
                      >
                        <Icon name="Minus" size={14} />
                      </Button>
                      <span className="text-sm font-data-normal w-8 text-center">{part.quantity}</span>
                      <Button
                        variant="ghost"
                        onClick={() => handleQuantityChange(part.id, part.quantity + 1)}
                        disabled={part.quantity >= part.stock}
                        className="p-1"
                      >
                        <Icon name="Plus" size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-body-medium text-text-primary">Total Cost:</span>
                  <span className="text-lg font-heading-semibold text-text-primary">${totalCost.toFixed(2)}</span>
                </div>
                
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Add notes for parts request..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none mb-3"
                />
                
                <Button
                  variant="primary"
                  onClick={handleSubmitRequest}
                  fullWidth
                  className="text-sm"
                >
                  <Icon name="Send" size={16} className="mr-2" />
                  Submit Parts Request
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon name="Package" size={48} className="text-text-secondary mx-auto mb-3" />
              <p className="text-text-secondary">No parts selected</p>
              <p className="text-sm text-text-secondary mt-1">
                Search and select parts needed for this job
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartsRequest;