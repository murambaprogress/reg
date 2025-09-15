import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import { generateFinancialStatementPDF } from './components/generateFinancialStatementPDF';
import { useSales } from '../sales-shop/SalesContext';
import Breadcrumb from '../../components/ui/Breadcrumb';
import MetricsCard from './components/MetricsCard';
import FilterControls from './components/FilterControls';
import RevenueChart from './components/RevenueChart';
import TechnicianPerformance from './components/TechnicianPerformance';
import ServiceAnalytics from './components/ServiceAnalytics';
import ScheduledReports from './components/ScheduledReports';
import Icon from '../../components/AppIcon';

const ReportsAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [selectedServiceType, setSelectedServiceType] = useState('all');
  const [chartType, setChartType] = useState('line');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'BarChart3' },
    { id: 'revenue', label: 'Revenue', icon: 'DollarSign' },
    { id: 'technicians', label: 'Technicians', icon: 'Users' },
    { id: 'services', label: 'Services', icon: 'Wrench' },
    { id: 'scheduled', label: 'Scheduled Reports', icon: 'Calendar' }
  ];

  // Statement data should be provided from backend or context
  const { totalSales: totalSalesFromContext } = useSales();
  const totalSales = Number(totalSalesFromContext || 0);

  // Report rows fetched from backend
  const [reportRows, setReportRows] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  // Server-side aggregates for faster charts
  const [monthlyData, setMonthlyData] = useState([]);
  const [technicianMetrics, setTechnicianMetrics] = useState([]);
  const [serviceTrends, setServiceTrends] = useState([]);

  // KPI metrics should be provided from backend or context
  const kpiMetrics = [
    { title: 'Parts Sales', value: totalSales, change: 12, changeType: 'positive', icon: 'ShoppingCart', unit: '$' },
  ];
  const statementData = [
    { label: 'Parts Sales', amount: totalSales },
    // other entries (invoices, expenses, etc.) will be merged here from their contexts
  ];

  const handleExportPDF = async () => {
    await generateFinancialStatementPDF(statementData, 'Financial Statement', {
      dateRange,
      customer: 'All',
      invoice: 'All',
      vehicle: 'All',
      service: selectedServiceType,
    });
  };

  const downloadCSV = (filename, csvContent) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // for IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportCSV = () => {
    // Build CSV from statementData (expecting [{label, amount}, ...])
    const headers = ['Description', 'Amount'];
    const rows = statementData.map(d => [String(d.label || ''), typeof d.amount === 'number' ? d.amount.toFixed(2) : String(d.amount || '')]);
    const csvLines = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(','))];
    const csvContent = csvLines.join('\n');
    downloadCSV(`financial_statement_${new Date().toISOString().slice(0,10)}.csv`, csvContent);
  };

  const handleRefresh = () => {
    console.log('Refreshing data...');
    // Mock data refresh functionality
  window.__SHOW_TOAST && window.__SHOW_TOAST('Data refreshed successfully!', 'success');
  fetchReport();
  fetchAggregates();
  };

  const fetchAggregates = async () => {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_BASE || '';
    try {
      const mresp = await fetch(`${base}/reports/monthly-revenue?date_range=${encodeURIComponent(dateRange)}${selectedDepartment !== 'all' ? `&department_id=${encodeURIComponent(selectedDepartment)}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (mresp.ok) {
        const md = await mresp.json();
        setMonthlyData(Array.isArray(md) ? md : []);
      }

      const tresp = await fetch(`${base}/reports/technician-metrics?date_range=${encodeURIComponent(dateRange)}${selectedTechnician !== 'all' ? `&technician_id=${encodeURIComponent(selectedTechnician)}` : ''}${selectedDepartment !== 'all' ? `&department_id=${encodeURIComponent(selectedDepartment)}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (tresp.ok) {
        const td = await tresp.json();
        setTechnicianMetrics(Array.isArray(td) ? td : []);
      }
        // Service trends (distribution + monthly trends)
        const sresp = await fetch(`${base}/reports/service-trends?date_range=${encodeURIComponent(dateRange)}${selectedServiceType !== 'all' ? `&service_type=${encodeURIComponent(selectedServiceType)}` : ''}${selectedDepartment !== 'all' ? `&department_id=${encodeURIComponent(selectedDepartment)}` : ''}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (sresp.ok) {
          const sd = await sresp.json();
          setServiceTrends(sd || []);
        }
    } catch (e) {
      console.error('Failed to fetch aggregates', e);
    }
  };

  useEffect(() => {
    // refresh aggregates and rows when filters or tab change
    fetchReport();
    fetchAggregates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateRange, selectedDepartment, selectedTechnician, selectedServiceType]);

  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const token = localStorage.getItem('token');
      const base = import.meta.env.VITE_API_BASE || '';
      const resp = await fetch(`${base}/reports/generate?type=${encodeURIComponent(selectedDepartment || 'comprehensive')}&format=json&date_range=${encodeURIComponent(dateRange)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setReportRows(Array.isArray(data.rows) ? data.rows : []);
      }
    } catch (e) {
      console.error('Failed to fetch report', e);
    } finally {
      setLoadingReport(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="flex items-center justify-center min-h-[400px] bg-surface rounded-lg border border-border">
            <div className="text-center">
              <Icon name="Clock" size={48} className="text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-heading-semibold text-text-primary mb-2">Coming Soon</h3>
              <p className="text-text-secondary">The Overview report is currently under development.</p>
            </div>
          </div>
        );
      
      case 'revenue':
        return (
          <div className="flex items-center justify-center min-h-[400px] bg-surface rounded-lg border border-border">
            <div className="text-center">
              <Icon name="Clock" size={48} className="text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-heading-semibold text-text-primary mb-2">Coming Soon</h3>
              <p className="text-text-secondary">The Revenue report is currently under development.</p>
            </div>
          </div>
        );
      
      case 'technicians':
        return <TechnicianPerformance 
          reportRows={reportRows} 
          technicianMetrics={technicianMetrics} 
          selectedTechnician={selectedTechnician}
          onTechnicianChange={setSelectedTechnician}
        />;
      
      case 'services':
        return <ServiceAnalytics reportRows={reportRows} serviceTrends={serviceTrends} />;
      
      case 'scheduled':
        return <ScheduledReports />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
  <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-heading-semibold text-text-primary">Reports & Analytics</h1>
              <p className="text-text-secondary mt-1">Comprehensive business intelligence and performance insights</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                <Icon name="Clock" size={16} />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <FilterControls
            dateRange={dateRange}
            setDateRange={setDateRange}
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            selectedTechnician={selectedTechnician}
            setSelectedTechnician={setSelectedTechnician}
            selectedServiceType={selectedServiceType}
            setSelectedServiceType={setSelectedServiceType}
            onExportPDF={handleExportPDF}
            onExportCSV={handleExportCSV}
            onRefresh={handleRefresh}
          />

          {/* Tab Navigation */}
          <div className="bg-surface rounded-lg shadow-card border border-border mb-6">
            <div className="flex items-center space-x-1 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-body-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background'
                  }`}
                >
                  <Icon name={tab.icon} size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="animate-fadeIn">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsAnalytics;