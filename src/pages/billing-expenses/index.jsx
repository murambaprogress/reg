import React, { useState, useContext } from 'react';
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

const BillingExpenses = () => {
  const [activeTab, setActiveTab] = useState('billing');
  const [isPersonalExpenseModalOpen, setIsPersonalExpenseModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('this-month');

  const { user } = useUser();
  const showPersonal = user?.permissions?.show_personal_expenses;

  const tabs = [
    { id: 'billing', label: 'Customer Billing', icon: 'Receipt' },
    { id: 'expenses', label: 'Business Expenses', icon: 'TrendingDown' },
  ];
  if (showPersonal) tabs.push({ id: 'personal', label: 'Personal Expenses', icon: 'User' });
  tabs.push({ id: 'debtors', label: 'Debtors', icon: 'AlertCircle' });

  const statsData = {
    billing: [
      { title: 'Total Revenue', value: '$28,450', change: '+15%', changeType: 'increase', icon: 'DollarSign', color: 'success' },
      { title: 'Outstanding Invoices', value: '$4,200', change: '-8%', changeType: 'decrease', icon: 'Clock', color: 'warning' },
      { title: 'Paid This Month', value: '$24,250', change: '+22%', changeType: 'increase', icon: 'CheckCircle', color: 'success' },
      { title: 'Avg. Invoice Value', value: '$285', change: '+5%', changeType: 'increase', icon: 'TrendingUp', color: 'accent' },
    ],
    expenses: [
      { title: 'Total Expenses', value: '$12,450', change: '+8%', changeType: 'increase', icon: 'TrendingDown', color: 'error' },
      { title: 'Parts & Supplies', value: '$8,200', change: '+12%', changeType: 'increase', icon: 'Package', color: 'warning' },
      { title: 'Utilities', value: '$1,850', change: '+3%', changeType: 'increase', icon: 'Zap', color: 'accent' },
      { title: 'Equipment', value: '$2,400', change: '-5%', changeType: 'decrease', icon: 'Wrench', color: 'secondary' },
    ],
    personal: [
      { title: 'Admin Expenses', value: '$1,250', change: '+5%', changeType: 'increase', icon: 'User', color: 'primary' },
      { title: 'Travel & Meals', value: '$650', change: '+18%', changeType: 'increase', icon: 'Car', color: 'warning' },
      { title: 'Office Supplies', value: '$300', change: '-2%', changeType: 'decrease', icon: 'FileText', color: 'accent' },
      { title: 'Professional Dev', value: '$300', change: '+10%', changeType: 'increase', icon: 'BookOpen', color: 'success' },
    ],
  };

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
        return <ExpensesTable searchTerm={searchTerm} dateRange={dateRange} isPersonal={true} />;
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsData[activeTab]?.map((stat, index) => (
                <ExpenseStatsCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  change={stat.change}
                  changeType={stat.changeType}
                  icon={stat.icon}
                  color={stat.color}
                />
              ))}
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

export default BillingExpenses;