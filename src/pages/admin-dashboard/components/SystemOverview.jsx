import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SystemOverview = ({ stats, onRefresh }) => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    status: 'healthy',
    uptime: '99.9%',
    lastBackup: new Date().toISOString(),
    activeConnections: 12
  });

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/recent-activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Fallback to mock data if API fails
      setRecentActivity([
        {
          id: 1,
          type: 'job_completed',
          message: 'Job #123 completed by John Doe',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          icon: 'CheckCircle',
          color: 'text-success'
        },
        {
          id: 2,
          type: 'technician_login',
          message: 'Mike Smith logged in',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          icon: 'User',
          color: 'text-accent'
        },
        {
          id: 3,
          type: 'job_assigned',
          message: 'Job #124 assigned to Sarah Johnson',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          icon: 'UserCheck',
          color: 'text-primary'
        },
        {
          id: 4,
          type: 'parts_requested',
          message: 'Parts requested for Job #122',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          icon: 'Package',
          color: 'text-warning'
        }
      ]);
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
          onClick={onRefresh}
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
                <span className="text-sm font-body-medium text-text-primary">94%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Technician Utilization</span>
                <span className="text-sm font-body-medium text-text-primary">87%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Customer Satisfaction</span>
                <span className="text-sm font-body-medium text-text-primary">96%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Parts Availability</span>
                <span className="text-sm font-body-medium text-text-primary">78%</span>
              </div>
              <div className="w-full bg-background rounded-full h-2">
                <div className="bg-warning h-2 rounded-full" style={{ width: '78%' }}></div>
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
