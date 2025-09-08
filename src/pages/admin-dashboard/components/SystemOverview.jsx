import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SystemOverview = ({ stats, onRefresh }) => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    status: 'loading',
    uptime: '0%',
    lastBackup: new Date().toISOString(),
    activeConnections: 0,
    jobCompletionRate: 0,
    technicianUtilization: 0,
    customerSatisfaction: 0,
    partsAvailability: 0
  });

  const API_BASE = import.meta.env.VITE_API_BASE || 'https://progress.pythonanywhere.com/api';

  useEffect(() => {
    fetchRecentActivity();
    fetchSystemHealth();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/auth/admin/recent-activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      } else {
        console.error('Failed to fetch recent activity');
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      setRecentActivity([]);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/auth/admin/system-health`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-error';
      default:
        return 'text-text-secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return 'CheckCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'error':
        return 'AlertCircle';
      default:
        return 'Info';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading-semibold text-text-primary">System Overview</h2>
          <p className="text-sm text-text-secondary">Monitor system health and recent activity</p>
        </div>
        <Button
          onClick={() => {
            onRefresh();
            fetchSystemHealth();
            fetchRecentActivity();
          }}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Icon name="RefreshCw" size={16} />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Health */}
        <div className="bg-surface rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-body-semibold text-text-primary">System Health</h3>
            <div className={`flex items-center space-x-2 ${getStatusColor(systemHealth.status)}`}>
              <Icon name={getStatusIcon(systemHealth.status)} size={16} />
              <span className="text-sm font-body-medium capitalize">{systemHealth.status}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-text-secondary">System Uptime</span>
              <span className="text-sm font-body-medium text-text-primary">{systemHealth.uptime}</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-text-secondary">Active Connections</span>
              <span className="text-sm font-body-medium text-text-primary">{systemHealth.activeConnections}</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-text-secondary">Last Backup</span>
              <span className="text-sm font-body-medium text-text-primary">
                {new Date(systemHealth.lastBackup).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-text-secondary">Database Status</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm font-body-medium text-success">Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-surface rounded-lg border border-border p-6">
          <h3 className="text-base font-body-semibold text-text-primary mb-4">Performance Metrics</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Job Completion Rate</span>
                <span className="text-sm font-body-medium text-text-primary">{systemHealth.jobCompletionRate}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: `${systemHealth.jobCompletionRate}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Technician Utilization</span>
                <span className="text-sm font-body-medium text-text-primary">{systemHealth.technicianUtilization}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: `${systemHealth.technicianUtilization}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Customer Satisfaction</span>
                <span className="text-sm font-body-medium text-text-primary">{systemHealth.customerSatisfaction}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${systemHealth.customerSatisfaction}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Parts Availability</span>
                <span className="text-sm font-body-medium text-text-primary">{systemHealth.partsAvailability}%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-warning h-2 rounded-full" style={{ width: `${systemHealth.partsAvailability}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-body-semibold text-text-primary">Recent Activity</h3>
            <Button
              onClick={fetchRecentActivity}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Icon name="RefreshCw" size={14} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="Activity" size={48} className="mx-auto mb-4 opacity-50 text-text-secondary" />
            <p className="text-lg font-body-medium text-text-secondary">No recent activity</p>
            <p className="text-sm text-text-secondary">Activity will appear here as it happens</p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-background/50">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 ${activity.color}`}>
                    <Icon name={activity.icon} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{activity.message}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      {getTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <h3 className="text-base font-body-semibold text-text-primary mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center space-y-2 h-20"
            onClick={() => window.location.href = '/job-management'}
          >
            <Icon name="Plus" size={20} />
            <span className="text-sm">Create Job</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center space-y-2 h-20"
            onClick={() => window.location.href = '/inventory-management'}
          >
            <Icon name="Package" size={20} />
            <span className="text-sm">Manage Inventory</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center space-y-2 h-20"
            onClick={() => window.location.href = '/reports-analytics'}
          >
            <Icon name="BarChart3" size={20} />
            <span className="text-sm">View Reports</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center space-y-2 h-20"
            onClick={() => window.location.href = '/customer-management'}
          >
            <Icon name="Users" size={20} />
            <span className="text-sm">Manage Customers</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;
