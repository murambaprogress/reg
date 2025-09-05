import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const JobAssignment = ({ onStatsUpdate }) => {
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    fetchJobs();
    fetchTechnicians();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/jobs/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      } else {
        setError('Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/technicians`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data.filter(tech => tech.is_active));
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const handleAssignJob = async () => {
    if (!selectedJob || !selectedTechnician) {
      setError('Please select both a job and a technician');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/jobs/${selectedJob.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assigned_technician: selectedTechnician
        })
      });

      if (response.ok) {
        setShowAssignModal(false);
        setSelectedJob(null);
        setSelectedTechnician('');
        fetchJobs();
        onStatsUpdate();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to assign job');
      }
    } catch (error) {
      console.error('Error assigning job:', error);
      setError('Network error occurred');
    }
  };

  const handleUnassignJob = async (jobId) => {
    if (!confirm('Are you sure you want to unassign this job?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/jobs/${jobId}/unassign`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchJobs();
        onStatsUpdate();
      } else {
        setError('Failed to unassign job');
      }
    } catch (error) {
      console.error('Error unassigning job:', error);
      setError('Network error occurred');
    }
  };

  const openAssignModal = (job) => {
    setSelectedJob(job);
    setShowAssignModal(true);
    setError('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-warning/10 text-warning';
      case 'Assigned':
        return 'bg-accent/10 text-accent';
      case 'In Progress':
        return 'bg-primary/10 text-primary';
      case 'Completed':
        return 'bg-success/10 text-success';
      case 'Cancelled':
        return 'bg-error/10 text-error';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'text-error';
      case 'Medium':
        return 'text-warning';
      case 'Low':
        return 'text-success';
      default:
        return 'text-text-secondary';
    }
  };

  const unassignedJobs = jobs.filter(job => !job.assigned_technician);
  const assignedJobs = jobs.filter(job => job.assigned_technician);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading-semibold text-text-primary">Job Assignment</h2>
          <p className="text-sm text-text-secondary">Assign jobs to technicians and monitor progress</p>
        </div>
        <Button
          onClick={fetchJobs}
          variant="outline"
          className="flex items-center space-x-2"
          disabled={loading}
        >
          <Icon name="RefreshCw" size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-error" />
            <span className="text-sm font-body-medium text-error">Error</span>
          </div>
          <p className="text-sm text-error/80 mt-1">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Unassigned Jobs */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-base font-body-semibold text-text-primary">
              Unassigned Jobs ({unassignedJobs.length})
            </h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <Icon name="Loader" size={32} className="mx-auto mb-2 animate-spin text-accent" />
              <p className="text-text-secondary">Loading jobs...</p>
            </div>
          ) : unassignedJobs.length === 0 ? (
            <div className="p-8 text-center">
              <Icon name="CheckCircle" size={48} className="mx-auto mb-4 opacity-50 text-success" />
              <p className="text-lg font-body-medium text-text-secondary">All jobs assigned</p>
              <p className="text-sm text-text-secondary">Great work! No pending assignments</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {unassignedJobs.map((job) => (
                <div key={job.id} className="p-4 hover:bg-background/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-body-semibold text-text-primary">
                          Job #{job.id}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body-medium ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                        <span className={`text-xs font-body-medium ${getPriorityColor(job.priority)}`}>
                          {job.priority} Priority
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-2">{job.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-text-secondary">
                        <span>Customer: {job.customer_name}</span>
                        <span>Vehicle: {job.vehicle_info}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-text-secondary mt-1">
                        <span>Created: {new Date(job.created_at).toLocaleDateString()}</span>
                        {job.due_date && (
                          <span>Due: {new Date(job.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openAssignModal(job)}
                      className="ml-4"
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Jobs */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-base font-body-semibold text-text-primary">
              Assigned Jobs ({assignedJobs.length})
            </h3>
          </div>
          
          {assignedJobs.length === 0 ? (
            <div className="p-8 text-center">
              <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50 text-text-secondary" />
              <p className="text-lg font-body-medium text-text-secondary">No assigned jobs</p>
              <p className="text-sm text-text-secondary">Jobs will appear here once assigned</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {assignedJobs.map((job) => (
                <div key={job.id} className="p-4 hover:bg-background/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-body-semibold text-text-primary">
                          Job #{job.id}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body-medium ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                        <span className={`text-xs font-body-medium ${getPriorityColor(job.priority)}`}>
                          {job.priority} Priority
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-2">{job.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-text-secondary">
                        <span>Customer: {job.customer_name}</span>
                        <span>Vehicle: {job.vehicle_info}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-text-secondary mt-1">
                        <span>Technician: {job.assigned_technician_name}</span>
                        {job.progress_percentage > 0 && (
                          <span>Progress: {job.progress_percentage}%</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnassignJob(job.id)}
                      className="ml-4 text-error hover:bg-error/10"
                    >
                      Unassign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading-semibold text-text-primary">
                Assign Job #{selectedJob.id}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAssignModal(false)}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-background rounded-lg p-4">
                <h4 className="text-sm font-body-semibold text-text-primary mb-2">Job Details</h4>
                <p className="text-sm text-text-secondary mb-1">{selectedJob.description}</p>
                <div className="text-xs text-text-secondary space-y-1">
                  <div>Customer: {selectedJob.customer_name}</div>
                  <div>Vehicle: {selectedJob.vehicle_info}</div>
                  <div>Priority: {selectedJob.priority}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Select Technician
                </label>
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                >
                  <option value="">Choose a technician...</option>
                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.username} ({technician.assigned_jobs_count || 0} jobs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAssignJob}>
                  Assign Job
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobAssignment;
