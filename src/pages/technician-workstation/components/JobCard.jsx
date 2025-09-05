import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const JobCard = ({ job, onStartJob, onViewDetails }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-accent text-accent-foreground';
      case 'Completed':
        return 'bg-success text-success-foreground';
      case 'Pending':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
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

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-heading-semibold text-text-primary">{job.jobNumber}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-body-medium ${getStatusColor(job.status)}`}>
              {job.status}
            </span>
          </div>
          <p className="text-sm text-text-secondary mb-1">Customer: {job.customerName}</p>
          <p className="text-sm text-text-secondary">Vehicle: {job.vehicleInfo}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="Clock" size={16} className="text-text-secondary" />
          <span className="text-sm text-text-secondary">{job.estimatedTime}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Icon name="AlertCircle" size={16} className={getPriorityColor(job.priority)} />
          <span className={`text-sm font-body-medium ${getPriorityColor(job.priority)}`}>
            {job.priority} Priority
          </span>
        </div>
        <p className="text-sm text-text-primary mb-2">{job.serviceDescription}</p>
        <div className="flex flex-wrap gap-2">
          {job.services.map((service, index) => (
            <span key={index} className="px-2 py-1 bg-background text-text-secondary text-xs rounded">
              {service}
            </span>
          ))}
        </div>
      </div>

      {job.vehicleImage && (
        <div className="mb-4">
          <div className="w-full h-32 rounded-lg overflow-hidden">
            <Image 
              src={job.vehicleImage} 
              alt={`${job.vehicleInfo} vehicle`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => onViewDetails(job)}
            className="text-sm"
          >
            <Icon name="Eye" size={16} className="mr-2" />
            View Details
          </Button>
          <Button
            variant="ghost"
            className="text-sm"
          >
            <Icon name="Phone" size={16} className="mr-2" />
            Contact
          </Button>
        </div>
        {job.status === 'Assigned' && (
          <Button
            variant="primary"
            onClick={() => onStartJob(job)}
            className="text-sm"
          >
            <Icon name="Play" size={16} className="mr-2" />
            Start Job
          </Button>
        )}
      </div>
    </div>
  );
};

export default JobCard;