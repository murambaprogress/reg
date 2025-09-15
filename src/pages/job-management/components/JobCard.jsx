import React from 'react';
import Icon from '../../../components/AppIcon';

const JobCard = ({ job, onSelect, isSelected, onStatusUpdate }) => {
  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'pending': return 'bg-warning/20 text-warning border-warning/30';
      case 'in_progress': 
      case 'in progress': return 'bg-accent/20 text-accent border-accent/30';
      case 'completed': return 'bg-success/20 text-success border-success/30';
      case 'cancelled': return 'bg-error/20 text-error border-error/30';
      case 'on_hold':
      case 'on hold': return 'bg-secondary/20 text-secondary border-secondary/30';
      default: return 'bg-secondary/20 text-secondary border-secondary/30';
    }
  };

  const getCardBorderColor = (status, isAssigned) => {
    const normalizedStatus = status?.toLowerCase();
    if (!isAssigned) {
      return 'border-l-4 border-l-warning'; // Unassigned jobs have warning left border
    }
    
    switch (normalizedStatus) {
      case 'pending': return 'border-l-4 border-l-warning';
      case 'in_progress': 
      case 'in progress': return 'border-l-4 border-l-accent';
      case 'completed': return 'border-l-4 border-l-success';
      case 'cancelled': return 'border-l-4 border-l-error';
      case 'on_hold':
      case 'on hold': return 'border-l-4 border-l-secondary';
      default: return 'border-l-4 border-l-secondary';
    }
  };

  const getStatusIcon = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'pending': return 'Clock';
      case 'in_progress': 
      case 'in progress': return 'Wrench';
      case 'completed': return 'CheckCircle';
      case 'cancelled': return 'XCircle';
      case 'on_hold':
      case 'on hold': return 'Pause';
      default: return 'Clock';
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
  const isAssigned = job.assigned_technician || job.technician_id;
  const statusIcon = getStatusIcon(status);

  return (
    <div 
      className={`bg-surface border rounded-lg p-4 cursor-pointer micro-interaction hover:shadow-card transition-all duration-200 ${
        isSelected ? 'border-accent shadow-card' : 'border-border'
      } ${getCardBorderColor(status, isAssigned)}`}
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
