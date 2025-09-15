import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ReassignJobModal = ({ job, technicians, onReassign, onClose }) => {
  const [formData, setFormData] = useState({
    technician_id: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.technician_id) {
      alert('Please select a technician');
      return;
    }

    setLoading(true);
    try {
      await onReassign(job.id, formData.technician_id, formData.reason);
      onClose();
    } catch (error) {
      console.error('Error reassigning job:', error);
      alert('Failed to reassign job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg border border-border p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading-semibold text-text-primary">
            Reassign Job #{job.id}
          </h2>
          <Button variant="ghost" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Current Assignment
            </label>
            <div className="p-3 bg-muted rounded-lg text-sm text-text-secondary">
              {job.assigned_technician ? 
                `${job.assigned_technician.username} (${job.assigned_technician.email})` : 
                'Unassigned'
              }
            </div>
          </div>

          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              New Technician *
            </label>
            <select
              name="technician_id"
              value={formData.technician_id}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">Select Technician</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>
                  {tech.username} - {tech.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-body-medium text-text-primary mb-2">
              Reason for Reassignment
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Optional: Explain why this job is being reassigned..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Reassigning...' : 'Reassign Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReassignJobModal;
