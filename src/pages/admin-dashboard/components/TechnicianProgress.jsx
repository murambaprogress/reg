import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TechnicianProgress = ({ onStatsUpdate }) => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'https://progress.pythonanywhere.com/api';

  useEffect(() => {
    fetchTechnicianProgress();
    
    // Set up auto-sync every 15 seconds for real-time updates
    const interval = setInterval(() => {
      fetchTechnicianProgress();
    }, 15000);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const fetchTechnicianProgress = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/auth/admin/technician-progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data);
        setLastUpdated(new Date());
        onStatsUpdate && onStatsUpdate();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch technician progress');
      }
    } catch (error) {
      console.error('Error fetching technician progress:', error);
      setError('Network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'pending':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'in progress':
        return 'text-accent bg-accent/10 border-accent/20';
      case 'ready to collect':
        return 'text-info bg-info/10 border-info/20';
      case 'completed':
        return 'text-success bg-success/10 border-success/20';
      case 'on hold':
        return 'text-secondary bg-secondary/10 border-secondary/20';
      default:
        return 'text-text-secondary bg-background border-border';
    }
  };

  const getEfficiencyColor = (score) => {
    if (score >= 85) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-error';
  };

  const formatLastActivity = (lastActivity) => {
    if (!lastActivity) return 'Never';
    
    const now = new Date();
    const activity = new Date(lastActivity);
    const diffInMinutes = Math.floor((now - activity) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleViewDetails = (technician) => {
    setSelectedTechnician(technician);
    setShowProgressModal(true);
  };

  if (loading && technicians.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon name="Loader" size={32} className="animate-spin text-accent" />
        <span className="ml-2 text-text-secondary">Loading technician progress...</span>
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
        <Button onClick={fetchTechnicianProgress} variant="outline">
          <Icon name="RefreshCw" size={16} className="mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading-bold text-text-primary">Technician Progress</h2>
          <p className="text-sm text-text-secondary">
            Real-time job progress and technician performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-text-secondary">
            <Icon name="Clock" size={14} />
            <span>
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </span>
          </div>
          <Button 
            onClick={fetchTechnicianProgress} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <Icon name="RefreshCw" size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Progress Cards */}
      {technicians.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="Users" size={64} className="mx-auto mb-4 opacity-50 text-text-secondary" />
          <h3 className="text-xl font-heading-semibold text-text-primary mb-2">No Technicians Found</h3>
          <p className="text-text-secondary">Add technicians to start tracking their progress</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {technicians.map((tech) => (
            <div key={tech.id} className="bg-surface rounded-lg border border-border overflow-hidden">
              {/* Technician Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                      <Icon name="User" size={20} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-heading-semibold text-text-primary">{tech.username}</h3>
                      <p className="text-sm text-text-secondary">{tech.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-body-medium ${
                      tech.is_active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        tech.is_active ? 'bg-success' : 'bg-error'
                      }`}></div>
                      {tech.is_active ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-heading-bold text-accent">{tech.current_jobs?.length || 0}</p>
                    <p className="text-sm text-text-secondary">Active Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-heading-bold text-success">{tech.completed_today || 0}</p>
                    <p className="text-sm text-text-secondary">Completed Today</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-heading-bold ${getEfficiencyColor(tech.efficiency_score || 0)}`}>
                      {tech.efficiency_score || 0}%
                    </p>
                    <p className="text-sm text-text-secondary">Efficiency</p>
                  </div>
                </div>

                {/* Current Jobs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-body-semibold text-text-primary">Current Jobs</h4>
                    <span className="text-xs text-text-secondary">
                      Last activity: {formatLastActivity(tech.last_activity)}
                    </span>
                  </div>
                  
                  {!tech.current_jobs || tech.current_jobs.length === 0 ? (
                    <div className="text-center py-6 bg-background rounded-lg">
                      <Icon name="Briefcase" size={32} className="mx-auto mb-2 opacity-50 text-text-secondary" />
                      <p className="text-sm text-text-secondary">No active jobs</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tech.current_jobs.map((job, index) => (
                        <div key={index} className="p-3 bg-background rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-body-medium text-text-primary">{job.id}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(job.status)}`}>
                                {job.status}
                              </span>
                            </div>
                            <span className="text-xs text-text-secondary">
                              {job.progress_percentage || 0}% complete
                            </span>
                          </div>
                          
                          <div className="mb-2">
                            <p className="text-sm text-text-primary">{job.customer_name || 'Unknown Customer'}</p>
                            <p className="text-xs text-text-secondary">{job.vehicle_info || 'Unknown Vehicle'}</p>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-border rounded-full h-2">
                            <div 
                              className="bg-accent h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress_percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                      
                      {tech.current_jobs.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(tech)}
                          className="w-full mt-3"
                        >
                          <Icon name="Eye" size={14} className="mr-2" />
                          View All Jobs
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Technician Details Modal */}
      {showProgressModal && selectedTechnician && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg border border-border shadow-modal w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-heading-semibold text-text-primary">
                  {selectedTechnician.username} - Job Details
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  Complete job history and progress tracking
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowProgressModal(false)}
                className="p-2"
              >
                <Icon name="X" size={20} />
              </Button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-background rounded-lg p-4">
                  <h3 className="text-sm font-body-semibold text-text-primary mb-2">Performance Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">Total Assigned:</span>
                      <span className="text-sm font-body-medium text-text-primary">{selectedTechnician.total_assigned || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">Completed Today:</span>
                      <span className="text-sm font-body-medium text-success">{selectedTechnician.completed_today || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">Efficiency Score:</span>
                      <span className={`text-sm font-body-medium ${getEfficiencyColor(selectedTechnician.efficiency_score || 0)}`}>
                        {selectedTechnician.efficiency_score || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">Avg Completion:</span>
                      <span className="text-sm font-body-medium text-text-primary">{selectedTechnician.avg_completion_time || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-background rounded-lg p-4">
                  <h3 className="text-sm font-body-semibold text-text-primary mb-2">Activity Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">Status:</span>
                      <span className={`text-sm font-body-medium ${selectedTechnician.is_active ? 'text-success' : 'text-error'}`}>
                        {selectedTechnician.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">Email:</span>
                      <span className="text-sm font-body-medium text-text-primary">{selectedTechnician.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">Last Activity:</span>
                      <span className="text-sm font-body-medium text-text-primary">
                        {formatLastActivity(selectedTechnician.last_activity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Efficiency Breakdown */}
              {selectedTechnician.efficiency_breakdown && (
                <div className="bg-background rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-body-semibold text-text-primary mb-3">Efficiency Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 32 32">
                          <circle 
                            cx="16" cy="16" r="14" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            className="text-border"
                          />
                          <circle 
                            cx="16" cy="16" r="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${selectedTechnician.efficiency_breakdown.time_efficiency * 0.88} 88`}
                            className="text-accent"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-body-semibold text-text-primary">
                            {selectedTechnician.efficiency_breakdown.time_efficiency}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary">Time Management</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 32 32">
                          <circle 
                            cx="16" cy="16" r="14" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            className="text-border"
                          />
                          <circle 
                            cx="16" cy="16" r="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${selectedTechnician.efficiency_breakdown.delivery_efficiency * 0.88} 88`}
                            className="text-success"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-body-semibold text-text-primary">
                            {selectedTechnician.efficiency_breakdown.delivery_efficiency}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary">On-Time Delivery</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 32 32">
                          <circle 
                            cx="16" cy="16" r="14" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            className="text-border"
                          />
                          <circle 
                            cx="16" cy="16" r="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${selectedTechnician.efficiency_breakdown.inventory_efficiency * 0.88} 88`}
                            className="text-warning"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-body-semibold text-text-primary">
                            {selectedTechnician.efficiency_breakdown.inventory_efficiency}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary">Inventory Usage</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 32 32">
                          <circle 
                            cx="16" cy="16" r="14" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            className="text-border"
                          />
                          <circle 
                            cx="16" cy="16" r="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${selectedTechnician.efficiency_breakdown.overall_efficiency * 0.88} 88`}
                            className={selectedTechnician.efficiency_breakdown.overall_efficiency >= 85 ? 'text-success' : 
                                     selectedTechnician.efficiency_breakdown.overall_efficiency >= 70 ? 'text-warning' : 'text-error'}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-body-semibold text-text-primary">
                            {selectedTechnician.efficiency_breakdown.overall_efficiency}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary">Overall Score</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-text-secondary">
                    <p className="mb-1">
                      <strong>Time Management (40%):</strong> Completing jobs within estimated hours
                    </p>
                    <p className="mb-1">
                      <strong>On-Time Delivery (35%):</strong> Finishing jobs by due date
                    </p>
                    <p>
                      <strong>Inventory Usage (25%):</strong> Using parts within cost estimates
                    </p>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-body-semibold text-text-primary mb-3">Current Jobs</h3>
                {!selectedTechnician.current_jobs || selectedTechnician.current_jobs.length === 0 ? (
                  <div className="text-center py-8 bg-background rounded-lg">
                    <Icon name="Briefcase" size={48} className="mx-auto mb-4 opacity-50 text-text-secondary" />
                    <p className="text-text-secondary">No active jobs assigned</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedTechnician.current_jobs.map((job, index) => (
                      <div key={index} className="p-4 bg-background rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-body-semibold text-text-primary">#{job.id}</span>
                            <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(job.status)}`}>
                              {job.status}
                            </span>
                          </div>
                          <span className="text-sm font-body-medium text-text-primary">
                            {job.progress_percentage || 0}% Complete
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm font-body-medium text-text-primary">{job.customer_name || 'Unknown Customer'}</p>
                            <p className="text-xs text-text-secondary">{job.vehicle_info || 'Unknown Vehicle'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-text-secondary">
                              Started: {job.started_at ? new Date(job.started_at).toLocaleDateString() : 'N/A'}
                            </p>
                            <p className="text-xs text-text-secondary">
                              ETA: {job.estimated_completion ? new Date(job.estimated_completion).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="w-full bg-border rounded-full h-3">
                          <div 
                            className="bg-accent h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                            style={{ width: `${Math.max(job.progress_percentage || 0, 10)}%` }}
                          >
                            {(job.progress_percentage || 0) > 15 && (
                              <span className="text-xs text-white font-body-medium">
                                {job.progress_percentage || 0}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianProgress;
