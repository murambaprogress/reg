import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const JobStatusUpdateModal = ({ job, isOpen, onClose, onUpdateStatus }) => {
  const [selectedStatus, setSelectedStatus] = useState(job?.status || 'in_progress');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Update selected status when job changes
  useEffect(() => {
    if (job) {
      setSelectedStatus(job.status || 'in_progress');
    }
  }, [job]);

  // Available status options for technicians
  const statusOptions = useMemo(() => [
    { value: 'in_progress', label: 'In Progress', description: 'Currently working on the job', icon: 'Wrench', color: 'text-accent' },
    { value: 'completed', label: 'Completed', description: 'Job fully completed and delivered', icon: 'CheckCircle', color: 'text-success' },
    { value: 'ready_to_collect', label: 'Ready to Collect', description: 'Job completed, ready for customer pickup', icon: 'Car', color: 'text-success' },
    { value: 'on_hold', label: 'On Hold', description: 'Temporarily paused work', icon: 'Pause', color: 'text-warning' },
    { value: 'pending', label: 'Pending', description: 'Job is waiting to be started', icon: 'Clock', color: 'text-warning' }
  ], []);

  const handleUpdateStatus = useCallback(async () => {
    if (!selectedStatus) return;

    setIsUpdating(true);
    try {
      await onUpdateStatus(job.id, selectedStatus, notes);
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error updating job status:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [job?.id, selectedStatus, notes, onUpdateStatus, onClose]);

  const selectedOption = useMemo(() => 
    statusOptions.find(option => option.value === selectedStatus),
    [statusOptions, selectedStatus]
  );

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg border border-border shadow-modal w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-heading-semibold text-text-primary">Update Job Status</h2>
            <p className="text-sm text-text-secondary mt-1">
              {job.jobNumber} - {job.customerName}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="p-2"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div className="bg-background rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Info" size={16} className="text-accent" />
              <span className="text-sm font-body-medium text-text-primary">Current Status</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                {job.status}
              </span>
              <span className="text-sm text-text-secondary">
                Since {new Date(job.updatedAt || job.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-3">
              New Status
            </label>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <div
                  key={option.value}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedStatus === option.value
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50'
                  }`}
                  onClick={() => setSelectedStatus(option.value)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Icon name={option.icon} size={20} className={option.color} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-body-medium text-text-primary">
                          {option.label}
                        </span>
                        {selectedStatus === option.value && (
                          <Icon name="Check" size={16} className="text-accent" />
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this status change..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Status Change Preview */}
          {selectedOption && selectedStatus !== job.status && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="ArrowRight" size={16} className="text-accent" />
                <span className="text-sm font-body-medium text-accent">Status Change Preview</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                  {job.status}
                </span>
                <Icon name="ArrowRight" size={14} className="text-text-secondary" />
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedOption.color === 'text-success' ? 'bg-success/10 text-success' :
                  selectedOption.color === 'text-warning' ? 'bg-warning/10 text-warning' :
                  selectedOption.color === 'text-info' ? 'bg-info/10 text-info' :
                  'bg-accent/10 text-accent'
                }`}>
                  {selectedOption.label}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateStatus}
            disabled={isUpdating || selectedStatus === job.status}
          >
            {isUpdating ? (
              <>
                <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                Update Status
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobStatusUpdateModal;
