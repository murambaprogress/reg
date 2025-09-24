import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchCustomers } from '@/api/customers';
import { TextInput } from '@/components/ui';

export const CustomerSearchInput = ({ onSelect, initialValue = '', error }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: customers = [], isLoading } = useQuery(
    ['customers', search],
    () => searchCustomers({ search }),
    {
      enabled: search.length > 2,
      staleTime: 5000,
    }
  );

  useEffect(() => {
    if (initialValue) {
      setSearch(initialValue);
    }
  }, [initialValue]);

  const handleSelect = (customer) => {
    setSearch(customer.name);
    setIsOpen(false);
    onSelect(customer);
  };

  return (
    <div className="relative">
      <TextInput
        label="Search Customer"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        error={error}
        placeholder="Type to search customers..."
      />
      
      {isOpen && search.length > 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-2 text-gray-500">Loading...</div>
          ) : customers.length > 0 ? (
            customers.map((customer) => (
              <div
                key={customer.id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(customer)}
              >
                <div className="font-medium">{customer.name}</div>
                {customer.phone && (
                  <div className="text-sm text-gray-600">{customer.phone}</div>
                )}
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500">No customers found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearchInput;