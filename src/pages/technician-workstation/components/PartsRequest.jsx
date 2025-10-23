import React, { useState, useEffect } from 'react';
import { useTechnicianSync } from '../TechnicianSyncContext';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PartsRequest = ({ jobId, onRequestParts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParts, setSelectedParts] = useState([]);
  const [requestNotes, setRequestNotes] = useState('');
  const [availableParts, setAvailableParts] = useState([]);
  const { jobs, activeJob, setActiveJob, partsRequests: contextPartsRequests, requestParts: contextRequestParts, reconcilePartsRequests } = useTechnicianSync();
  const [selectedJobId, setSelectedJobId] = useState(jobId ? Number(jobId) : (activeJob ? activeJob.id : null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE || '/api';

  // Remove auto-fetch on mount. Only fetchAvailableParts on user action.

  useEffect(() => {
    if (jobId && Number(jobId) !== selectedJobId) setSelectedJobId(Number(jobId));
  }, [jobId]);

  const fetchAvailableParts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/inventory/parts/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableParts(data.map(part => ({
          id: part.id,
          // support different possible field names from the backend
          name: part.description || part.name || '',
          partNumber: (part.part_number || part.partNumber || part.part_no || part.partNo || '').toString(),
          // support both snake_case and camelCase stock fields
          stock: Number(part.current_stock ?? part.currentStock ?? part.stock ?? 0),
          // support multiple possible price fields
          price: parseFloat(part.unit_cost ?? part.unitCost ?? part.unit_price ?? part.price) || 0,
          category: part.category?.name || 'Uncategorized',
          location: part.location || 'Unknown',
          supplier: part.supplier || 'Unknown'
        })));
      } else {
        setError('Failed to fetch parts from inventory');
      }
    } catch (err) {
      console.error('Error fetching parts:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // existing requests will come from context; filter for the currently selected job
  const currentJobId = selectedJobId || (jobId ? Number(jobId) : null);
  const existingRequests = (contextPartsRequests || []).filter(r => Number(r.job) === Number(currentJobId));

  // Compute pending quantities per part for the currently selected job only (including optimistic)
  const pendingQtyByPart = (contextPartsRequests || []).reduce((acc, r) => {
    try {
      if (Number(r.job) !== Number(currentJobId)) return acc; // only count requests for this job
      if (r.status === 'pending') {
        const key = (r.part_number || r.partNumber || '').toString();
        acc[key] = (acc[key] || 0) + Number(r.quantity_requested || r.quantity || 0);
      }
    } catch (e) {
      // ignore malformed entries
    }
    return acc;
  }, {});

  // Also compute pending quantities for other jobs (to surface "reserved by others")
  const pendingOtherByPart = (contextPartsRequests || []).reduce((acc, r) => {
    try {
      if (Number(r.job) === Number(currentJobId)) return acc; // skip current job
      if (r.status === 'pending') {
        const key = (r.part_number || r.partNumber || '').toString();
        acc[key] = (acc[key] || 0) + Number(r.quantity_requested || r.quantity || 0);
      }
    } catch (e) {
      // ignore
    }
    return acc;
  }, {});

  const filteredParts = availableParts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePartSelect = (part) => {
    // Respect available stock when selecting
    const existingPart = selectedParts.find(p => p.id === part.id);
    if (existingPart) {
      const newQty = Math.min(existingPart.quantity + 1, part.stock || 0);
      if (newQty === existingPart.quantity) {
        // cannot increase beyond stock
        setError(`Cannot request more than available stock (${part.stock})`);
        setTimeout(() => setError(''), 3000);
        return;
      }
      setSelectedParts(prev => prev.map(p => 
        p.id === part.id ? { ...p, quantity: newQty } : p
      ));
    } else {
      if ((part.stock || 0) <= 0) {
        setError('Part is out of stock');
        setTimeout(() => setError(''), 3000);
        return;
      }
      setSelectedParts(prev => [...prev, { ...part, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (partId, quantity) => {
    if (quantity <= 0) {
      setSelectedParts(prev => prev.filter(p => p.id !== partId));
    } else {
      setSelectedParts(prev => prev.map(p => {
        if (p.id !== partId) return p;
        const capped = Math.min(quantity, p.stock || 0);
        if (capped < quantity) {
          setError(`Limited to available stock: ${p.stock}`);
          setTimeout(() => setError(''), 3000);
        }
        return { ...p, quantity: capped };
      }));
    }
  };

  const handleSubmitRequest = () => {
    const targetJobId = currentJobId;
    if (!targetJobId) {
      setError('No job selected. Please select or open a job before requesting parts.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    if (selectedParts.length > 0) {
      // Use context to perform optimistic update and server request
      contextRequestParts(targetJobId, selectedParts, requestNotes)
        .then(() => {
          // Reconcile with server to make sure any server-side fields (ids etc) are synced
          reconcilePartsRequests();
        })
        .catch(err => {
          console.error('Parts request failed:', err);
          setError(err.message || 'Failed to submit parts request');
          setTimeout(() => setError(''), 4000);
        });
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

      {/* Job selector: choose which job these parts are for */}
      <div className="mb-4">
        <label className="text-sm text-text-secondary block mb-1">Select Job</label>
        <div className="flex items-center space-x-2">
          <select
            value={selectedJobId ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setSelectedJobId(val);
              if (val && jobs && Array.isArray(jobs)) {
                const jobObj = jobs.find(j => j.id === val);
                if (jobObj) setActiveJob(jobObj);
              } else if (val === null) {
                setActiveJob(null);
              }
            }}
            className="px-3 py-2 border border-border rounded bg-surface"
          >
            <option value="">-- Select a job --</option>
            {(jobs || []).map(job => (
              <option key={job.id} value={job.id}>
                {job.jobNumber ? `${job.jobNumber} • ${job.customerName}` : `Job ${job.id}`}
              </option>
            ))}
          </select>
          {activeJob && (
            <div className="text-sm text-text-secondary">Active: {activeJob.jobNumber || `Job ${activeJob.id}`}</div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-error" />
            <span className="text-sm font-body-medium text-error">Error</span>
          </div>
          <p className="text-sm text-error/80 mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAvailableParts}
            className="mt-2"
          >
            <Icon name="RefreshCw" size={14} className="mr-2" />
            Retry
          </Button>
        </div>
      )}

      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search parts by name or part number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-heading-medium text-text-primary">Available Parts</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAvailableParts}
              disabled={loading}
              className="text-xs"
            >
              <Icon name="RefreshCw" size={12} className={loading ? 'animate-spin mr-1' : 'mr-1'} />
              Refresh
            </Button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader" size={24} className="animate-spin text-accent mr-2" />
              <span className="text-sm text-text-secondary">Loading parts...</span>
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="Package" size={48} className="mx-auto mb-4 opacity-50 text-text-secondary" />
              <p className="text-text-secondary">
                {searchTerm ? 'No parts found matching your search' : 'No parts available'}
              </p>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredParts.map(part => {
                // Adjust displayed stock by subtracting pending requests
                const pendingForPart = pendingQtyByPart[part.partNumber] || 0;
                const pendingOther = pendingOtherByPart[part.partNumber] || 0;
                const displayedStock = Math.max(0, (part.stock || 0) - pendingForPart);
                // Use base stock to compute overall stock status, but show available (displayedStock)
                const baseStockStatus = getStockStatus(part.stock || 0);
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
                        <span className={`text-xs ${baseStockStatus.color}`} title={`Available: ${displayedStock} (Reserved by this job: ${pendingForPart}, other jobs: ${pendingOther})`}>
                          {displayedStock} {baseStockStatus.label}
                        </span>
                        {pendingOther > 0 && (
                          <span className="text-xxs ml-2 px-2 py-0.5 rounded bg-warning/10 text-warning">Reserved by others: {pendingOther}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handlePartSelect(part)}
                      disabled={displayedStock === 0}
                      className="text-sm"
                    >
                      <Icon name="Plus" size={16} />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-heading-medium text-text-primary mb-3">
            Selected Parts ({selectedParts.length})
          </h4>
          {/* Existing requests for this job */}
          {existingRequests.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-body-medium text-text-primary mb-2">Existing Parts Requests for this Job</h5>
              <div className="space-y-2">
                {existingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-2 bg-background rounded">
                    <div>
                      <p className="text-sm font-body-medium">{req.part_name}</p>
                      <p className="text-xs text-text-secondary">Part #: {req.part_number} • Qty: {req.quantity_requested}</p>
                    </div>
                    <div className="text-right flex items-center space-x-2">
                      {req._optimistic && (
                        <Icon name="Loader" size={14} className="animate-spin text-warning" />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs ${req.status === 'pending' ? 'text-warning bg-warning/10' : req.status === 'approved' ? 'text-success bg-success/10' : req.status === 'rejected' ? 'text-error bg-error/10' : 'text-info bg-info/10'}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                        disabled={(() => {
                          // Determine displayed stock for this part when selected
                          const pending = pendingQtyByPart[part.partNumber] || 0;
                          const baseStock = part.stock || 0;
                          const displayed = Math.max(0, baseStock - pending);
                          return part.quantity >= displayed;
                        })()}
                        className="p-1"
                        title={(() => {
                          const pending = pendingQtyByPart[part.partNumber] || 0;
                          const displayed = Math.max(0, (part.stock || 0) - pending);
                          return part.quantity >= displayed ? `Max available: ${displayed}` : 'Increase quantity';
                        })()}
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
                {error && (
                  <div className="text-sm text-error mb-2">{error}</div>
                )}
                
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
