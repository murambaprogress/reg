import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const JobDetailsModal = ({ job, isOpen, onClose, onUpdateJob }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [jobNotes, setJobNotes] = useState(job?.notes || '');

  if (!isOpen || !job) return null;

  const tabs = [
    { id: 'details', label: 'Job Details', icon: 'FileText' },
    { id: 'vehicle', label: 'Vehicle Info', icon: 'Car' },
    { id: 'history', label: 'Service History', icon: 'History' },
    { id: 'notes', label: 'Notes', icon: 'MessageSquare' }
  ];

  const serviceHistory = [
    {
      id: 1,
      date: '2024-01-15',
      service: 'Oil Change & Filter Replacement',
      technician: 'Mike Johnson',
      cost: 45.99,
      status: 'Completed'
    },
    {
      id: 2,
      date: '2023-11-20',
      service: 'Brake Inspection',
      technician: 'Sarah Wilson',
      cost: 75.00,
      status: 'Completed'
    },
    {
      id: 3,
      date: '2023-08-10',
      service: 'Tire Rotation',
      technician: 'Mike Johnson',
      cost: 25.00,
      status: 'Completed'
    }
  ];

  const handleSaveNotes = () => {
    onUpdateJob(job.id, { notes: jobNotes });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-heading-medium text-text-primary mb-3">Job Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Job Number:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.jobNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Priority:</span>
                    <span className={`text-sm font-body-medium ${
                      job.priority === 'High' ? 'text-error' : 
                      job.priority === 'Medium' ? 'text-warning' : 'text-success'
                    }`}>{job.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Estimated Time:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.estimatedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Created:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.createdDate}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-heading-medium text-text-primary mb-3">Customer Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Name:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Phone:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Email:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.customerEmail}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-heading-medium text-text-primary mb-3">Service Description</h4>
              <p className="text-sm text-text-primary bg-background p-3 rounded-lg">{job.serviceDescription}</p>
            </div>
            <div>
              <h4 className="text-sm font-heading-medium text-text-primary mb-3">Services Required</h4>
              <div className="flex flex-wrap gap-2">
                {job.services.map((service, index) => (
                  <span key={index} className="px-3 py-1 bg-accent text-accent-foreground text-sm rounded-full">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'vehicle':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-heading-medium text-text-primary mb-3">Vehicle Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Make & Model:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.vehicleInfo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Year:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.vehicleYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">VIN:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.vehicleVin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">License Plate:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.licensePlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Mileage:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.mileage} miles</span>
                  </div>
                </div>
              </div>
              {job.vehicleImage && (
                <div>
                  <h4 className="text-sm font-heading-medium text-text-primary mb-3">Vehicle Photo</h4>
                  <div className="w-full h-48 rounded-lg overflow-hidden">
                    <Image 
                      src={job.vehicleImage} 
                      alt={`${job.vehicleInfo} vehicle`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-heading-medium text-text-primary">Previous Services</h4>
            <div className="space-y-3">
              {serviceHistory.map(service => (
                <div key={service.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-body-medium text-text-primary">{service.service}</span>
                    <span className="text-sm text-success">{service.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary">
                    <div>Date: {service.date}</div>
                    <div>Technician: {service.technician}</div>
                    <div>Cost: ${service.cost}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-heading-medium text-text-primary mb-2">
                Job Notes
              </label>
              <textarea
                value={jobNotes}
                onChange={(e) => setJobNotes(e.target.value)}
                placeholder="Add notes about this job..."
                rows={8}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
            <Button
              variant="primary"
              onClick={handleSaveNotes}
              className="text-sm"
            >
              <Icon name="Save" size={16} className="mr-2" />
              Save Notes
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
      <div className="bg-surface rounded-lg border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-heading-semibold text-text-primary">{job.jobNumber}</h2>
            <p className="text-sm text-text-secondary">{job.customerName} - {job.vehicleInfo}</p>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="p-2"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="flex border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-body-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-accent' :'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;