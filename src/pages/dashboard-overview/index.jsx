import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '../../components/UserContext';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import KPICard from './components/KPICard';
import JobStatusBoard from './components/JobStatusBoard';
import ServiceChart from './components/ServiceChart';
// Reuse billing stats so dashboard cards match billing page figures
import { useBilling } from '../billing-expenses/BillingContext';

const DashboardOverview = () => {
  const { user, loading: userLoading } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  // Backend-provided operational KPIs (jobs, parts, customers, etc.)
  const [baseKpiData, setBaseKpiData] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalJobs: 0,
    monthlyRevenue: 0,
    avgJobDuration: '0h',
    onTimeCompletion: 0
  });
  const [loading, setLoading] = useState(true);
  // Billing context provides dynamic invoice-based cards already computed
  const { invoices, expenses, debtors, stats: billingStats, fetchInvoices, fetchExpenses, fetchDebtors } = useBilling();

  const API_BASE = import.meta.env.VITE_API_BASE || '/api';

  useEffect(() => {
    // Update clock every 30 seconds instead of every second to reduce re-renders
    // This significantly reduces React's reconciliation overhead
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Only fetch data if user is authenticated and not loading
    if (!userLoading && user?.token) {
      fetchDashboardData();
      fetchInvoices();
      fetchExpenses();
      fetchDebtors();
    }
  }, [userLoading, user]);

  // Aggregate all KPI sources into one list for display
  const aggregatedKpis = useMemo(() => {
    // Start from backend KPIs but drop partitioned job status cards (keep only Total Jobs)
    const clone = baseKpiData.filter(c => !['Pending Jobs','Completed Jobs','Active Jobs'].includes(c.title));

    // Extract job revenue from backend 'Total Revenue' card (jobs)
    const jobRevenueCard = clone.find(c => c.title === 'Total Revenue');
    const parseMoney = (val) => {
      if (!val) return 0; // expect format like $12,345
      const num = String(val).replace(/[^0-9.\-]/g,'');
      return Number(num) || 0;
    };

    const jobRevenue = jobRevenueCard ? parseMoney(jobRevenueCard.value) : 0;
    const invoiceRevenue = (billingStats?.billing || []).find(c => c.title === 'Total Revenue');
    const invoiceRevenueValue = invoiceRevenue ? parseMoney(invoiceRevenue.value) : 0;

    // Sales revenue: derive from existing backend KPI 'Sales Revenue' or fallback to card titled 'Sales Revenue'
    const salesRevenueCard = clone.find(c => c.title === 'Sales Revenue');
    const salesRevenue = salesRevenueCard ? parseMoney(salesRevenueCard.value) : 0;

    const overallRevenue = jobRevenue + invoiceRevenueValue + salesRevenue;

    // Remove individual revenue cards we are aggregating (keep counts like Total Jobs, Total Sales, etc.)
    const filtered = clone.filter(c => !['Total Revenue','Sales Revenue'].includes(c.title));

    // Expenses: business + personal totals from billing stats arrays
    const businessTotal = (billingStats?.expenses || []).find(c => c.title === 'Total Expenses');
    const personalTotal = (billingStats?.personal || []).find(c => c.title === 'Admin Expenses');
    // Sum all personal categories for a holistic personal figure
    const personalSum = (billingStats?.personal || []).reduce((s,c)=> s + (c.title && c.value ? parseMoney(c.value) : 0),0);
    const businessValue = businessTotal ? parseMoney(businessTotal.value) : 0;
    const overallExpenses = businessValue + personalSum;

    const moneyFormat = (n) => `$${n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;

    // Insert Overall Revenue card (if not existing)
    if (!filtered.some(c => c.title === 'Overall Revenue')) {
      filtered.push({ title: 'Overall Revenue', value: moneyFormat(overallRevenue), change: '', changeType: 'neutral', icon: 'DollarSign', color: 'success' });
    } else {
      // update value if already exists
      filtered.forEach(c => { if (c.title === 'Overall Revenue') c.value = moneyFormat(overallRevenue); });
    }

    // Insert Overall Expenses card
    if (!filtered.some(c => c.title === 'Overall Expenses')) {
      filtered.push({ title: 'Overall Expenses', value: moneyFormat(overallExpenses), change: '', changeType: 'neutral', icon: 'TrendingDown', color: 'error' });
    } else {
      filtered.forEach(c => { if (c.title === 'Overall Expenses') c.value = moneyFormat(overallExpenses); });
    }

    // Outstanding debt aggregated once
    if (Array.isArray(debtors) && debtors.length) {
      const debtSum = debtors.reduce((s,d)=> s + Number(d.total_outstanding || 0),0);
      const debtFormatted = moneyFormat(debtSum);
      if (!filtered.some(c => c.title === 'Outstanding Debt')) {
        filtered.push({ title: 'Outstanding Debt', value: debtFormatted, change: '', changeType: 'neutral', icon: 'AlertTriangle', color: 'warning' });
      } else {
        filtered.forEach(c => { if (c.title === 'Outstanding Debt') c.value = debtFormatted; });
      }
    }

    return filtered;
  }, [baseKpiData, billingStats?.billing, billingStats?.expenses, billingStats?.personal, debtors]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch KPI data
      const kpiResponse = await fetch(`${API_BASE}/auth/dashboard/kpi`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (kpiResponse.ok) {
        const kpiResult = await kpiResponse.json();
        // Initial set; billing stats will merge later
  setBaseKpiData(kpiResult);
      }

      // Fetch monthly stats
      const statsResponse = await fetch(`${API_BASE}/auth/dashboard/monthly-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        setMonthlyStats(statsResult);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (userLoading) {
    return <div className="min-h-screen flex items-center justify-center text-lg">Loading...</div>;
  }
  if (!user?.token) {
    // Optionally, you could redirect or just render nothing
    return <div className="min-h-screen flex items-center justify-center text-lg">Not authenticated.</div>;
  }

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
              {aggregatedKpis.map((kpi, index) => (
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
            {/* Main Content Grid (Graphs Only) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              {/* Job Status Board */}
              <div className="xl:col-span-1">
                <JobStatusBoard />
              </div>
              {/* Service Charts */}
              <div className="xl:col-span-1">
                <ServiceChart />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardOverview;
