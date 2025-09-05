import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useInventory } from '../InventoryContext';

const AssignToJobModal = ({ isOpen, onClose, part, onAssign }) => {
  const [selectedJob, setSelectedJob] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const activeJobs = [
    { id: 'JOB001', vehicleInfo: '2020 Honda Civic - ABC123', customer: 'John Smith', technician: 'Mike Johnson' },
    { id: 'JOB002', vehicleInfo: '2019 Toyota Camry - XYZ789', customer: 'Sarah Davis', technician: 'Alex Rodriguez' },
    { id: 'JOB003', vehicleInfo: '2021 Ford F-150 - DEF456', customer: 'Robert Wilson', technician: 'Emily Chen' },
    { id: 'JOB004', vehicleInfo: '2018 BMW 3 Series - GHI789', customer: 'Lisa Anderson', technician: 'David Kim' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedJob || quantity <= 0) return;

    const jobData = activeJobs.find(job => job.id === selectedJob);
    const { assignPart } = useInventory();
    assignPart({ partId: part.id, jobId: selectedJob, quantity: parseInt(quantity), notes })
      .then(() => {
        onAssign({ partId: part.id, jobId: selectedJob, quantity: parseInt(quantity), notes, jobInfo: jobData });
        setSelectedJob('');
        setQuantity(1);
        setNotes('');
        onClose();
      })
      .catch(() => {
        // still close and let caller show error
        onClose();
      });
  };

  if (!isOpen || !part) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal">
      <div className="bg-surface rounded-lg border border-border w-full max-w-md mx-4">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading-medium text-text-primary">Assign Part to Job</h3>
            <Button variant="ghost" onClick={onClose} className="p-2">
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Part Information */}
          <div className="bg-background rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Package" size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-body-medium text-text-primary">{part.partNumber}</p>
                <p className="text-xs text-text-secondary">{part.description}</p>
                <p className="text-xs text-success mt-1">Available: {part.currentStock} {part.unit}</p>
              </div>
            </div>
          </div>

          {/* Job Selection */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Select Job <span className="text-error">*</span>
            </label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              required
              className="w-full p-3 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Choose a job...</option>
              {activeJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.id} - {job.vehicleInfo} ({job.customer})
                </option>
              ))}
            </select>
          </div>

          {/* Selected Job Details */}
          {selectedJob && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              {(() => {
                const job = activeJobs.find(j => j.id === selectedJob);
                return (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon name="Car" size={16} className="text-accent" />
                      <span className="text-sm font-body-medium text-text-primary">{job.vehicleInfo}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon name="User" size={16} className="text-accent" />
                      <span className="text-sm text-text-secondary">Customer: {job.customer}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Icon name="Wrench" size={16} className="text-accent" />
                      <span className="text-sm text-text-secondary">Technician: {job.technician}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Quantity <span className="text-error">*</span>
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={part.currentStock}
              required
              placeholder="Enter quantity"
            />
            <p className="text-xs text-text-secondary mt-1">
              Maximum available: {part.currentStock} {part.unit}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Add any notes about this assignment..."
              className="w-full p-3 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={!selectedJob || quantity <= 0 || quantity > part.currentStock}
            >
              Assign Part
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignToJobModal;