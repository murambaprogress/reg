import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VehicleHistory = ({ customer }) => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState('services');

  if (!customer) {
    return (
      <div className="bg-surface rounded-lg border border-border h-full flex items-center justify-center">
        <div className="text-center">
          <Icon name="Car" size={48} className="text-text-secondary mb-4 mx-auto" />
          <p className="text-text-secondary">Select a customer to view vehicle history</p>
        </div>
      </div>
    );
  }

  const vehicles = customer.vehicles || [];
  const currentVehicle = selectedVehicle || vehicles[0];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getServiceStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success';
      case 'in-progress':
        return 'bg-warning/10 text-warning';
      case 'pending':
        return 'bg-text-secondary/10 text-text-secondary';
      default:
        return 'bg-text-secondary/10 text-text-secondary';
    }
  };

  if (vehicles.length === 0) {
    return (
      <div className="bg-surface rounded-lg border border-border h-full flex items-center justify-center">
        <div className="text-center">
          <Icon name="Car" size={48} className="text-text-secondary mb-4 mx-auto" />
          <h3 className="text-lg font-heading-medium text-text-primary mb-2">No Vehicles</h3>
          <p className="text-text-secondary">This customer has no registered vehicles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading-semibold text-text-primary">Vehicle History</h2>
          <Button
            variant="primary"
            iconName="Plus"
            iconPosition="left"
            className="text-sm"
          >
            Add Vehicle
          </Button>
        </div>

        {/* Vehicle Selector */}
        {vehicles.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-body-medium micro-interaction ${
                  currentVehicle?.id === vehicle.id
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-background text-text-secondary hover:text-text-primary'
                }`}
              >
                {vehicle.year} {vehicle.make} {vehicle.model}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Vehicle Details */}
      {currentVehicle && (
        <div className="p-6 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Vehicle</p>
              <p className="font-body-medium text-text-primary">
                {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">VIN</p>
              <p className="font-body-medium text-text-primary font-data-normal">
                {currentVehicle.vin}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">License Plate</p>
              <p className="font-body-medium text-text-primary">
                {currentVehicle.licensePlate}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Mileage</p>
              <p className="font-body-medium text-text-primary">
                {currentVehicle.mileage?.toLocaleString()} miles
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'services', label: 'Service History', icon: 'Wrench' },
            { id: 'parts', label: 'Parts Used', icon: 'Package' },
            { id: 'maintenance', label: 'Maintenance Schedule', icon: 'Calendar' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 text-sm font-body-medium border-b-2 micro-interaction ${
                activeTab === tab.id
                  ? 'border-accent text-accent' :'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'services' && (
          <div className="space-y-4">
            {currentVehicle?.serviceHistory?.map((service) => (
              <div key={service.id} className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-body-medium text-text-primary">{service.serviceName}</h4>
                    <p className="text-sm text-text-secondary">Job #{service.jobId}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${getServiceStatusColor(service.status)}`}>
                      {service.status}
                    </span>
                    <p className="text-sm font-body-medium text-text-primary mt-1">
                      {formatCurrency(service.cost)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-text-secondary">Date</p>
                    <p className="text-text-primary">{formatDate(service.date)}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Technician</p>
                    <p className="text-text-primary">{service.technician}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Mileage</p>
                    <p className="text-text-primary">{service.mileage?.toLocaleString()} miles</p>
                  </div>
                </div>
                
                {service.notes && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-text-secondary">{service.notes}</p>
                  </div>
                )}
              </div>
            )) || (
              <div className="text-center py-8">
                <Icon name="Wrench" size={48} className="text-text-secondary mb-4 mx-auto" />
                <p className="text-text-secondary">No service history available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'parts' && (
          <div className="space-y-4">
            {currentVehicle?.partsUsed?.map((part) => (
              <div key={part.id} className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-body-medium text-text-primary">{part.partName}</h4>
                    <p className="text-sm text-text-secondary">Part #{part.partNumber}</p>
                    <p className="text-sm text-text-secondary mt-1">
                      Installed on {formatDate(part.installDate)} • Job #{part.jobId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-body-medium text-text-primary">
                      {formatCurrency(part.cost)}
                    </p>
                    <p className="text-xs text-text-secondary">Qty: {part.quantity}</p>
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <Icon name="Package" size={48} className="text-text-secondary mb-4 mx-auto" />
                <p className="text-text-secondary">No parts history available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            {currentVehicle?.maintenanceSchedule?.map((item) => (
              <div key={item.id} className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-body-medium text-text-primary">{item.serviceName}</h4>
                    <p className="text-sm text-text-secondary">
                      Due: {formatDate(item.dueDate)} or {item.dueMileage?.toLocaleString()} miles
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.status === 'overdue' ? 'bg-error/10 text-error' :
                      item.status === 'due-soon'? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <Icon name="Calendar" size={48} className="text-text-secondary mb-4 mx-auto" />
                <p className="text-text-secondary">No maintenance schedule available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleHistory;