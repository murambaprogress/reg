import React from 'react';
import Button from '../../../components/ui/Button';



const FilterControls = ({ 
  dateRange, 
  setDateRange, 
  selectedDepartment, 
  setSelectedDepartment,
  selectedTechnician,
  setSelectedTechnician,
  selectedServiceType,
  setSelectedServiceType,
  onExportPDF,
  onExportCSV,
  onRefresh
}) => {
  const departments = [
    { value: 'all', label: 'All Departments' },
    { value: 'service', label: 'Service Department' },
    { value: 'parts', label: 'Parts Department' },
    { value: 'bodyshop', label: 'Body Shop' },
    { value: 'detailing', label: 'Detailing' }
  ];

  const technicians = [
    { value: 'all', label: 'All Technicians' },
    { value: 'john-doe', label: 'John Doe' },
    { value: 'mike-wilson', label: 'Mike Wilson' },
    { value: 'sarah-johnson', label: 'Sarah Johnson' },
    { value: 'david-brown', label: 'David Brown' },
    { value: 'lisa-davis', label: 'Lisa Davis' }
  ];

  const serviceTypes = [
    { value: 'all', label: 'All Services' },
    { value: 'oil-change', label: 'Oil Change' },
    { value: 'brake-service', label: 'Brake Service' },
    { value: 'tire-service', label: 'Tire Service' },
    { value: 'engine-repair', label: 'Engine Repair' },
    { value: 'transmission', label: 'Transmission' },
    { value: 'electrical', label: 'Electrical' }
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <div className="bg-surface rounded-lg p-6 shadow-card border border-border mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Date Range */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-body-medium text-text-secondary">Date Range</label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-body-normal text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-body-medium text-text-secondary">Department</label>
            <select 
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-body-normal text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {departments.map(dept => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
              ))}
            </select>
          </div>

          {/* Technician Filter */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-body-medium text-text-secondary">Technician</label>
            <select 
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-body-normal text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {technicians.map(tech => (
                <option key={tech.value} value={tech.value}>{tech.label}</option>
              ))}
            </select>
          </div>

          {/* Service Type Filter */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-body-medium text-text-secondary">Service Type</label>
            <select 
              value={selectedServiceType}
              onChange={(e) => setSelectedServiceType(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-body-normal text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {serviceTypes.map(service => (
                <option key={service.value} value={service.value}>{service.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={onRefresh} iconName="RefreshCw" iconSize={16}>
            Refresh
          </Button>
          <Button variant="outline" onClick={onExportCSV} iconName="Download" iconSize={16}>
            Export CSV
          </Button>
          <Button variant="primary" onClick={onExportPDF} iconName="FileText" iconSize={16}>
            Export PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;