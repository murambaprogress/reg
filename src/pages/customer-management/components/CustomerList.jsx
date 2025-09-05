import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useCustomers } from '../CustomerContext';

const PAGE_SIZE = 8;

const CustomerList = ({ selectedCustomer, onCustomerSelect, onAddCustomer }) => {
  const { customers: contextCustomers } = useCustomers();
  const customers = Array.isArray(contextCustomers) ? contextCustomers : [];
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [page, setPage] = useState(1);

  const filteredAndSortedCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone.includes(searchTerm);
      if (filterBy === 'all') return matchesSearch;
      if (filterBy === 'active') return matchesSearch && customer.status === 'active';
      if (filterBy === 'inactive') return matchesSearch && customer.status === 'inactive';
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastService':
          return new Date(b.lastServiceDate) - new Date(a.lastServiceDate);
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        default:
          return 0;
      }
    });

  // Calculate total spent by all filtered customers
  const totalSpent = filteredAndSortedCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  const totalPages = Math.ceil(filteredAndSortedCustomers.length / PAGE_SIZE);
  const paginated = filteredAndSortedCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-surface rounded-lg border border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading-semibold text-text-primary">Customers</h2>
          <Button
            variant="primary"
            iconName="Plus"
            iconPosition="left"
            onClick={onAddCustomer}
            className="text-sm"
          >
            Add Customer
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
          <Input
            type="search"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Customers</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="name">Sort by Name</option>
            <option value="lastService">Sort by Last Service</option>
            <option value="totalSpent">Sort by Total Spent</option>
          </select>
        </div>
      </div>

      {/* Customer List Table */}
      <div className="flex-1 overflow-y-auto">
        {paginated.length === 0 ? (
          <div className="text-center text-text-secondary py-12">No customers found.</div>
        ) : (
          <div>
            {paginated.map((customer) => (
              <div
                key={customer.id}
                className={`flex items-center justify-between px-4 py-3 rounded-lg mb-2 cursor-pointer transition-colors ${selectedCustomer && selectedCustomer.id === customer.id ? 'bg-accent/10 border-l-4 border-accent' : 'hover:bg-muted'}`}
                onClick={() => onCustomerSelect(customer)}
              >
                <div>
                  <div className="font-body-medium text-text-primary">{customer.name}</div>
                  <div className="text-xs text-text-secondary">{customer.email} &bull; {customer.phone}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-xs text-text-secondary">Last Service: {customer.lastServiceDate ? formatDate(customer.lastServiceDate) : 'N/A'}</div>
                  <div className="text-xs text-text-secondary">Total Spent: {formatCurrency(customer.totalSpent || 0)}</div>
                  {customer.status === 'active' ? (
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Active"></span>
                  ) : (
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-400" title="Inactive"></span>
                  )}
                </div>
              </div>
            ))}
            {/* Totals Row */}
            <div className="flex items-center justify-end px-4 py-3 mt-2 bg-background/75 font-heading-medium text-text-primary border-t border-border rounded-b-lg">
              <span>Total Spent by Customers: {formatCurrency(totalSpent)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </Button>
          <span className="text-xs text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomerList;