import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';


const ScheduledReports = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    type: 'revenue',
    frequency: 'weekly',
    recipients: '',
    format: 'pdf'
  });

  const scheduledReports = [
    {
      id: 1,
      name: 'Weekly Revenue Report',
      type: 'Revenue Analysis',
      frequency: 'Weekly',
      nextRun: '2024-01-15 09:00 AM',
      recipients: 'manager@regimark.com, owner@regimark.com',
      format: 'PDF',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Monthly Technician Performance',
      type: 'Performance Analysis',
      frequency: 'Monthly',
      nextRun: '2024-02-01 08:00 AM',
      recipients: 'hr@regimark.com, supervisor@regimark.com',
      format: 'CSV',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Daily Job Summary',
      type: 'Job Management',
      frequency: 'Daily',
      nextRun: '2024-01-11 06:00 PM',
      recipients: 'operations@regimark.com',
      format: 'PDF',
      status: 'Paused'
    },
    {
      id: 4,
      name: 'Quarterly Business Review',
      type: 'Comprehensive Analysis',
      frequency: 'Quarterly',
      nextRun: '2024-04-01 10:00 AM',
      recipients: 'board@regimark.com, ceo@regimark.com',
      format: 'PDF',
      status: 'Active'
    }
  ];

  const reportTypes = [
    { value: 'revenue', label: 'Revenue Analysis' },
    { value: 'performance', label: 'Performance Analysis' },
    { value: 'jobs', label: 'Job Management' },
    { value: 'inventory', label: 'Inventory Report' },
    { value: 'customer', label: 'Customer Analysis' },
    { value: 'comprehensive', label: 'Comprehensive Analysis' }
  ];

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  const formats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'csv', label: 'CSV' },
    { value: 'excel', label: 'Excel' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-success bg-success/10';
      case 'Paused': return 'text-warning bg-warning/10';
      case 'Error': return 'text-error bg-error/10';
      default: return 'text-text-secondary bg-background';
    }
  };

  const handleCreateReport = () => {
    // Mock creation logic
    console.log('Creating scheduled report:', newReport);
    setIsModalOpen(false);
    setNewReport({
      name: '',
      type: 'revenue',
      frequency: 'weekly',
      recipients: '',
      format: 'pdf'
    });
  };

  const handleToggleStatus = (reportId) => {
    console.log('Toggling status for report:', reportId);
  };

  const handleDeleteReport = (reportId) => {
    console.log('Deleting report:', reportId);
  };

  const handleRunNow = (reportId) => {
    console.log('Running report now:', reportId);
  };

  return (
    <div className="bg-surface rounded-lg p-6 shadow-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-heading-medium text-text-primary">Scheduled Reports</h3>
          <p className="text-sm text-text-secondary mt-1">Automated report delivery to stakeholders</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsModalOpen(true)}
          iconName="Plus" 
          iconSize={16}
        >
          Schedule Report
        </Button>
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-body-medium text-text-secondary">Report Name</th>
              <th className="text-left py-3 px-4 text-sm font-body-medium text-text-secondary">Type</th>
              <th className="text-left py-3 px-4 text-sm font-body-medium text-text-secondary">Frequency</th>
              <th className="text-left py-3 px-4 text-sm font-body-medium text-text-secondary">Next Run</th>
              <th className="text-left py-3 px-4 text-sm font-body-medium text-text-secondary">Status</th>
              <th className="text-left py-3 px-4 text-sm font-body-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scheduledReports.map((report) => (
              <tr key={report.id} className="border-b border-border hover:bg-background">
                <td className="py-4 px-4">
                  <div>
                    <div className="text-sm font-body-medium text-text-primary">{report.name}</div>
                    <div className="text-xs text-text-secondary">{report.format} • {report.recipients.split(',').length} recipients</div>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-text-secondary">{report.type}</td>
                <td className="py-4 px-4 text-sm text-text-secondary">{report.frequency}</td>
                <td className="py-4 px-4 text-sm text-text-secondary">{report.nextRun}</td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-body-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRunNow(report.id)}
                      iconName="Play"
                      iconSize={14}
                    >
                      Run Now
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleToggleStatus(report.id)}
                      iconName={report.status === 'Active' ? 'Pause' : 'Play'}
                      iconSize={14}
                    >
                      {report.status === 'Active' ? 'Pause' : 'Resume'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteReport(report.id)}
                      iconName="Trash2"
                      iconSize={14}
                      className="text-error hover:text-error"
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md mx-4 shadow-modal">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-heading-medium text-text-primary">Schedule New Report</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsModalOpen(false)}
                iconName="X"
                iconSize={16}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">Report Name</label>
                <Input
                  type="text"
                  placeholder="Enter report name"
                  value={newReport.name}
                  onChange={(e) => setNewReport({...newReport, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">Report Type</label>
                <select 
                  value={newReport.type}
                  onChange={(e) => setNewReport({...newReport, type: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-body-normal text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">Frequency</label>
                <select 
                  value={newReport.frequency}
                  onChange={(e) => setNewReport({...newReport, frequency: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-body-normal text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  {frequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">Recipients (comma-separated emails)</label>
                <Input
                  type="text"
                  placeholder="email1@example.com, email2@example.com"
                  value={newReport.recipients}
                  onChange={(e) => setNewReport({...newReport, recipients: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">Format</label>
                <select 
                  value={newReport.format}
                  onChange={(e) => setNewReport({...newReport, format: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-body-normal text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  {formats.map(format => (
                    <option key={format.value} value={format.value}>{format.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateReport}>
                Schedule Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledReports;