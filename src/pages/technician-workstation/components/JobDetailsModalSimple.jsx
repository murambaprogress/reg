import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const JobDetailsModalSimple = ({ job, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('details');

  if (!isOpen || !job) return null;

  // Simple, safe data extraction
  const jobNumber = job.jobNumber || `#${job.id}` || 'N/A';
  const customerName = job.customer_name || job.customerName || 'Unknown Customer';
  const vehicleInfo = job.vehicle_model || job.vehicle || 'Unknown Vehicle';
  const serviceDescription = job.service_description || job.serviceDescription || 'No description available';

  const tabs = [
    { id: 'details', label: 'Job Details', icon: 'FileText' },
    { id: 'vehicle', label: 'Vehicle Info', icon: 'Car' }
  ];

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
                    <span className="text-sm font-body-medium text-text-primary">{jobNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Priority:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.priority || 'Medium'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Status:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.status || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-heading-medium text-text-primary mb-3">Customer Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Name:</span>
                    <span className="text-sm font-body-medium text-text-primary">{customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Phone:</span>
                    <span className="text-sm font-body-medium text-text-primary">{job.customer?.phone || job.customerPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-heading-medium text-text-primary mb-3">Service Description</h4>
              <p className="text-sm text-text-primary bg-background p-3 rounded-lg">{serviceDescription}</p>
            </div>
          </div>
        );

      case 'vehicle':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-heading-medium text-text-primary mb-3">Vehicle Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Make & Model:</span>
                  <span className="text-sm font-body-medium text-text-primary">{vehicleInfo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Year:</span>
                  <span className="text-sm font-body-medium text-text-primary">{job.vehicle_year || job.vehicleYear || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Mileage:</span>
                  <span className="text-sm font-body-medium text-text-primary">{job.mileage || 'N/A'} miles</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tab to view information</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
      <div className="bg-surface rounded-lg border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-heading-semibold text-text-primary">{jobNumber}</h2>
            <p className="text-sm text-text-secondary">{customerName} - {vehicleInfo}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-body-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-background'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModalSimple;
