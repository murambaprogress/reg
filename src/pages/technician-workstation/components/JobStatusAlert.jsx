import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const JobStatusAlert = ({ job, onSendAlert }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alertType, setAlertType] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const alertTypes = [
    { value: 'help_needed', label: 'Need Help', icon: 'HelpCircle', color: 'text-warning' },
    { value: 'parts_needed', label: 'Parts Required', icon: 'Package', color: 'text-accent' },
    { value: 'delay', label: 'Job Delayed', icon: 'Clock', color: 'text-error' },
    { value: 'completed', label: 'Job Completed', icon: 'CheckCircle', color: 'text-success' },
    { value: 'issue', label: 'Issue Found', icon: 'AlertTriangle', color: 'text-error' },
    { value: 'update', label: 'Status Update', icon: 'Info', color: 'text-accent' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!alertType || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await onSendAlert(job.id, {
        type: alertType,
        message: message.trim(),
        jobNumber: job.jobNumber,
        customerName: job.customerName,
        vehicleInfo: job.vehicleInfo
      });
      
      // Reset form
      setAlertType('');
      setMessage('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error sending alert:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAlertType = alertTypes.find(type => type.value === alertType);

  if (!job) {
    return (
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="text-center text-text-secondary">
          <Icon name="AlertCircle" size={32} className="mx-auto mb-2 opacity-50" />
          <p>Select an active job to send status alerts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon name="Bell" size={20} className="text-accent" />
          <h3 className="text-lg font-heading-semibold text-text-primary">Job Status Alert</h3>
        </div>
        <Button
          variant={isOpen ? "outline" : "primary"}
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Icon name={isOpen ? "X" : "Send"} size={16} className="mr-2" />
          {isOpen ? "Cancel" : "Send Alert"}
        </Button>
      </div>

      {/* Current Job Info */}
      <div className="bg-background/50 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="Wrench" size={20} className="text-accent" />
          </div>
          <div className="flex-1">
            <h4 className="font-body-medium text-text-primary">{job.jobNumber}</h4>
            <p className="text-sm text-text-secondary">{job.customerName} - {job.vehicleInfo}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-body-medium ${
              job.status === 'In Progress' ? 'bg-accent/10 text-accent' :
              job.status === 'Paused' ? 'bg-warning/10 text-warning' :
              job.status === 'Completed' ? 'bg-success/10 text-success' :
              'bg-text-secondary/10 text-text-secondary'
            }`}>
              {job.status}
            </span>
          </div>
        </div>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alert Type Selection */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Alert Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {alertTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setAlertType(type.value)}
                  className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                    alertType === type.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-background hover:bg-background/50 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon name={type.icon} size={16} className={alertType === type.value ? 'text-accent' : type.color} />
                  <span className="text-sm font-body-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Message to Admin
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Describe the ${selectedAlertType?.label.toLowerCase() || 'situation'}...`}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-text-secondary mt-1">
              This message will be sent to administrators and supervisors
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setAlertType('');
                setMessage('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!alertType || !message.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Icon name="Send" size={16} className="mr-2" />
                  Send Alert
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Quick Alert Buttons (when form is closed) */}
      {!isOpen && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAlertType('help_needed');
              setMessage('I need assistance with this job.');
              setIsOpen(true);
            }}
            className="flex items-center justify-center space-x-2"
          >
            <Icon name="HelpCircle" size={16} className="text-warning" />
            <span>Need Help</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAlertType('completed');
              setMessage('Job has been completed successfully.');
              setIsOpen(true);
            }}
            className="flex items-center justify-center space-x-2"
          >
            <Icon name="CheckCircle" size={16} className="text-success" />
            <span>Completed</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default JobStatusAlert;
