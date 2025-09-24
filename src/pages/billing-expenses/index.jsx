import React, { useState, useEffect } from 'react';
import Debtors from './components/debtors';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import ExpensesTable from './components/ExpensesTable';
import BillingTable from './components/BillingTable';
import PersonalExpensesModal from './components/PersonalExpensesModal';
import { useUser } from '../../components/UserContext';
import ExpenseStatsCard from './components/ExpenseStatsCard';
import { BillingProvider, useBilling } from './BillingContext';

import { NotificationProvider } from '../../hooks/useNotification';

const BillingExpensesContent = () => {
  const [activeTab, setActiveTab] = useState('billing');
  const [isPersonalExpenseModalOpen, setIsPersonalExpenseModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('this-month');

  const { user } = useUser();
  const { 
    stats, 
    fetchBillingStats, 
    fetchExpenseStats, 
    fetchInvoices, 
    fetchExpenses, 
    fetchDebtors,
    loading,
    error 
  } = useBilling();
  
  const showPersonal = user?.permissions?.show_personal_expenses;

  const tabs = [
    { id: 'billing', label: 'Customer Billing', icon: 'Receipt' },
    { id: 'expenses', label: 'Business Expenses', icon: 'TrendingDown' },
  ];
  if (showPersonal) tabs.push({ id: 'personal', label: 'Personal Expenses', icon: 'User' });
  tabs.push({ id: 'debtors', label: 'Debtors', icon: 'AlertCircle' });

  // Load data when component mounts or tab changes
  useEffect(() => {
    const loadData = async () => {
      try {
        if (activeTab === 'billing') {
          await fetchBillingStats();
          await fetchInvoices({ search: searchTerm, date_range: dateRange });
        } else if (activeTab === 'expenses') {
          await fetchExpenseStats('business');
          await fetchExpenses({ 
            search: searchTerm, 
            date_range: dateRange, 
            expense_type: 'business' 
          });
        } else if (activeTab === 'personal') {
          await fetchExpenseStats('personal');
          await fetchExpenses({ 
            search: searchTerm, 
            date_range: dateRange, 
            expense_type: 'personal' 
          });
        } else if (activeTab === 'debtors') {
          await fetchDebtors({ search: searchTerm });
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, [activeTab, searchTerm, dateRange]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'billing':
        return <BillingTable searchTerm={searchTerm} dateRange={dateRange} />;
      case 'expenses':
        return <ExpensesTable searchTerm={searchTerm} dateRange={dateRange} />;
      case 'personal':
        return (
          <div className="flex items-center justify-center min-h-[400px] bg-surface rounded-lg border border-border">
            <div className="text-center">
              <Icon name="Clock" size={48} className="text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-heading-semibold text-text-primary mb-2">Coming Soon</h3>
              <p className="text-text-secondary">The Personal Expenses feature is currently under development.</p>
            </div>
          </div>
        );
      case 'debtors':
        return <Debtors />;
      default:
        return null;
    }
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
                  <h1 className="text-2xl font-heading-semibold text-text-primary mb-2 gradient-text">
                    Billing & Expenses
                  </h1>
                  <p className="text-text-secondary">
                    Manage customer billing, business expenses, and personal admin costs
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  {activeTab === 'personal' && showPersonal && (
                    <Button
                      onClick={() => setIsPersonalExpenseModalOpen(true)}
                      className="modern-button bg-primary text-primary-foreground shadow-lg hover:shadow-xl"
                    >
                      <Icon name="Plus" size={16} className="mr-2" />
                      Add Personal Expense
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="modern-button border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon name="Download" size={16} className="mr-2" />
                    Export Data
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mb-8">
              <div className="border-b border-border">
                <nav className="flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-body-medium text-sm modern-button ${
                        activeTab === tab.id
                          ? 'border-primary text-primary glow-selection' :'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                      }`}
                    >
                      <Icon name={tab.icon} size={16} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6">
                <div className="modern-card p-4 bg-red-50 border-red-200">
                  <div className="flex items-center">
                    <Icon name="AlertCircle" size={20} className="text-red-500 mr-3" />
                    <div>
                      <h3 className="text-red-800 font-semibold">Something went wrong</h3>
                      <p className="text-red-600 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="modern-card p-6 animate-pulse">
                    <div className="h-4 bg-border rounded mb-2"></div>
                    <div className="h-8 bg-border rounded mb-2"></div>
                    <div className="h-3 bg-border rounded w-1/2"></div>
                  </div>
                ))
              ) : error ? (
                // Error state - show empty cards
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="modern-card p-6">
                    <div className="text-center text-text-secondary">
                      <Icon name="AlertCircle" size={24} className="mx-auto mb-2" />
                      <p className="text-sm">Unable to load data</p>
                    </div>
                  </div>
                ))
              ) : (
                (() => {
                  let currentStats = [];
                  if (activeTab === 'billing') {
                    currentStats = stats.billing || [];
                  } else if (activeTab === 'expenses') {
                    currentStats = stats.expenses || [];
                  } else if (activeTab === 'personal') {
                    currentStats = stats.personal || [];
                  }
                  
                  return currentStats.map((stat, index) => (
                    <ExpenseStatsCard
                      key={index}
                      title={stat.title}
                      value={stat.value}
                      change={stat.change}
                      changeType={stat.changeType}
                      icon={stat.icon}
                      color={stat.color}
                    />
                  ));
                })()
              )}
            </div>

            {/* Filters */}
            <div className="mb-6">
              <div className="modern-card p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="modern-input"
                      icon="Search"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="modern-input px-4 py-2 border border-border rounded-lg bg-surface text-text-primary focus:border-primary focus:glow-selection"
                    >
                      <option value="this-week">This Week</option>
                      <option value="this-month">This Month</option>
                      <option value="last-month">Last Month</option>
                      <option value="this-quarter">This Quarter</option>
                      <option value="this-year">This Year</option>
                    </select>
                    <Button
                      variant="outline"
                      className="modern-button border-border hover:border-primary"
                    >
                      <Icon name="Filter" size={16} className="mr-2" />
                      More Filters
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="modern-card">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>

      {/* Personal Expenses Modal */}
      {showPersonal && (
        <PersonalExpensesModal
          isOpen={isPersonalExpenseModalOpen}
          onClose={() => setIsPersonalExpenseModalOpen(false)}
        />
      )}
    </div>
  );
};

// Wrapper component with BillingProvider
const WrappedBillingExpenses = () => (
  <NotificationProvider>
    <BillingProvider>
      <BillingExpensesContent />
    </BillingProvider>
  </NotificationProvider>
);

export default WrappedBillingExpenses;
