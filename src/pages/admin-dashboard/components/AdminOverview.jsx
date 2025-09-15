import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AdminOverview = ({ onStatsUpdate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'https://progress.pythonanywhere.com/api';

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/auth/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdated(new Date());
        onStatsUpdate && onStatsUpdate(data);
      } else {
        setError('Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status, count) => {
    if (count === 0) return 'text-text-secondary';
    
    switch (status) {
      case 'pending':
        return 'text-warning';
      case 'in_progress':
        return 'text-accent';
      case 'ready_to_collect':
        return 'text-info';
      case 'completed':
        return 'text-success';
      case 'overdue':
        return 'text-error';
      case 'on_hold':
        return 'text-secondary';
      default:
        return 'text-text-primary';
    }
  };

  const getStatusBgColor = (status, count) => {
    if (count === 0) return 'bg-background';
    
    switch (status) {
      case 'pending':
        return 'bg-warning/10';
      case 'in_progress':
        return 'bg-accent/10';
      case 'ready_to_collect':
        return 'bg-info/10';
      case 'completed':
        return 'bg-success/10';
      case 'overdue':
        return 'bg-error/10';
      case 'on_hold':
        return 'bg-secondary/10';
      default:
        return 'bg-background';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'Clock';
      case 'in_progress':
        return 'Wrench';
      case 'ready_to_collect':
        return 'Car';
      case 'completed':
        return 'CheckCircle';
      case 'overdue':
        return 'AlertTriangle';
      case 'on_hold':
        return 'Pause';
      case 'technicians':
        return 'Users';
      case 'total':
        return 'Clipboard';
      default:
        return 'Info';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader" size={32} className="animate-spin text-accent" />
        <span className="ml-2 text-text-secondary">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-2">
          <Icon name="AlertCircle" size={20} className="text-error" />
          <span className="text-lg font-heading-semibold text-error">Error</span>
        </div>
        <p className="text-error/80 mb-4">{error}</p>
        <Button onClick={fetchStats} variant="outline">
          <Icon name="RefreshCw" size={16} className="mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with last updated */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading-bold text-text-primary">Dashboard Overview</h2>
          <p className="text-sm text-text-secondary">
            Real-time system status and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-text-secondary">
            <Icon name="Clock" size={14} />
            <span>
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </span>
          </div>
          <Button onClick={fetchStats} variant="outline" size="sm">
            <Icon name="RefreshCw" size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Jobs */}
        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body-medium text-text-secondary">Total Jobs</p>
              <p className="text-2xl font-heading-bold text-text-primary">{stats.totalJobs}</p>
              <p className="text-xs text-text-secondary">
                {stats.assignedToday} assigned today
              </p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <Icon name="Clipboard" size={24} className="text-text-primary" />
            </div>
          </div>
        </div>

        {/* Pending Jobs */}
        <div className={`rounded-lg p-6 border border-border ${getStatusBgColor('pending', stats.pendingJobs)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body-medium text-text-secondary">Pending Jobs</p>
              <p className={`text-2xl font-heading-bold ${getStatusColor('pending', stats.pendingJobs)}`}>
                {stats.pendingJobs}
              </p>
              <p className="text-xs text-text-secondary">
                Awaiting assignment
              </p>
            </div>
            <div className={`p-3 rounded-lg ${getStatusBgColor('pending', stats.pendingJobs)}`}>
              <Icon name={getStatusIcon('pending')} size={24} className={getStatusColor('pending', stats.pendingJobs)} />
            </div>
          </div>
        </div>

        {/* In Progress Jobs */}
        <div className={`rounded-lg p-6 border border-border ${getStatusBgColor('in_progress', stats.inProgressJobs)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body-medium text-text-secondary">In Progress</p>
              <p className={`text-2xl font-heading-bold ${getStatusColor('in_progress', stats.inProgressJobs)}`}>
                {stats.inProgressJobs}
              </p>
              <p className="text-xs text-text-secondary">
                Being worked on
              </p>
            </div>
            <div className={`p-3 rounded-lg ${getStatusBgColor('in_progress', stats.inProgressJobs)}`}>
              <Icon name={getStatusIcon('in_progress')} size={24} className={getStatusColor('in_progress', stats.inProgressJobs)} />
            </div>
          </div>
        </div>

        {/* Completed Today */}
        <div className={`rounded-lg p-6 border border-border ${getStatusBgColor('completed', stats.completedToday)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body-medium text-text-secondary">Completed Today</p>
              <p className={`text-2xl font-heading-bold ${getStatusColor('completed', stats.completedToday)}`}>
                {stats.completedToday}
              </p>
              <p className="text-xs text-text-secondary">
                {stats.completedJobs} total completed
              </p>
            </div>
            <div className={`p-3 rounded-lg ${getStatusBgColor('completed', stats.completedToday)}`}>
              <Icon name={getStatusIcon('completed')} size={24} className={getStatusColor('completed', stats.completedToday)} />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ready to Collect */}
        <div className={`rounded-lg p-6 border border-border ${getStatusBgColor('ready_to_collect', stats.readyToCollectJobs)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body-medium text-text-secondary">Ready to Collect</p>
              <p className={`text-2xl font-heading-bold ${getStatusColor('ready_to_collect', stats.readyToCollectJobs)}`}>
                {stats.readyToCollectJobs}
              </p>
              <p className="text-xs text-text-secondary">
                Awaiting pickup
              </p>
            </div>
            <div className={`p-3 rounded-lg ${getStatusBgColor('ready_to_collect', stats.readyToCollectJobs)}`}>
              <Icon name={getStatusIcon('ready_to_collect')} size={24} className={getStatusColor('ready_to_collect', stats.readyToCollectJobs)} />
            </div>
          </div>
        </div>

        {/* On Hold */}
        <div className={`rounded-lg p-6 border border-border ${getStatusBgColor('on_hold', stats.onHoldJobs)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body-medium text-text-secondary">On Hold</p>
              <p className={`text-2xl font-heading-bold ${getStatusColor('on_hold', stats.onHoldJobs)}`}>
                {stats.onHoldJobs}
              </p>
              <p className="text-xs text-text-secondary">
                Work paused
              </p>
            </div>
            <div className={`p-3 rounded-lg ${getStatusBgColor('on_hold', stats.onHoldJobs)}`}>
              <Icon name={getStatusIcon('on_hold')} size={24} className={getStatusColor('on_hold', stats.onHoldJobs)} />
            </div>
          </div>
        </div>

        {/* Overdue Jobs */}
        <div className={`rounded-lg p-6 border border-border ${getStatusBgColor('overdue', stats.overdueJobs)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body-medium text-text-secondary">Overdue Jobs</p>
              <p className={`text-2xl font-heading-bold ${getStatusColor('overdue', stats.overdueJobs)}`}>
                {stats.overdueJobs}
              </p>
              <p className="text-xs text-text-secondary">
                Past due date
              </p>
            </div>
            <div className={`p-3 rounded-lg ${getStatusBgColor('overdue', stats.overdueJobs)}`}>
              <Icon name={getStatusIcon('overdue')} size={24} className={getStatusColor('overdue', stats.overdueJobs)} />
            </div>
          </div>
        </div>

        {/* Active Technicians */}
        <div className="bg-surface rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body-medium text-text-secondary">Active Technicians</p>
              <p className="text-2xl font-heading-bold text-text-primary">
                {stats.activeTechnicians}
              </p>
              <p className="text-xs text-text-secondary">
                of {stats.totalTechnicians} total
              </p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <Icon name="Users" size={24} className="text-text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Usage Statistics */}
      {stats.inventoryUsage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Usage */}
          <div className="bg-surface rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-body-medium text-text-secondary">Today's Inventory Usage</p>
                <p className="text-2xl font-heading-bold text-text-primary">
                  ${stats.inventoryUsage.today.total_cost.toFixed(2)}
                </p>
                <p className="text-xs text-text-secondary">
                  {stats.inventoryUsage.today.total_items} items used
                </p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <Icon name="Package" size={24} className="text-accent" />
              </div>
            </div>
          </div>

          {/* This Week's Usage */}
          <div className="bg-surface rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-body-medium text-text-secondary">This Week's Usage</p>
                <p className="text-2xl font-heading-bold text-text-primary">
                  ${stats.inventoryUsage.thisWeek.total_cost.toFixed(2)}
                </p>
                <p className="text-xs text-text-secondary">
                  {stats.inventoryUsage.thisWeek.total_items} items used
                </p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <Icon name="TrendingUp" size={24} className="text-info" />
              </div>
            </div>
          </div>

          {/* Popular Parts */}
          <div className="bg-surface rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-body-semibold text-text-primary">Most Used Parts</h4>
              <Icon name="Star" size={16} className="text-warning" />
            </div>
            <div className="space-y-2">
              {stats.inventoryUsage.popularParts.length === 0 ? (
                <p className="text-xs text-text-secondary text-center py-4">No parts used this week</p>
              ) : (
                stats.inventoryUsage.popularParts.slice(0, 3).map((part, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                    <div className="flex-1">
                      <p className="text-xs font-body-medium text-text-primary truncate">
                        {part.part_name || part.part_number}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {part.usage_count} used
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-body-medium text-text-primary">
                        ${part.total_cost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Technician Workload */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading-semibold text-text-primary">Technician Workload</h3>
            <Icon name="BarChart3" size={20} className="text-text-secondary" />
          </div>
        </div>
        
        <div className="p-6">
          {stats.technicianWorkload.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50 text-text-secondary" />
              <p className="text-lg font-body-medium text-text-secondary">No active technicians</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.technicianWorkload.map((tech) => (
                <div key={tech.id} className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                      <Icon name="User" size={16} className="text-accent" />
                    </div>
                    <div>
                      <h4 className="text-sm font-body-semibold text-text-primary">{tech.username}</h4>
                      <p className="text-xs text-text-secondary">{tech.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-lg font-heading-semibold text-warning">{tech.active_jobs}</p>
                      <p className="text-xs text-text-secondary">Active</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-heading-semibold text-success">{tech.completed_jobs}</p>
                      <p className="text-xs text-text-secondary">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-heading-semibold text-text-primary">{tech.total_assigned}</p>
                      <p className="text-xs text-text-secondary">Total</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-lg font-heading-semibold ${
                        tech.efficiency_score >= 85 ? 'text-success' :
                        tech.efficiency_score >= 70 ? 'text-warning' : 'text-error'
                      }`}>
                        {tech.efficiency_score}%
                      </p>
                      <p className="text-xs text-text-secondary">Efficiency</p>
                    </div>
                    <div className="text-center min-w-20">
                      <p className="text-xs text-text-secondary">
                        {tech.last_login ? 
                          new Date(tech.last_login).toLocaleDateString() : 
                          'Never'
                        }
                      </p>
                      <p className="text-xs text-text-secondary">Last Login</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
