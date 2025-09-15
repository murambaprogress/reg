import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';


const TechnicianPerformance = ({ reportRows = [], technicianMetrics = null, selectedTechnician: externalSelectedTechnician, onTechnicianChange }) => {
  const [chartType, setChartType] = useState('bar');
  const [selectedTechnician, setSelectedTechnician] = useState(externalSelectedTechnician || 'all');
  const [realTechnicians, setRealTechnicians] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [detailedJobs, setDetailedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);

  // Update internal state when external prop changes
  useEffect(() => {
    if (externalSelectedTechnician !== undefined) {
      setSelectedTechnician(externalSelectedTechnician);
    }
  }, [externalSelectedTechnician]);

  // Handle technician selection change
  const handleTechnicianChange = (technicianId) => {
    setSelectedTechnician(technicianId);
    if (onTechnicianChange) {
      onTechnicianChange(technicianId);
    }
  };

  // Fetch real technicians from backend
  useEffect(() => {
    const fetchRealTechnicians = async () => {
      setLoadingTechnicians(true);
      try {
        const token = localStorage.getItem('token');
        const base = import.meta.env.VITE_API_BASE || '';
        const response = await fetch(`${base}/admin/technicians`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setRealTechnicians(data);
        }
      } catch (error) {
        console.error('Failed to fetch real technicians:', error);
      } finally {
        setLoadingTechnicians(false);
      }
    };

    fetchRealTechnicians();
  }, []);

  // Fetch detailed jobs when a specific technician is selected
  useEffect(() => {
    if (selectedTechnician !== 'all') {
      const fetchDetailedJobs = async () => {
        setLoadingJobs(true);
        try {
          const token = localStorage.getItem('token');
          const base = import.meta.env.VITE_API_BASE || '';
          const response = await fetch(`${base}/reports/technician-jobs/${selectedTechnician}?date_range=month`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setDetailedJobs(data.jobs || []);
          }
        } catch (error) {
          console.error('Failed to fetch detailed jobs:', error);
        } finally {
          setLoadingJobs(false);
        }
      };

      fetchDetailedJobs();
    } else {
      setDetailedJobs([]);
    }
  }, [selectedTechnician]);

  // Use real technician data when available, otherwise fall back to metrics
  let technicianData = [];
  if (realTechnicians.length > 0) {
    // Use real technician data
    technicianData = realTechnicians.map(tech => ({
      id: tech.id,
      name: tech.username,
      jobsCompleted: tech.assigned_jobs_count || 0,
      totalJobs: tech.assigned_jobs_count || 0,
      efficiency: 85, // Default efficiency, could be calculated
      avgCompletionTime: 4.5, // Default time
      customerRating: 4.2, // Default rating
      avatar: null,
      specialization: 'General',
      email: tech.email,
      isActive: tech.is_active
    }));
  } else if (technicianMetrics && Array.isArray(technicianMetrics) && technicianMetrics.length) {
    // Use server-side technicianMetrics when available
    technicianData = technicianMetrics.map((t, i) => ({
      id: t.id || i,
      name: t.technician || t.name || 'Unknown',
      jobsCompleted: Number(t.completed || 0),
      totalJobs: Number(t.total_assigned || 0),
      efficiency: Math.round(Number(t.efficiency_percent || t.efficiency || 0)),
      avgCompletionTime: Number(t.avg_actual_hours || 0),
      customerRating: Number(t.customer_rating || 4.5),
      avatar: t.avatar || null,
      specialization: t.specialization || '',
      totalRevenue: Number(t.total_revenue || 0),
      totalPartsCost: Number(t.total_parts_cost || 0),
      recentJobs: t.recent_jobs || []
    }));
  } else {
    // Build per-technician aggregates from reportRows
    const techMap = {};
    reportRows.forEach(r => {
      const techName = r.technician || 'unassigned';
      const rec = techMap[techName] = techMap[techName] || { name: techName, jobsCompleted: 0, avgCompletionTime: 0, customerRating: 0, efficiency: 0, totalJobs: 0 };
      rec.totalJobs += 1;
      if (r.status === 'completed') rec.jobsCompleted += 1;
    });
    technicianData = Object.values(techMap).map(t => ({
      ...t,
      efficiency: t.totalJobs > 0 ? Math.round((t.jobsCompleted / t.totalJobs) * 100) : 0,
      avgCompletionTime: 0,
      customerRating: 4.5
    }));
  }
  const chartData = technicianData.map(t => ({ name: t.name, completed: t.jobsCompleted, efficiency: t.efficiency }));

  // Filter technicians for dropdown
  const technicianOptions = [
    { value: 'all', label: 'All Technicians' },
    ...realTechnicians.map(tech => ({
      value: tech.id.toString(),
      label: tech.username
    }))
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success bg-success/10';
      case 'in_progress': return 'text-warning bg-warning/10';
      case 'pending': return 'text-accent bg-accent/10';
      case 'ready_to_collect': return 'text-info bg-info/10';
      case 'cancelled': return 'text-error bg-error/10';
      default: return 'text-text-secondary bg-background';
    }
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-success';
    if (efficiency >= 80) return 'text-warning';
    return 'text-error';
  };

  const getEfficiencyBg = (efficiency) => {
    if (efficiency >= 90) return 'bg-success/10';
    if (efficiency >= 80) return 'bg-warning/10';
    return 'bg-error/10';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'CheckCircle';
      case 'in_progress': return 'Clock';
      case 'pending': return 'AlertCircle';
      case 'ready_to_collect': return 'Package';
      case 'cancelled': return 'XCircle';
      default: return 'Circle';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-modal">
          <p className="text-sm font-body-medium text-text-primary mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-text-secondary">{entry.name}:</span>
              <span className="font-body-medium text-text-primary">
                {entry.name === 'Efficiency' ? `${entry.value}%` : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: 'BarChart3' },
    { value: 'line', label: 'Line Chart', icon: 'TrendingUp' },
    { value: 'pie', label: 'Pie Chart', icon: 'PieChart' }
  ];

  const COLORS = ['#4A90E2', '#10B981', '#F59E0B', '#EF4444', '#7C3AED', '#06B6D4'];

  return (
    <div className="bg-surface rounded-lg p-6 shadow-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-heading-medium text-text-primary">Technician Performance</h3>
          <p className="text-sm text-text-secondary mt-1">Individual productivity and efficiency metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 mr-4">
            {chartTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setChartType(type.value)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-body-medium transition-all duration-200 ${
                  chartType === type.value
                    ? 'bg-accent text-accent-foreground'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background'
                }`}
              >
                <Icon name={type.icon} size={16} />
                <span>{type.label}</span>
              </button>
            ))}
          </div>
          <Button variant="outline" iconName="Download" iconSize={16}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Technician Filter */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col space-y-2">
            <label className="text-xs font-body-medium text-text-secondary">Filter by Technician</label>
            <select 
              value={selectedTechnician}
              onChange={(e) => handleTechnicianChange(e.target.value)}
              disabled={loadingTechnicians}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-body-normal text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50"
            >
              {loadingTechnicians ? (
                <option>Loading technicians...</option>
              ) : (
                technicianOptions.map(tech => (
                  <option key={tech.value} value={tech.value}>{tech.label}</option>
                ))
              )}
            </select>
          </div>
          {selectedTechnician !== 'all' && (
            <div className="flex items-center space-x-2 mt-6">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowJobDetails(!showJobDetails)}
                iconName={showJobDetails ? "ChevronUp" : "ChevronDown"}
              >
                {showJobDetails ? 'Hide' : 'Show'} Job Details
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Performance Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="name" 
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" fill="var(--color-accent)" name="Jobs Completed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="efficiency" fill="var(--color-success)" name="Efficiency %" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="name" 
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--color-text-secondary)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="var(--color-accent)" 
                strokeWidth={3}
                name="Jobs Completed"
              />
              <Line 
                type="monotone" 
                dataKey="efficiency" 
                stroke="var(--color-success)" 
                strokeWidth={3}
                name="Efficiency %"
              />
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="completed"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Detailed Job Information */}
      {selectedTechnician !== 'all' && showJobDetails && (
        <div className="mb-6">
          <h4 className="text-md font-heading-medium text-text-primary mb-4">Recent Jobs</h4>
          {loadingJobs ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
              <p className="text-sm text-text-secondary mt-2">Loading job details...</p>
            </div>
          ) : detailedJobs.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="FileText" size={48} className="text-text-secondary mx-auto mb-4" />
              <p className="text-sm text-text-secondary">No jobs found for this technician</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {detailedJobs.map((job) => (
                <div key={job.id} className="bg-background rounded-lg p-4 border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h5 className="text-sm font-body-medium text-text-primary">
                          Job #{job.id} - {job.customer_name}
                        </h5>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-body-medium ${getStatusColor(job.status)}`}>
                          <Icon name={getStatusIcon(job.status)} size={12} className="mr-1" />
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">
                        {job.vehicle_year} {job.vehicle_model} - {job.vehicle_plate}
                      </p>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {job.service_description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-text-secondary">Estimated Cost:</span>
                      <div className="font-body-medium text-text-primary">${job.estimated_cost.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-text-secondary">Actual Cost:</span>
                      <div className="font-body-medium text-text-primary">${job.actual_cost.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-text-secondary">Parts Cost:</span>
                      <div className="font-body-medium text-text-primary">${job.parts_cost.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-text-secondary">Total Cost:</span>
                      <div className="font-body-medium text-accent">${job.total_cost.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-text-secondary">
                    <span>Created: {new Date(job.created_at).toLocaleDateString()}</span>
                    {job.due_date && <span>Due: {new Date(job.due_date).toLocaleDateString()}</span>}
                    {job.completed_at && <span>Completed: {new Date(job.completed_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Technician Details */}
      <div className="space-y-4">
        {loadingTechnicians ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
            <p className="text-sm text-text-secondary mt-2">Loading technicians...</p>
          </div>
        ) : technicianData.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Users" size={48} className="text-text-secondary mx-auto mb-4" />
            <p className="text-sm text-text-secondary">No technician data available</p>
          </div>
        ) : (
          technicianData.map((technician) => (
            <div key={technician.id || technician.name} className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Icon name="User" size={20} className="text-accent" />
                </div>
                <div>
                  <h4 className="text-sm font-body-medium text-text-primary">{technician.name}</h4>
                  <p className="text-xs text-text-secondary">{technician.email || technician.specialization || 'Technician'}</p>
                  {technician.isActive !== undefined && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-body-medium mt-1 ${
                      technician.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                    }`}>
                      {technician.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-lg font-heading-medium text-text-primary">{technician.jobsCompleted || 0}</div>
                  <div className="text-xs text-text-secondary">Jobs Completed</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-heading-medium text-text-primary">{technician.totalJobs || 0}</div>
                  <div className="text-xs text-text-secondary">Total Jobs</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-heading-medium text-text-primary">{technician.avgCompletionTime || 0}h</div>
                  <div className="text-xs text-text-secondary">Avg Time</div>
                </div>
                
                {technician.totalRevenue && (
                  <div className="text-center">
                    <div className="text-lg font-heading-medium text-success">${technician.totalRevenue.toFixed(2)}</div>
                    <div className="text-xs text-text-secondary">Total Revenue</div>
                  </div>
                )}
                
                <div className="text-center">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-body-medium ${getEfficiencyBg(technician.efficiency)} ${getEfficiencyColor(technician.efficiency)}`}>
                    {technician.efficiency || 0}%
                  </div>
                  <div className="text-xs text-text-secondary mt-1">Efficiency</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TechnicianPerformance;