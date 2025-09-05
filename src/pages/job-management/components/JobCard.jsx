import React from 'react';
import Icon from '../../../components/AppIcon';



const JobCard = ({ job, onSelect, isSelected, onStatusUpdate }) => {
  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'in_progress': 
      case 'in progress': return 'bg-accent text-accent-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      case 'cancelled': return 'bg-error text-error-foreground';
      case 'on_hold':
      case 'on hold': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High': return { name: 'AlertTriangle', color: 'text-error' };
      case 'Medium': return { name: 'Clock', color: 'text-warning' };
      case 'Low': return { name: 'Minus', color: 'text-success' };
      default: return { name: 'Clock', color: 'text-text-secondary' };
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const priorityIcon = getPriorityIcon(job.priority);
  
  // Handle both API response format and legacy format
  const customerName = job.customer_name || job.customerName || 'Unknown Customer';
  const vehicleInfo = job.vehicle_model || job.vehicle || 'Unknown Vehicle';
  const technicianName = job.technician_name || job.technician?.name || job.technician || 'Unassigned';
  const dueDate = job.due_date || job.dueDate;
  const estimatedCost = job.estimated_cost || job.estimatedCost;
  const status = job.status;

  return (
    <div 
      className={`bg-surface border rounded-lg p-4 cursor-pointer micro-interaction hover:shadow-card ${
        isSelected ? 'border-accent shadow-card' : 'border-border'
      }`}
      onClick={() => onSelect(job)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-data-normal text-text-secondary">#{job.id}</span>
          <Icon name={priorityIcon.name} size={14} className={priorityIcon.color} />
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-body-medium ${getStatusColor(status)}`}>
          {formatStatus(status)}
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="font-heading-medium text-text-primary">{customerName}</h3>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Icon name="Car" size={14} />
          <span>{vehicleInfo}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Icon name="User" size={14} />
          <span>{technicianName}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>Due: {formatDate(dueDate)}</span>
          <span>{formatCurrency(estimatedCost)}</span>
        </div>
      </div>

      {(status === 'in_progress' || status === 'In Progress') && job.progress && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Progress</span>
            <span>{job.progress}%</span>
          </div>
          <div className="w-full bg-background rounded-full h-1.5">
            <div 
              className="bg-accent h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCard;
