import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TechnicianStats = ({ stats, onRefresh }) => {
  const [detailedStats, setDetailedStats] = useState({
    technicianPerformance: [],
    jobStatusBreakdown: {},
    recentActivity: [],
    workloadDistribution: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    fetchDetailedStats();
  }, []);

  const fetchDetailedStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch technician performance data
      const techResponse = await fetch(`${API_BASE}/admin/technicians`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch jobs data
      const jobResponse = await fetch(`${API_BASE}/jobs/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (techResponse.ok && jobResponse.ok) {
        const technicians = await techResponse.json();
        const jobs = await jobResponse.json();

        // Process technician performance
        const techPerformance = technicians.map(tech => ({
          id: tech.id,
          name: tech.username,
          assignedJobs: jobs.filter(job => job.assigned_technician === tech.id).length,
          completedJobs: jobs.filter(job => job.assigned_technician === tech.id && job.status === 'Completed').length,
          inProgressJobs: jobs.filter(job => job.assigned_technician === tech.id && job.status === 'In Progress').length,
          isActive: tech.is_active,
          lastLogin: tech.last_login
        }));

        // Process job status breakdown
        const statusBreakdown = jobs.reduce((acc, job) => {
          acc[job.status] = (acc[job.status] || 0) + 1;
          return acc;
        }, {});

        // Process recent activity (last 10 jobs)
        const recentJobs = jobs
          .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
          .slice(0, 10)
          .map(job => ({
            id: job.id,
            description: job.description,
            status: job.status,
            technician: job.assigned_technician_name || 'Unassigned',
            updatedAt: job.updated_at || job.created_at
          }));

        // Process workload distribution
        const workloadDist = technicians.map(tech => ({
          name: tech.username,
          jobCount: jobs.filter(job => job.assigned_technician === tech.id).length,
          isActive: tech.is_active
        })).filter(tech => tech.isActive);

        setDetailedStats({
          technicianPerformance: techPerformance,
          jobStatusBreakdown: statusBreakdown,
          recentActivity: recentJobs,
          workloadDistribution: workloadDist
        });
      } else {
        setError('Failed to fetch detailed statistics');
      }
    } catch (error) {
      console.error('Error fetching detailed stats:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'text-warning';
      case 'Assigned':
        return 'text-accent';
      case 'In Progress':
        return 'text-primary';
      case 'Completed':
        return 'text-success';
      case 'Cancelled':
        return 'text-error';
      default:
        return 'text-text-secondary';
    }
  };

  const handleRefresh = () => {
    onRefresh();
    fetchDetailedStats();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading-semibold text-text-primary">System Overview</h2>
          <p className="text-sm text-text-secondary">Detailed statistics and performance metrics</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center space-x-2"
          disabled={loading}
        >
          <Icon name="RefreshCw" size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-error" />
            <span className="text-sm font-body-medium text-error">Error</span>
          </div>
          <p className="text-sm text-error/80 mt-1">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Technician Performance */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-base font-body-semibold text-text-primary">Technician Performance</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <Icon name="Loader" size={32} className="mx-auto mb-2 animate-spin text-accent" />
              <p className="text-text-secondary">Loading performance data...</p>
            </div>
          ) : detailedStats.technicianPerformance.length === 0 ? (
            <div className="p-8 text-center">
              <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50 text-text-secondary" />
              <p className="text-lg font-body-medium text-text-secondary">No technicians found</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {detailedStats.technicianPerformance.map((tech) => (
                <div key={tech.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                        <Icon name="User" size={14} className="text-accent" />
                      </div>
                      <div>
                        <h4 className="text-sm font-body-semibold text-text-primary">{tech.name}</h4>
                        <p className="text-xs text-text-secondary">
                          {tech.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-body-medium text-text-primary">
                        {tech.assignedJobs} jobs
                      </p>
                      <p className="text-xs text-text-secondary">
                        {tech.completedJobs} completed
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className="bg-success h-2 rounded-full" 
                      style={{ 
                        width: tech.assignedJobs > 0 ? `${(tech.completedJobs / tech.assignedJobs) * 100}%` : '0%' 
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-text-secondary">
                    <span>{tech.inProgressJobs} in progress</span>
                    <span>
                      {tech.assignedJobs > 0 
                        ? `${Math.round((tech.completedJobs / tech.assignedJobs) * 100)}% complete`
                        : 'No jobs assigned'
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Status Breakdown */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-base font-body-semibold text-text-primary">Job Status Breakdown</h3>
          </div>
          
          <div className="p-6">
            {Object.keys(detailedStats.jobStatusBreakdown).length === 0 ? (
              <div className="text-center py-8">
                <Icon name="BarChart3" size={48} className="mx-auto mb-4 opacity-50 text-text-secondary" />
                <p className="text-lg font-body-medium text-text-secondary">No job data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(detailedStats.jobStatusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'Completed' ? 'bg-success' :
                        status === 'In Progress' ? 'bg-primary' :
                        status === 'Assigned' ? 'bg-accent' :
                        status === 'Pending' ? 'bg-warning' :
                        'bg-error'
                      }`}></div>
                      <span className="text-sm font-body-medium text-text-primary">{status}</span>
                    </div>
                    <span className="text-sm font-body-semibold text-text-primary">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-base font-body-semibold text-text-primary">Recent Activity</h3>
          </div>
          
          {detailedStats.recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <Icon name="Activity" size={48} className="mx-auto mb-4 opacity-50 text-text-secondary" />
              <p className="text-lg font-body-medium text-text-secondary">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {detailedStats.recentActivity.map((activity) => (
                <div key={activity.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-body-semibold text-text-primary">
                        Job #{activity.id}
                      </h4>
                      <p className="text-sm text-text-secondary mb-1">
                        {activity.description.length > 50 
                          ? `${activity.description.substring(0, 50)}...` 
                          : activity.description
                        }
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-text-secondary">
                        <span>Technician: {activity.technician}</span>
                        <span>Updated: {new Date(activity.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-body-medium ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workload Distribution */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-base font-body-semibold text-text-primary">Workload Distribution</h3>
          </div>
          
          <div className="p-6">
            {detailedStats.workloadDistribution.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="PieChart" size={48} className="mx-auto mb-4 opacity-50 text-text-secondary" />
                <p className="text-lg font-body-medium text-text-secondary">No active technicians</p>
              </div>
            ) : (
              <div className="space-y-4">
                {detailedStats.workloadDistribution.map((tech, index) => {
                  const maxJobs = Math.max(...detailedStats.workloadDistribution.map(t => t.jobCount));
                  const percentage = maxJobs > 0 ? (tech.jobCount / maxJobs) * 100 : 0;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-body-medium text-text-primary">{tech.name}</span>
                        <span className="text-sm font-body-semibold text-text-primary">{tech.jobCount} jobs</span>
                      </div>
                      <div className="w-full bg-background rounded-full h-2">
                        <div 
                          className="bg-accent h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianStats;
