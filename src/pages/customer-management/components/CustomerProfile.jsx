import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const CustomerProfile = ({ customer, onSave, onEdit, onScheduleAppointment, onSendReminder }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(customer || {});

  if (!customer) {
    return (
      <div className="bg-surface rounded-lg border border-border h-full flex items-center justify-center">
        <div className="text-center">
          <Icon name="UserCheck" size={48} className="text-text-secondary mb-4 mx-auto" />
          <h3 className="text-lg font-heading-medium text-text-primary mb-2">Select a Customer</h3>
          <p className="text-text-secondary">Choose a customer from the list to view their profile</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    onSave(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(customer);
    setIsEditing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-surface rounded-lg border border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Icon name="User" size={24} color="white" />
            </div>
            <div>
              <h2 className="text-xl font-heading-semibold text-text-primary">{customer.name}</h2>
              <p className="text-text-secondary">Customer ID: {customer.id}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  iconName="Calendar"
                  iconPosition="left"
                  onClick={onScheduleAppointment}
                  className="text-sm"
                >
                  Schedule
                </Button>
                <Button
                  variant="outline"
                  iconName="Bell"
                  iconPosition="left"
                  onClick={onSendReminder}
                  className="text-sm"
                >
                  Remind
                </Button>
                <Button
                  variant="primary"
                  iconName="Edit"
                  iconPosition="left"
                  onClick={() => setIsEditing(true)}
                  className="text-sm"
                >
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="text-sm"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  className="text-sm"
                >
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-background rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Icon name="DollarSign" size={16} className="text-success" />
              <span className="text-sm text-text-secondary">Total Spent</span>
            </div>
            <p className="text-lg font-heading-semibold text-text-primary mt-1">
              {formatCurrency(customer.totalSpent)}
            </p>
          </div>
          
          <div className="bg-background rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Icon name="Car" size={16} className="text-accent" />
              <span className="text-sm text-text-secondary">Vehicles</span>
            </div>
            <p className="text-lg font-heading-semibold text-text-primary mt-1">
              {customer.vehicles?.length || 0}
            </p>
          </div>
          
          <div className="bg-background rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Icon name="Calendar" size={16} className="text-warning" />
              <span className="text-sm text-text-secondary">Last Service</span>
            </div>
            <p className="text-lg font-heading-semibold text-text-primary mt-1">
              {formatDate(customer.lastServiceDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-heading-medium text-text-primary mb-4">Contact Information</h3>
            
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Full Name</label>
              {isEditing ? (
                <Input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  placeholder="Enter full name"
                />
              ) : (
                <p className="text-text-secondary">{customer.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Email</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editData.email || ''}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                  placeholder="Enter email address"
                />
              ) : (
                <p className="text-text-secondary">{customer.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Phone</label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={editData.phone || ''}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="text-text-secondary">{customer.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Address</label>
              {isEditing ? (
                <textarea
                  value={editData.address || ''}
                  onChange={(e) => setEditData({...editData, address: e.target.value})}
                  placeholder="Enter address"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              ) : (
                <p className="text-text-secondary">{customer.address}</p>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-heading-medium text-text-primary mb-4">Additional Information</h3>
            
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Customer Since</label>
              <p className="text-text-secondary">{formatDate(customer.joinDate)}</p>
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Preferred Contact Method</label>
              {isEditing ? (
                <select
                  value={editData.preferredContact || 'email'}
                  onChange={(e) => setEditData({...editData, preferredContact: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="sms">SMS</option>
                </select>
              ) : (
                <p className="text-text-secondary capitalize">{customer.preferredContact}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Notes</label>
              {isEditing ? (
                <textarea
                  value={editData.notes || ''}
                  onChange={(e) => setEditData({...editData, notes: e.target.value})}
                  placeholder="Add customer notes..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              ) : (
                <p className="text-text-secondary">{customer.notes || 'No notes available'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Status</label>
              <span className={`inline-flex px-3 py-1 text-sm rounded-full ${
                customer.status === 'active' ?'bg-success/10 text-success' :'bg-text-secondary/10 text-text-secondary'
              }`}>
                {customer.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;