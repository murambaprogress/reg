import React from 'react';
import Icon from '../../../components/AppIcon';

const JobStatusBoard = () => {
  const jobs = [
    {
      id: "JOB-001",
      vehicle: "Toyota Camry 2020",
      customer: "John Smith",
      technician: "Mike Johnson",
      status: "in-progress",
      priority: "high",
      estimatedTime: "2 hours",
      progress: 65,
      services: ["Oil Change", "Brake Inspection"]
    },
    {
      id: "JOB-002", 
      vehicle: "Honda Civic 2019",
      customer: "Sarah Wilson",
      technician: "David Brown",
      status: "pending",
      priority: "medium",
      estimatedTime: "1.5 hours",
      progress: 0,
      services: ["Tire Rotation", "Battery Check"]
    },
    {
      id: "JOB-003",
      vehicle: "Ford F-150 2021",
      customer: "Robert Davis",
      technician: "Alex Martinez",
      status: "completed",
      priority: "low",
      estimatedTime: "3 hours",
      progress: 100,
      services: ["Engine Diagnostic", "Transmission Service"]
    },
    {
      id: "JOB-004",
      vehicle: "BMW X5 2022",
      customer: "Emily Johnson",
      technician: "Chris Anderson",
      status: "in-progress",
      priority: "high",
      estimatedTime: "4 hours",
      progress: 30,
      services: ["AC Repair", "Brake Pad Replacement"]
    }
  ];

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
      </div>
    </div>
  );
};

export default JobStatusBoard;