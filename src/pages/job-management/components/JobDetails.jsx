import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const JobDetails = ({ job, onEdit, onStatusUpdate, onAddNote }) => {
  const [newNote, setNewNote] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-error';
      case 'Medium': return 'text-warning';
      case 'Low': return 'text-success';
      default: return 'text-text-secondary';
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
    if (!amount) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(job.id, newNote.trim());
      setNewNote('');
      setShowAddNote(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Handle both API response format and legacy format
  const customerName = job.customer?.name || job.customer_name || job.customerName || 'Unknown Customer';
  const customerPhone = job.customer?.phone || job.customerPhone || 'N/A';
  const customerEmail = job.customer?.email || job.customerEmail || 'N/A';
  const vehicleModel = job.vehicle_model || job.vehicleModel || 'Unknown Vehicle';
  const vehiclePlate = job.vehicle_plate || job.vehiclePlate || 'N/A';
  const vehicleYear = job.vehicle_year || job.vehicleYear || 'N/A';
  const serviceDescription = job.service_description || job.serviceDescription || 'No description available';
  const estimatedHours = job.estimated_hours || job.estimatedHours || 0;
  const estimatedCost = job.estimated_cost || job.estimatedCost || 0;
  const dueDate = job.due_date || job.dueDate;
  const createdDate = job.created_at || job.createdAt || job.createdDate;
  const technicianName = job.technician?.name || job.technician?.username || job.technician || 'Unassigned';
  const technicianSpecialization = job.technician?.specialization || job.technicianSpecialization || 'General';
  const vehiclePhotos = job.vehicle_photos || job.vehiclePhotos || [];
  const notes = job.notes || [];
  const status = job.status;
  const priority = job.priority;

  return (
    <div className="bg-surface rounded-lg border border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-xl font-heading-semibold text-text-primary">
                Job #{job.id}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-body-medium ${getStatusColor(status)}`}>
                {formatStatus(status)}
              </span>
              <span className={`text-sm font-body-medium ${getPriorityColor(priority)}`}>
                {priority} Priority
              </span>
            </div>
            <p className="text-text-secondary">Created on {formatDate(createdDate)}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => onEdit(job)}>
              <Icon name="Edit" size={16} className="mr-2" />
              Edit
            </Button>
            {status !== 'completed' && status !== 'Completed' && (
              <Button 
                variant="primary" 
                onClick={() => onStatusUpdate(job.id, status === 'pending' || status === 'Pending' ? 'in_progress' : 'completed')}
              >
                {status === 'pending' || status === 'Pending' ? 'Start Job' : 'Complete Job'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Customer & Vehicle Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-heading-medium text-text-primary">Customer Information</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Icon name="User" size={16} className="text-text-secondary" />
                <span className="font-body-medium text-text-primary">{customerName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="Phone" size={16} className="text-text-secondary" />
                <span className="text-text-secondary">{customerPhone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="Mail" size={16} className="text-text-secondary" />
                <span className="text-text-secondary">{customerEmail}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-heading-medium text-text-primary">Vehicle Information</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Icon name="Car" size={16} className="text-text-secondary" />
                <span className="font-body-medium text-text-primary">{vehicleModel}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="Hash" size={16} className="text-text-secondary" />
                <span className="text-text-secondary">{vehiclePlate}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="Calendar" size={16} className="text-text-secondary" />
                <span className="text-text-secondary">{vehicleYear}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading-medium text-text-primary">Service Details</h3>
          <div className="bg-background rounded-lg p-4">
            <p className="text-text-primary">{serviceDescription}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="Clock" size={16} className="text-text-secondary" />
                <span className="text-sm font-body-medium text-text-secondary">Estimated Time</span>
              </div>
              <span className="text-lg font-heading-medium text-text-primary">
                {estimatedHours}h
              </span>
            </div>
            
            <div className="bg-background rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="DollarSign" size={16} className="text-text-secondary" />
                <span className="text-sm font-body-medium text-text-secondary">Estimated Cost</span>
              </div>
              <span className="text-lg font-heading-medium text-text-primary">
                {formatCurrency(estimatedCost)}
              </span>
            </div>
            
            <div className="bg-background rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="Calendar" size={16} className="text-text-secondary" />
                <span className="text-sm font-body-medium text-text-secondary">Due Date</span>
              </div>
              <span className="text-lg font-heading-medium text-text-primary">
                {formatDate(dueDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Technician Assignment */}
        <div className="space-y-4">
          <h3 className="text-lg font-heading-medium text-text-primary">Assigned Technician</h3>
          <div className="flex items-center space-x-4 bg-background rounded-lg p-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Icon name="User" size={20} color="white" />
            </div>
            <div>
              <p className="font-body-medium text-text-primary">{technicianName}</p>
              <p className="text-sm text-text-secondary">{technicianSpecialization}</p>
            </div>
          </div>
        </div>

        {/* Progress Tracking */}
        {(status === 'in_progress' || status === 'In Progress') && (
          <div className="space-y-4">
            <h3 className="text-lg font-heading-medium text-text-primary">Progress Tracking</h3>
            <div className="bg-background rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-body-medium text-text-secondary">Completion</span>
                <span className="text-sm font-body-medium text-text-primary">{job.progress}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div 
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <span className="text-sm text-text-secondary">Time Spent</span>
                  <p className="font-body-medium text-text-primary">
                    {formatDuration(job.timeSpent || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-text-secondary">Remaining</span>
                  <p className="font-body-medium text-text-primary">
                    {formatDuration((job.estimatedHours * 60) - (job.timeSpent || 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Photos */}
        {vehiclePhotos && vehiclePhotos.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-heading-medium text-text-primary">Vehicle Photos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {vehiclePhotos.map((photo, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={photo.url}
                    alt={`Vehicle photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 micro-interaction"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes & Updates */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading-medium text-text-primary">Notes & Updates</h3>
            <Button 
              variant="outline" 
              onClick={() => setShowAddNote(!showAddNote)}
            >
              <Icon name="Plus" size={16} className="mr-2" />
              Add Note
            </Button>
          </div>

          {showAddNote && (
            <div className="bg-background rounded-lg p-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about the job progress..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
              />
              <div className="flex items-center justify-end space-x-2 mt-3">
                <Button variant="ghost" onClick={() => setShowAddNote(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleAddNote}>
                  Add Note
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {notes && notes.length > 0 ? (
              notes.map((note, index) => (
                <div key={index} className="bg-background rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-body-medium text-text-primary">{note.author}</span>
                    <span className="text-xs text-text-secondary">{note.timestamp}</span>
                  </div>
                  <p className="text-text-primary">{note.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Icon name="FileText" size={32} className="mx-auto mb-2 opacity-50" />
                <p>No notes added yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
