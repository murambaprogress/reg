import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useUser } from '../../components/UserContext';
import TechnicianManagement from './components/TechnicianManagement';
import JobAssignment from './components/JobAssignment';
import SystemOverview from './components/SystemOverview';
import TechnicianProgress from './components/TechnicianProgress';
import AdminOverview from './components/AdminOverview';
import PartsRequestApproval from './components/PartsRequestApproval';

const AdminDashboard = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalTechnicians: 0,
    activeTechnicians: 0,
    pendingJobs: 0,
    completedJobs: 0,
    totalJobs: 0
  });

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

  useEffect(() => {
    // Stats are fetched by individual components, not here
    // This prevents duplicate API calls
  }, []);

  const handleStatsUpdate = (newStats) => {
    // If called without arguments, just trigger a refresh without updating stats
    if (!newStats) {
      return;
    }
    
    setStats({
      totalTechnicians: newStats.totalTechnicians || 0,
      activeTechnicians: newStats.activeTechnicians || 0,
      pendingJobs: newStats.pendingJobs || 0,
      completedJobs: newStats.completedJobs || 0,
      totalJobs: newStats.totalJobs || 0
    });
  };

  const tabs = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'BarChart3' },
    { id: 'technicians', label: 'Technician Management', icon: 'Users' },
    { id: 'assignments', label: 'Job Assignment', icon: 'ClipboardList' },
    { id: 'progress', label: 'Technician Progress', icon: 'Activity' },
    { id: 'parts', label: 'Parts Requests', icon: 'Package' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview onStatsUpdate={handleStatsUpdate} />;
      // 'system' tab removed
      case 'technicians':
        return <TechnicianManagement onStatsUpdate={handleStatsUpdate} />;
      case 'assignments':
        return <JobAssignment onStatsUpdate={handleStatsUpdate} />;
      case 'progress':
        return <TechnicianProgress onStatsUpdate={handleStatsUpdate} />;
      case 'parts':
        return <PartsRequestApproval />;
      default:
        return <AdminOverview onStatsUpdate={fetchStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-heading-bold text-text-primary">
                {user?.role === 'admin' ? 'Admin Dashboard' : 'Supervisor Dashboard'}
              </h1>
              <p className="text-text-secondary mt-1">
                Manage technicians, assign jobs, and monitor system performance
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="text-sm text-text-secondary">System Online</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                <Icon name="Users" size={16} />
                <span>{stats.activeTechnicians}/{stats.totalTechnicians} Technicians</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                <Icon name="Clipboard" size={16} />
                <span>{stats.totalJobs} Total Jobs</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-border mb-8">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-body-medium text-sm transition-colors ${
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
          <div className="min-h-96">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
