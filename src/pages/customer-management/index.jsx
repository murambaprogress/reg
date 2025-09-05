
import React, { useState, useContext } from 'react';
import { CustomerProvider, useCustomers } from './CustomerContext';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import CustomerList from './components/CustomerList';
import CustomerProfile from './components/CustomerProfile';
import VehicleHistory from './components/VehicleHistory';
import CommunicationLog from './components/CommunicationLog';
import BillingDetails from './components/BillingDetails';
import AddCustomerModal from './components/AddCustomerModal';
import Icon from '../../components/AppIcon';

const CustomerManagement = () => {
  const { customers } = useCustomers() || { customers: [] };
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setActiveTab('profile');
  };
  const handleAddCustomer = () => setShowAddModal(true);
  const handleSaveCustomer = (customer) => setShowAddModal(false);
  const handleSaveProfile = () => {};
  const handleScheduleAppointment = () => {};
  const handleSendReminder = () => {};

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'User' },
    { id: 'vehicles', label: 'Vehicle History', icon: 'Car' },
    { id: 'communications', label: 'Communications', icon: 'MessageSquare' },
    { id: 'billing', label: 'Billing', icon: 'CreditCard' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
            {/* Customer List - Left Panel */}
            <div className="lg:col-span-4">
              <CustomerList
                customers={customers}
                selectedCustomer={selectedCustomer}
                onCustomerSelect={handleCustomerSelect}
                onAddCustomer={handleAddCustomer}
              />
            </div>
            {/* Customer Details - Right Panel */}
            <div className="lg:col-span-8 flex flex-col">
              {/* Tab Navigation */}
              {selectedCustomer && (
                <div className="bg-surface rounded-lg border border-border mb-6">
                  <nav className="flex space-x-8 px-6">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 text-sm font-body-medium border-b-2 micro-interaction ${
                          activeTab === tab.id
                            ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <Icon name={tab.icon} size={16} />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              )}
              {/* Tab Content */}
              <div className="flex-1">
                {activeTab === 'profile' && (
                  <CustomerProfile
                    customer={selectedCustomer}
                    onSave={handleSaveProfile}
                    onScheduleAppointment={handleScheduleAppointment}
                    onSendReminder={handleSendReminder}
                  />
                )}
                {activeTab === 'vehicles' && (
                  <VehicleHistory customer={selectedCustomer} />
                )}
                {activeTab === 'communications' && (
                  <CommunicationLog customer={selectedCustomer} />
                )}
                {activeTab === 'billing' && (
                  <BillingDetails customer={selectedCustomer} />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveCustomer}
      />
    </div>
  );
};

const WrappedCustomerManagement = () => (
  <CustomerProvider>
    <CustomerManagement />
  </CustomerProvider>
);

export default WrappedCustomerManagement;