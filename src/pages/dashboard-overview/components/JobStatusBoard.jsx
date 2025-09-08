import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const JobStatusBoard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE || 'https://progress.pythonanywhere.com/api';

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/dashboard/active-jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'in-progress': 'bg-accent text-accent-foreground',
      'pending': 'bg-warning text-warning-foreground',
      'completed': 'bg-success text-success-foreground'
    };
    return colors[status] || 'bg-secondary text-secondary-foreground';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': 'text-error',
      'medium': 'text-warning',
      'low': 'text-success'
    };
    return colors[priority] || 'text-text-secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'in-progress': 'Clock',
      'pending': 'AlertCircle',
      'completed': 'CheckCircle'
    };
    return icons[status] || 'Circle';
  };

  return (
    <div className="bg-surface rounded-lg shadow-card border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading-semibold text-text-primary">Job Status Board</h2>
          <div className="flex items-center space-x-2">
            <Icon name="RefreshCw" size={16} className="text-text-secondary" />
            <span className="text-sm text-text-secondary">Live Updates</span>
          </div>
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Icon name="Loader" size={32} className="animate-spin text-accent" />
            <span className="ml-2 text-text-secondary">Loading jobs...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Briefcase" size={48} className="mx-auto mb-4 opacity-50 text-text-secondary" />
            <p className="text-lg font-body-medium text-text-secondary">No active jobs</p>
            <p className="text-sm text-text-secondary">Jobs will appear here when they are created</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {jobs.map((job) => (
            <div key={job.id} className="border border-border rounded-lg p-4 micro-interaction hover:shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-body-medium ${getStatusColor(job.status)}`}>
                    <div className="flex items-center space-x-1">
                      <Icon name={getStatusIcon(job.status)} size={12} />
                      <span className="capitalize">{job.status.replace('-', ' ')}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-body-medium ${getPriorityColor(job.priority)}`}>
                    {job.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
                <span className="text-sm font-data-normal text-text-secondary">{job.id}</span>
              </div>
              
              <div className="mb-3">
                <h3 className="text-sm font-heading-medium text-text-primary mb-1">{job.vehicle}</h3>
                <p className="text-sm text-text-secondary">Customer: {job.customer}</p>
                <p className="text-sm text-text-secondary">Technician: {job.technician}</p>
              </div>

              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {job.services.map((service, index) => (
                    <span key={index} className="px-2 py-1 bg-background text-text-secondary text-xs rounded">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {job.status === 'in-progress' && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">Progress</span>
                    <span className="text-xs font-data-normal text-text-primary">{job.progress}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full state-transition" 
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-text-secondary">
                <div className="flex items-center space-x-1">
                  <Icon name="Clock" size={12} />
                  <span>Est. {job.estimatedTime}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="micro-interaction hover:text-text-primary">
                    <Icon name="Eye" size={14} />
                  </button>
                  <button className="micro-interaction hover:text-text-primary">
                    <Icon name="Edit" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobStatusBoard;
