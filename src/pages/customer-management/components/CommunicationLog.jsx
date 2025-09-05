import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const CommunicationLog = ({ customer }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCommunication, setNewCommunication] = useState({
    type: 'phone',
    subject: '',
    notes: ''
  });

  if (!customer) {
    return (
      <div className="bg-surface rounded-lg border border-border h-full flex items-center justify-center">
        <div className="text-center">
          <Icon name="MessageSquare" size={48} className="text-text-secondary mb-4 mx-auto" />
          <p className="text-text-secondary">Select a customer to view communication log</p>
        </div>
      </div>
    );
  }

  const communications = customer.communications || [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getCommunicationIcon = (type) => {
    switch (type) {
      case 'phone':
        return 'Phone';
      case 'email':
        return 'Mail';
      case 'sms':
        return 'MessageSquare';
      case 'appointment':
        return 'Calendar';
      case 'visit':
        return 'MapPin';
      default:
        return 'MessageCircle';
    }
  };

  const getCommunicationColor = (type) => {
    switch (type) {
      case 'phone':
        return 'text-accent';
      case 'email':
        return 'text-success';
      case 'sms':
        return 'text-warning';
      case 'appointment':
        return 'text-primary';
      case 'visit':
        return 'text-secondary';
      default:
        return 'text-text-secondary';
    }
  };

  const handleAddCommunication = () => {
    // In a real app, this would save to backend
    console.log('Adding communication:', newCommunication);
    setNewCommunication({ type: 'phone', subject: '', notes: '' });
    setShowAddForm(false);
  };

  return (
    <div className="bg-surface rounded-lg border border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading-semibold text-text-primary">Communication Log</h2>
          <Button
            variant="primary"
            iconName="Plus"
            iconPosition="left"
            onClick={() => setShowAddForm(true)}
            className="text-sm"
          >
            Add Entry
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            iconName="Phone"
            iconPosition="left"
            className="text-sm"
          >
            Call Customer
          </Button>
          <Button
            variant="outline"
            iconName="Mail"
            iconPosition="left"
            className="text-sm"
          >
            Send Email
          </Button>
          <Button
            variant="outline"
            iconName="MessageSquare"
            iconPosition="left"
            className="text-sm"
          >
            Send SMS
          </Button>
          <Button
            variant="outline"
            iconName="Calendar"
            iconPosition="left"
            className="text-sm"
          >
            Schedule
          </Button>
        </div>
      </div>

      {/* Add Communication Form */}
      {showAddForm && (
        <div className="p-6 border-b border-border bg-background">
          <h3 className="text-md font-heading-medium text-text-primary mb-4">Add Communication Entry</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Type</label>
              <select
                value={newCommunication.type}
                onChange={(e) => setNewCommunication({...newCommunication, type: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="phone">Phone Call</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="appointment">Appointment</option>
                <option value="visit">In-Person Visit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Subject</label>
              <Input
                type="text"
                value={newCommunication.subject}
                onChange={(e) => setNewCommunication({...newCommunication, subject: e.target.value})}
                placeholder="Enter subject or topic"
              />
            </div>

            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">Notes</label>
              <textarea
                value={newCommunication.notes}
                onChange={(e) => setNewCommunication({...newCommunication, notes: e.target.value})}
                placeholder="Enter communication details..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="primary"
                onClick={handleAddCommunication}
                className="text-sm"
              >
                Add Entry
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Communication List */}
      <div className="flex-1 overflow-y-auto">
        {communications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Icon name="MessageSquare" size={48} className="text-text-secondary mb-4" />
            <h3 className="text-lg font-heading-medium text-text-primary mb-2">No Communications</h3>
            <p className="text-text-secondary">Start tracking customer communications</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {communications.map((comm) => (
              <div key={comm.id} className="p-6 micro-interaction hover:bg-background">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-background ${getCommunicationColor(comm.type)}`}>
                    <Icon name={getCommunicationIcon(comm.type)} size={16} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-body-medium text-text-primary">
                        {comm.subject}
                      </h4>
                      <span className="text-xs text-text-secondary">
                        {formatDate(comm.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-2 text-xs text-text-secondary">
                      <span className="capitalize">{comm.type}</span>
                      <span>•</span>
                      <span>By {comm.staffMember}</span>
                      {comm.direction && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{comm.direction}</span>
                        </>
                      )}
                    </div>
                    
                    {comm.notes && (
                      <p className="text-sm text-text-secondary mt-2">{comm.notes}</p>
                    )}
                    
                    {comm.followUpRequired && (
                      <div className="mt-3 p-2 bg-warning/10 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Icon name="Clock" size={14} className="text-warning" />
                          <span className="text-xs text-warning font-body-medium">
                            Follow-up required by {formatDate(comm.followUpDate)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationLog;