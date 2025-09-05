import React, { useState } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useUser } from '../../components/UserContext';

// Import admin/supervisor components
import TechnicianManagement from './components/TechnicianManagement.jsx';
import JobAssignment from './components/JobAssignment.jsx';
import TechnicianStats from './components/TechnicianStats.jsx';

// Import technician components (for future use if needed)
import JobCard from './components/JobCard.jsx';
import ActiveJobTimer from './components/ActiveJobTimer.jsx';
import PhotoCapture from './components/PhotoCapture.jsx';
import PartsRequest from './components/PartsRequest.jsx';
import QuickActions from './components/QuickActions.jsx';
import JobDetailsModal from './components/JobDetailsModal.jsx';
import { useTechnician, TechnicianProvider } from './TechnicianContext';

// Admin/Supervisor View Component
const AdminSupervisorView = () => {
  const [activeTab, setActiveTab] = useState('technicians');
  const [stats, setStats] = useState({
    totalTechnicians: 0,
    activeTechnicians: 0,
    totalJobs: 0,
    assignedJobs: 0,
    unassignedJobs: 0,
    completedJobs: 0
  });

  const handleStatsUpdate = () => {
    // This will be called by child components to refresh stats
    fetchStats();
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';
      
      // Fetch technician stats
      const techResponse = await fetch(`${API_BASE}/admin/technicians`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Fetch job stats
      const jobResponse = await fetch(`${API_BASE}/jobs/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (techResponse.ok && jobResponse.ok) {
        const technicians = await techResponse.json();
        const jobs = await jobResponse.json();
        
        setStats({
          totalTechnicians: technicians.length,
          activeTechnicians: technicians.filter(t => t.is_active).length,
          totalJobs: jobs.length,
          assignedJobs: jobs.filter(j => j.assigned_technician).length,
          unassignedJobs: jobs.filter(j => !j.assigned_technician).length,
          completedJobs: jobs.filter(j => j.status === 'Completed').length
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  const tabs = [
    { id: 'technicians', label: 'Technician Management', icon: 'Users' },
    { id: 'assignments', label: 'Job Assignment', icon: 'Briefcase' },
    { id: 'overview', label: 'Overview', icon: 'BarChart3' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-heading-bold text-text-primary">Technician Management Center</h1>
              <p className="text-text-secondary mt-1">Create technician accounts and assign jobs</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="text-sm text-text-secondary">System Online</span>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body-medium text-text-secondary">Total Technicians</p>
                  <p className="text-2xl font-heading-bold text-text-primary">{stats.totalTechnicians}</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Icon name="Users" size={24} className="text-accent" />
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body-medium text-text-secondary">Active Technicians</p>
                  <p className="text-2xl font-heading-bold text-text-primary">{stats.activeTechnicians}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Icon name="UserCheck" size={24} className="text-success" />
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body-medium text-text-secondary">Unassigned Jobs</p>
                  <p className="text-2xl font-heading-bold text-text-primary">{stats.unassignedJobs}</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Icon name="Clock" size={24} className="text-warning" />
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body-medium text-text-secondary">Completed Jobs</p>
                  <p className="text-2xl font-heading-bold text-text-primary">{stats.completedJobs}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon name="CheckCircle" size={24} className="text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-border mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-body-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                  }`}
                >
                  <Icon name={tab.icon} size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {activeTab === 'technicians' && (
              <TechnicianManagement onStatsUpdate={handleStatsUpdate} />
            )}
            
            {activeTab === 'assignments' && (
              <JobAssignment onStatsUpdate={handleStatsUpdate} />
            )}
            
            {activeTab === 'overview' && (
              <TechnicianStats stats={stats} onRefresh={handleStatsUpdate} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Technician View Component (for future use if needed)
const TechnicianView = () => {
  const {
    assignedJobs,
    activeJob,
    loading,
    error,
    notifications,
    startJob,
    pauseJob,
    resumeJob,
    completeJob,
    updateJobProgress,
    requestParts,
    sendMessage,
    fetchTechnicianJobs,
    addNotification
  } = useTechnician();

  const [selectedJob, setSelectedJob] = useState(null);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);

  // Note: This is the original technician functionality
  // Currently not used as per requirements, but kept for future reference
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          
          <div className="text-center py-12">
            <Icon name="Construction" size={64} className="mx-auto mb-4 text-text-secondary opacity-50" />
            <h1 className="text-2xl font-heading-bold text-text-primary mb-2">Technician View</h1>
            <p className="text-text-secondary">This view is currently disabled. Please contact your administrator.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

// Main Component with Role-based Rendering
const TechnicianWorkstationContent = () => {
  const { user } = useUser();

  // Show admin/supervisor view for admin and supervisor roles
  if (user?.role === 'admin' || user?.role === 'supervisor') {
    return <AdminSupervisorView />;
  }

  // For technicians, show disabled message (as per requirements)
  return <TechnicianView />;
};

const TechnicianWorkstation = () => {
  return (
    <TechnicianProvider>
      <TechnicianWorkstationContent />
    </TechnicianProvider>
  );
};

export default TechnicianWorkstation;
