import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useUser } from '../../components/UserContext';
import TechnicianManagement from './components/TechnicianManagement';
import JobAssignment from './components/JobAssignment';
import SystemOverview from './components/SystemOverview';

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

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'System Overview', icon: 'BarChart3' },
    { id: 'technicians', label: 'Technician Management', icon: 'Users' },
    { id: 'assignments', label: 'Job Assignment', icon: 'ClipboardList' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SystemOverview stats={stats} onRefresh={fetchStats} />;
      case 'technicians':
        return <TechnicianManagement onStatsUpdate={fetchStats} />;
      case 'assignments':
        return <JobAssignment onStatsUpdate={fetchStats} />;
      default:
        return <SystemOverview stats={stats} onRefresh={fetchStats} />;
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
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <span className="text-sm text-text-secondary">System Online</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-surface rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body-medium text-text-secondary">Total Technicians</p>
                  <p className="text-2xl font-heading-bold text-text-primary">{stats.totalTechnicians}</p>
                </div>
                <Icon name="Users" size={24} className="text-accent" />
              </div>
            </div>
            
            <div className="bg-surface rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body-medium text-text-secondary">Active Technicians</p>
                  <p className="text-2xl font-heading-bold text-success">{stats.activeTechnicians}</p>
                </div>
                <Icon name="UserCheck" size={24} className="text-success" />
              </div>
            </div>
            
            <div className="bg-surface rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body-medium text-text-secondary">Pending Jobs</p>
                  <p className="text-2xl font-heading-bold text-warning">{stats.pendingJobs}</p>
                </div>
                <Icon name="Clock" size={24} className="text-warning" />
              </div>
            </div>
            
            <div className="bg-surface rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body-medium text-text-secondary">Completed Today</p>
                  <p className="text-2xl font-heading-bold text-success">{stats.completedJobs}</p>
                </div>
                <Icon name="CheckCircle" size={24} className="text-success" />
              </div>
            </div>
            
            <div className="bg-surface rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body-medium text-text-secondary">Total Jobs</p>
                  <p className="text-2xl font-heading-bold text-text-primary">{stats.totalJobs}</p>
                </div>
                <Icon name="Briefcase" size={24} className="text-accent" />
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
