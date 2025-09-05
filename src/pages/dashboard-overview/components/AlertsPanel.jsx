import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AlertsPanel = () => {
  const [alerts] = useState([
    {
      id: 1,
      type: 'critical',
      title: 'Low Stock Alert',
      message: 'Brake pads inventory below minimum threshold (5 units remaining)',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      read: false,
      action: 'Reorder Now'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Overdue Job',
      message: 'JOB-005 scheduled completion time exceeded by 2 hours',
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      read: false,
      action: 'Check Status'
    },
    {
      id: 3,
      type: 'info',
      title: 'Customer Waiting',
      message: 'Sarah Wilson arrived for scheduled appointment',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      read: true,
      action: 'View Details'
    },
    {
      id: 4,
      type: 'success',
      title: 'Job Completed',
      message: 'JOB-003 Ford F-150 service completed successfully',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      read: true,
      action: 'Generate Invoice'
    },
    {
      id: 5,
      type: 'warning',
      title: 'Equipment Maintenance',
      message: 'Hydraulic lift #2 due for scheduled maintenance',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      read: false,
      action: 'Schedule Service'
    }
  ]);

  const [quickActions] = useState([
    { id: 1, label: 'Create New Job', icon: 'Plus', color: 'primary' },
    { id: 2, label: 'Add Customer', icon: 'UserPlus', color: 'success' },
    { id: 3, label: 'Check Inventory', icon: 'Package', color: 'warning' },
    { id: 4, label: 'Generate Report', icon: 'FileText', color: 'accent' }
  ]);

  const getAlertIcon = (type) => {
    const icons = {
      'critical': 'AlertTriangle',
      'warning': 'AlertCircle',
      'info': 'Info',
      'success': 'CheckCircle'
    };
    return icons[type] || 'Bell';
  };

  const getAlertColor = (type) => {
    const colors = {
      'critical': 'text-error',
      'warning': 'text-warning',
      'info': 'text-accent',
      'success': 'text-success'
    };
    return colors[type] || 'text-text-secondary';
  };

  const getAlertBgColor = (type, read) => {
    if (read) return 'bg-surface';
    
    const colors = {
      'critical': 'bg-error/5 border-error/20',
      'warning': 'bg-warning/5 border-warning/20',
      'info': 'bg-accent/5 border-accent/20',
      'success': 'bg-success/5 border-success/20'
    };
    return colors[type] || 'bg-surface';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const unreadCount = alerts.filter(alert => !alert.read).length;

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      <div className="bg-surface rounded-lg shadow-card border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-heading-semibold text-text-primary">Recent Alerts</h2>
              {unreadCount > 0 && (
                <span className="bg-error text-error-foreground text-xs px-2 py-1 rounded-full font-data-normal">
                  {unreadCount}
                </span>
              )}
            </div>
            <Button variant="ghost" className="p-2">
              <Icon name="Settings" size={16} />
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`border rounded-lg p-4 micro-interaction hover:shadow-md ${getAlertBgColor(alert.type, alert.read)}`}
              >
                <div className="flex items-start space-x-3">
                  <Icon 
                    name={getAlertIcon(alert.type)} 
                    size={16} 
                    className={`mt-0.5 ${getAlertColor(alert.type)}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-heading-medium text-text-primary">{alert.title}</h3>
                      <span className="text-xs text-text-secondary">{formatTimeAgo(alert.timestamp)}</span>
                    </div>
                    <p className="text-sm text-text-secondary mb-3">{alert.message}</p>
                    <div className="flex items-center justify-between">
                      <Button variant="text" size="sm">
                        {alert.action}
                      </Button>
                      {!alert.read && (
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Button variant="text" fullWidth>
              View All Alerts
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-surface rounded-lg shadow-card border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-heading-semibold text-text-primary">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                className="justify-start p-4 h-auto"
              >
                <Icon name={action.icon} size={18} className="mr-3" />
                <span className="text-sm font-body-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-surface rounded-lg shadow-card border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-heading-semibold text-text-primary">System Status</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm text-text-secondary">Database</span>
              </div>
              <span className="text-sm font-body-medium text-success">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm text-text-secondary">Payment Gateway</span>
              </div>
              <span className="text-sm font-body-medium text-success">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <span className="text-sm text-text-secondary">Backup System</span>
              </div>
              <span className="text-sm font-body-medium text-warning">Syncing</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm text-text-secondary">API Services</span>
              </div>
              <span className="text-sm font-body-medium text-success">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;