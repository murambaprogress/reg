import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import KPICard from './components/KPICard';
import JobStatusBoard from './components/JobStatusBoard';
import ServiceChart from './components/ServiceChart';
import TechnicianActivity from './components/TechnicianActivity';
import AlertsPanel from './components/AlertsPanel';

const DashboardOverview = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const kpiData = [
    {
      title: 'Jobs In Progress',
      value: '12',
      change: '+8%',
      changeType: 'increase',
      icon: 'Clock',
      color: 'accent'
    },
    {
      title: 'Completed Today',
      value: '28',
      change: '+15%',
      changeType: 'increase',
      icon: 'CheckCircle',
      color: 'success'
    },
    {
      title: 'Pending Jobs',
      value: '7',
      change: '-12%',
      changeType: 'decrease',
      icon: 'AlertCircle',
      color: 'warning'
    },
    {
      title: 'Daily Revenue',
      value: '$4,250',
      change: '+22%',
      changeType: 'increase',
      icon: 'DollarSign',
      color: 'primary'
    },
    {
      title: 'Active Technicians',
      value: '8',
      change: '0%',
      changeType: 'increase',
      icon: 'Users',
      color: 'accent'
    },
    {
      title: 'Customer Satisfaction',
      value: '4.8',
      change: '+0.2',
      changeType: 'increase',
      icon: 'Star',
      color: 'success'
    }
  ];

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb />
            
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-heading-semibold text-text-primary mb-2">
                    Dashboard Overview
                  </h1>
                  <p className="text-text-secondary">
                    Welcome back! Here's what's happening at your workshop today.
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 text-right">
                  <div className="text-lg font-data-normal text-text-primary">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {formatDate(currentTime)}
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
              {kpiData.map((kpi, index) => (
                <KPICard
                  key={index}
                  title={kpi.title}
                  value={kpi.value}
                  change={kpi.change}
                  changeType={kpi.changeType}
                  icon={kpi.icon}
                  color={kpi.color}
                />
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
              {/* Left Column - Job Status Board */}
              <div className="xl:col-span-1">
                <JobStatusBoard />
              </div>

              {/* Center Column - Service Charts */}
              <div className="xl:col-span-1">
                <ServiceChart />
              </div>

              {/* Right Column - Alerts and Quick Actions */}
              <div className="xl:col-span-1">
                <AlertsPanel />
              </div>
            </div>

            {/* Bottom Section - Technician Activity */}
            <div className="mb-8">
              <TechnicianActivity />
            </div>

            {/* Footer Stats */}
            <div className="bg-surface rounded-lg shadow-card border border-border p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-heading-semibold text-text-primary mb-1">156</div>
                  <div className="text-sm text-text-secondary">Total Jobs This Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-heading-semibold text-text-primary mb-1">$28,450</div>
                  <div className="text-sm text-text-secondary">Monthly Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-heading-semibold text-text-primary mb-1">2.4h</div>
                  <div className="text-sm text-text-secondary">Avg. Job Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-heading-semibold text-text-primary mb-1">94%</div>
                  <div className="text-sm text-text-secondary">On-Time Completion</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardOverview;