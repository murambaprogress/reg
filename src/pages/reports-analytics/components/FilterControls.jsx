import React, { useState, useEffect } from 'react';
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
  const [technicians, setTechnicians] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

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

  // Fetch technicians from backend
  useEffect(() => {
    const fetchTechnicians = async () => {
      setLoadingTechnicians(true);
      try {
        const token = localStorage.getItem('token');
        const base = import.meta.env.VITE_API_BASE || '';
        const response = await fetch(`${base}/admin/technicians`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const technicianOptions = [
            { value: 'all', label: 'All Technicians' },
            ...data.map(tech => ({
              value: tech.id.toString(),
              label: tech.username
            }))
          ];
          setTechnicians(technicianOptions);
        }
      } catch (error) {
        console.error('Failed to fetch technicians:', error);
        // Fallback to hardcoded list
        setTechnicians([
          { value: 'all', label: 'All Technicians' },
          { value: 'john-doe', label: 'John Doe' },
          { value: 'mike-wilson', label: 'Mike Wilson' },
          { value: 'sarah-johnson', label: 'Sarah Johnson' },
          { value: 'david-brown', label: 'David Brown' },
          { value: 'lisa-davis', label: 'Lisa Davis' }
        ]);
      } finally {
        setLoadingTechnicians(false);
      }
    };

    fetchTechnicians();
  }, []);

  // Fetch departments from backend
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const token = localStorage.getItem('token');
        const base = import.meta.env.VITE_API_BASE || '';
        const response = await fetch(`${base}/departments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const departmentOptions = [
            { value: 'all', label: 'All Departments' },
            ...data.map(dept => ({
              value: dept.id.toString(),
              label: dept.name
            }))
          ];
          setDepartments(departmentOptions);
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        // Fallback to hardcoded list
        setDepartments([
          { value: 'all', label: 'All Departments' },
          { value: 'service', label: 'Service Department' },
          { value: 'parts', label: 'Parts Department' },
          { value: 'bodyshop', label: 'Body Shop' },
          { value: 'detailing', label: 'Detailing' }
        ]);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

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
              disabled={loadingDepartments}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-body-normal text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50"
            >
              {loadingDepartments ? (
                <option>Loading departments...</option>
              ) : (
                departments.map(dept => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))
              )}
            </select>
          </div>

          {/* Technician Filter */}
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-body-medium text-text-secondary">Technician</label>
            <select 
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              disabled={loadingTechnicians}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-body-normal text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50"
            >
              {loadingTechnicians ? (
                <option>Loading technicians...</option>
              ) : (
                technicians.map(tech => (
                  <option key={tech.value} value={tech.value}>{tech.label}</option>
                ))
              )}
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
          <Button variant="outline" onClick={async () => {
            try {
              const token = localStorage.getItem('token');
              const resp = await fetch(`${import.meta.env.VITE_API_BASE || ''}/reports/generate?type=${encodeURIComponent(selectedDepartment || 'comprehensive')}&format=csv&date_range=${encodeURIComponent(dateRange)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (resp.ok) {
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_${dateRange}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                window.__SHOW_TOAST && window.__SHOW_TOAST('Report downloaded', 'success');
              } else {
                window.__SHOW_TOAST && window.__SHOW_TOAST('Failed to download report', 'error');
              }
            } catch (e) {
              console.error(e);
              window.__SHOW_TOAST && window.__SHOW_TOAST('Network error', 'error');
            }
          }} iconName="Mail" iconSize={16}>
            Download CSV
          </Button>
          <Button variant="primary" onClick={onExportPDF} iconName="FileText" iconSize={16}>
            Export PDF
          </Button>
          <Button variant="outline" onClick={async () => {
            // Email report via backend
            try {
              const token = localStorage.getItem('token');
              const body = {
                type: selectedDepartment || 'comprehensive',
                date_range: dateRange,
                recipients: prompt('Enter comma-separated recipient emails'),
                subject: `Report: ${selectedDepartment || 'comprehensive'}`,
                message: 'Please find attached report.'
              };
              if (!body.recipients) return;
              const resp = await fetch(`${import.meta.env.VITE_API_BASE || ''}/reports/email`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });
              if (resp.ok) {
                window.__SHOW_TOAST && window.__SHOW_TOAST('Report emailed', 'success');
              } else {
                window.__SHOW_TOAST && window.__SHOW_TOAST('Failed to email report', 'error');
              }
            } catch (e) {
              console.error(e);
              window.__SHOW_TOAST && window.__SHOW_TOAST('Network error', 'error');
            }
          }} iconName="PaperPlane" iconSize={16}>
            Email Report
          </Button>
          <Button variant="ghost" onClick={async () => {
            // Generate whatsapp share link
            try {
              const token = localStorage.getItem('token');
              const resp = await fetch(`${import.meta.env.VITE_API_BASE || ''}/reports/whatsapp`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: selectedDepartment || 'comprehensive', date_range: dateRange, summary_only: true })
              });
              if (resp.ok) {
                const data = await resp.json();
                window.open(data.whatsapp_url, '_blank');
              } else {
                window.__SHOW_TOAST && window.__SHOW_TOAST('Failed to generate WhatsApp link', 'error');
              }
            } catch (e) {
              console.error(e);
              window.__SHOW_TOAST && window.__SHOW_TOAST('Network error', 'error');
            }
          }} iconName="MessageSquare" iconSize={16}>
            Share via WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;