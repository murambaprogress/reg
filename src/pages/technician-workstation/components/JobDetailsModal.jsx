import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const JobDetailsModal = ({ job, isOpen, onClose, onUpdateJob }) => {
  // console.log('JobDetailsModal rendered with:', { job, isOpen, onClose: !!onClose, onUpdateJob: !!onUpdateJob });
  
  const [activeTab, setActiveTab] = useState('details');
  const [jobNotes, setJobNotes] = useState('');

  // Update jobNotes when job changes
  useEffect(() => {
    if (job) {
      setJobNotes(job.notes || job.service_description || '');
    }
  }, [job]);

  // Handle both API response format and legacy format
  const formatJobData = (job) => {
    // console.log('formatJobData called with job:', job);
    if (!job) {
      // console.log('Job is null or undefined');
      return {};
    }
    
    try {
      const formatted = {
        jobNumber: job.jobNumber || `#${job.id}` || 'N/A',
        customerName: job.customer_name || job.customerName || 'Unknown Customer',
        customerPhone: job.customer?.phone || job.customerPhone || 'N/A',
        customerEmail: job.customer?.email || job.customerEmail || 'N/A',
        vehicleInfo: `${job.vehicle_model || job.vehicle || 'Unknown Vehicle'}`,
        vehicleYear: job.vehicle_year || job.vehicleYear || 'N/A',
        vehicleVin: job.vehicle_vin || job.vehicleVin || 'N/A',
        licensePlate: job.vehicle_plate || job.licensePlate || 'N/A',
        mileage: job.mileage || 'N/A',
        priority: job.priority || 'Medium',
        estimatedTime: job.estimated_hours ? `${job.estimated_hours} hours` : job.estimatedTime || 'N/A',
        createdDate: job.created_at ? new Date(job.created_at).toLocaleDateString() : job.createdDate || 'N/A',
        serviceDescription: job.service_description || job.serviceDescription || 'No description available',
        services: job.services || ['General Service']
      };
      // console.log('Formatted job data:', formatted);
      return formatted;
    } catch (error) {
      console.error('Error formatting job data:', error);
      return {
        jobNumber: 'N/A',
        customerName: 'Unknown Customer',
        customerPhone: 'N/A',
        customerEmail: 'N/A',
        vehicleInfo: 'Unknown Vehicle',
        vehicleYear: 'N/A',
        vehicleVin: 'N/A',
        licensePlate: 'N/A',
        mileage: 'N/A',
        priority: 'Medium',
        estimatedTime: 'N/A',
        createdDate: 'N/A',
        serviceDescription: 'No description available',
        services: ['General Service']
      };
    }
  };

  if (!isOpen || !job) {
    console.log('JobDetailsModal not rendering:', { isOpen, job: !!job });
    return null;
  }

  let jobData;
  try {
    jobData = formatJobData(job);
  } catch (error) {
    console.error('Error in JobDetailsModal:', error);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
        <div className="bg-surface rounded-lg border border-border p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Error Loading Job Details</h2>
            <p className="text-sm text-gray-600 mb-4">Unable to load job information</p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  console.log('JobDetailsModal rendering with jobData:', jobData);

  const tabs = [
    { id: 'details', label: 'Job Details', icon: 'FileText' },
    { id: 'vehicle', label: 'Vehicle Info', icon: 'Car' },
    { id: 'history', label: 'Service History', icon: 'History' },
    { id: 'notes', label: 'Notes', icon: 'MessageSquare' }
  ];

  const [serviceHistory, setServiceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || 'https://progress.pythonanywhere.com/api';

  useEffect(() => {
    if (isOpen && job) {
      // Only fetch service history if we have a valid customer ID
      const customerId = job?.customer?.id || job?.customer_id || job?.customerId;
      if (customerId) {
        fetchServiceHistory();
      }
    }
  }, [isOpen, job]);

  const fetchServiceHistory = async () => {
    // Try different ways to get customer ID based on job structure
    const customerId = job?.customer?.id || job?.customer_id || job?.customerId;
    if (!customerId) {
      console.log('No customer ID found for service history');
      return;
    }
    
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/jobs/?customer=${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const completedJobs = data
          .filter(j => j.status === 'completed' && j.id !== job.id)
          .map(j => ({
            id: j.id,
            date: new Date(j.completed_at || j.created_at).toLocaleDateString(),
            service: j.service_description,
            technician: j.assigned_technician_name || 'Unknown',
            cost: parseFloat(j.actual_cost || j.estimated_cost || 0),
            status: 'Completed'
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setServiceHistory(completedJobs);
      }
    } catch (error) {
      console.error('Error fetching service history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

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
                    <span className="text-sm font-body-medium text-text-primary">{jobData.jobNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Priority:</span>
                    <span className={`text-sm font-body-medium ${
                      jobData.priority === 'High' ? 'text-error' : 
                      jobData.priority === 'Medium' ? 'text-warning' : 'text-success'
                    }`}>{jobData.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Estimated Time:</span>
                    <span className="text-sm font-body-medium text-text-primary">{jobData.estimatedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Created:</span>
                    <span className="text-sm font-body-medium text-text-primary">{jobData.createdDate}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-heading-medium text-text-primary mb-3">Customer Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Name:</span>
                    <span className="text-sm font-body-medium text-text-primary">{jobData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Phone:</span>
                    <span className="text-sm font-body-medium text-text-primary">{jobData.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Email:</span>
                    <span className="text-sm font-body-medium text-text-primary">{jobData.customerEmail}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-heading-medium text-text-primary mb-3">Service Description</h4>
              <p className="text-sm text-text-primary bg-background p-3 rounded-lg">{jobData.serviceDescription}</p>
            </div>
            <div>
              <h4 className="text-sm font-heading-medium text-text-primary mb-3">Services Required</h4>
              <div className="flex flex-wrap gap-2">
                {jobData.services.map((service, index) => (
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
                    <span className="text-sm font-body-medium text-text-primary">{jobData.vehicleInfo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Year:</span>
                    <span className="text-sm font-body-medium text-text-primary">{jobData.vehicleYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">VIN:</span>
                    <span className="text-sm font-body-medium text-text-primary">{jobData.vehicleVin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">License Plate:</span>
                    <span className="text-sm font-body-medium text-text-primary">{jobData.licensePlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Mileage:</span>
                    <span className="text-sm font-body-medium text-text-primary">{jobData.mileage} miles</span>
                  </div>
                </div>
              </div>
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
            <h2 className="text-xl font-heading-semibold text-text-primary">{jobData.jobNumber}</h2>
            <p className="text-sm text-text-secondary">{jobData.customerName} - {jobData.vehicleInfo}</p>
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
