import React, { useCallback, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const JobCard = React.memo(({ job, onStartJob, onViewDetails, onUpdateStatus }) => {
  // Normalize incoming status to canonical snake_case used by API
  const canonicalStatus = useCallback((s) => {
    if (!s) return '';
    return String(s).toLowerCase().trim().replace(/\s+/g, '_');
  }, []);

  const getStatusColor = useCallback((status) => {
    const normalizedStatus = canonicalStatus(status);
    switch (normalizedStatus) {
      case 'in_progress':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'completed':
        return 'bg-success/20 text-success border-success/30';
      case 'ready_to_collect':
        return 'bg-info/20 text-info border-info/30';
      case 'pending':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'cancelled':
        return 'bg-error/20 text-error border-error/30';
      case 'on_hold':
        return 'bg-secondary/20 text-secondary border-secondary/30';
      default:
        return 'bg-secondary/20 text-secondary border-secondary/30';
    }
  }, [canonicalStatus]);

  const getPriorityColor = useCallback((priority) => {
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
  }, []);

  const getStatusIcon = useCallback((status) => {
    const normalizedStatus = canonicalStatus(status);
    switch (normalizedStatus) {
      case 'pending':
        return 'Clock';
      case 'in_progress':
        return 'Wrench';
      case 'completed':
        return 'CheckCircle';
      case 'ready_to_collect':
        return 'Car';
      case 'cancelled':
        return 'XCircle';
      case 'on_hold':
        return 'Pause';
      default:
        return 'Clock';
    }
  }, []);

  // Memoize computed values
  const statusColor = useMemo(() => getStatusColor(job.status), [job.status, getStatusColor]);
  const priorityColor = useMemo(() => getPriorityColor(job.priority), [job.priority, getPriorityColor]);
  const statusIcon = useMemo(() => getStatusIcon(job.status), [job.status, getStatusIcon]);
  const jobStatusCanonical = useMemo(() => canonicalStatus(job.status), [job.status, canonicalStatus]);

  // Memoize event handlers
  const handleViewDetails = useCallback(() => {
    onViewDetails(job);
  }, [job, onViewDetails]);

  const handleStartJob = useCallback(() => {
    onStartJob(job.id); // Pass job ID instead of whole job object
  }, [job.id, onStartJob]);

  const handleUpdateStatus = useCallback((newStatus) => {
    onUpdateStatus(job, newStatus);
  }, [job, onUpdateStatus]);

  const handleReadyToCollect = useCallback(() => {
    onUpdateStatus(job, 'ready_to_collect');
  }, [job, onUpdateStatus]);

  const handleCompleteJob = useCallback(() => {
    onUpdateStatus(job, 'completed');
  }, [job, onUpdateStatus]);

  // Format data for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Handle both API response format and legacy format
  const customerName = job.customer_name || job.customerName || 'Unknown Customer';
  const vehicleInfo = `${job.vehicle_model || job.vehicle || 'Unknown Vehicle'} (${job.vehicle_plate || job.plateNumber || 'N/A'})`;
  const serviceDescription = job.service_description || job.serviceDescription || 'No description available';
  const dueDate = job.due_date || job.dueDate;
  const estimatedCost = job.estimated_cost || job.estimatedCost;
  const jobNumber = `#${job.id}` || job.jobNumber;

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-card hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-heading-semibold text-text-primary">{jobNumber}</h3>
            <Icon name={statusIcon} size={16} className="text-text-secondary" />
            <span className={`px-2 py-1 rounded-full text-xs font-body-medium border ${statusColor}`}>
              {formatStatus(job.status)}
            </span>
          </div>
          <p className="text-sm text-text-secondary mb-1">Customer: {customerName}</p>
          <p className="text-sm text-text-secondary">Vehicle: {vehicleInfo}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="Calendar" size={16} className="text-text-secondary" />
          <span className="text-sm text-text-secondary">Due: {formatDate(dueDate)}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Icon name="AlertCircle" size={16} className={priorityColor} />
          <span className={`text-sm font-body-medium ${priorityColor}`}>
            {job.priority} Priority
          </span>
        </div>
        <p className="text-sm text-text-primary mb-2">{serviceDescription}</p>
        {estimatedCost && (
          <div className="flex items-center space-x-2">
            <Icon name="DollarSign" size={14} className="text-text-secondary" />
            <span className="text-sm text-text-secondary">
              Estimated: ${parseFloat(estimatedCost).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {job.progress && jobStatusCanonical === 'in_progress' && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Progress</span>
            <span>{job.progress}%</span>
          </div>
          <div className="w-full bg-background rounded-full h-2">
            <div 
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={handleViewDetails}
            className="text-sm"
          >
            <Icon name="Eye" size={16} className="mr-2" />
            Details
          </Button>
          {onUpdateStatus && jobStatusCanonical !== 'completed' && jobStatusCanonical !== 'cancelled' && (
            <Button
              variant="ghost"
              onClick={() => handleUpdateStatus()}
              className="text-sm"
            >
              <Icon name="Edit" size={16} className="mr-2" />
              Update Status
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {jobStatusCanonical === 'pending' && (
            <Button
              variant="primary"
              onClick={handleStartJob}
              className="text-sm"
            >
              <Icon name="Play" size={16} className="mr-2" />
              Start
            </Button>
          )}
          {jobStatusCanonical === 'in_progress' && onUpdateStatus && (
            <>
              <Button
                variant="outline"
                onClick={handleReadyToCollect}
                className="text-sm"
              >
                <Icon name="Car" size={16} className="mr-2" />
                Ready to Collect
              </Button>
              <Button
                variant="success"
                onClick={handleCompleteJob}
                className="text-sm"
              >
                <Icon name="CheckCircle" size={16} className="mr-2" />
                Complete
              </Button>
            </>
          )}
          {jobStatusCanonical === 'ready_to_collect' && onUpdateStatus && (
            <Button
              variant="success"
              onClick={handleCompleteJob}
              className="text-sm"
            >
              <Icon name="CheckCircle" size={16} className="mr-2" />
              Mark Delivered
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

JobCard.displayName = 'JobCard';

export default JobCard;
