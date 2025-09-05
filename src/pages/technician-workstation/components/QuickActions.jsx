import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActions = ({ currentJob, onContactCustomer, onViewHistory, onMessageSupervisor }) => {
  const [isMessaging, setIsMessaging] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      onMessageSupervisor(currentJob?.id, message);
      setMessage('');
      setIsMessaging(false);
    }
  };

  const quickActionItems = [
    {
      icon: 'Phone',
      label: 'Call Customer',
      action: () => onContactCustomer(currentJob?.customerPhone),
      color: 'text-accent',
      disabled: !currentJob
    },
    {
      icon: 'MessageCircle',
      label: 'Text Customer',
      action: () => onContactCustomer(currentJob?.customerPhone, 'sms'),
      color: 'text-success',
      disabled: !currentJob
    },
    {
      icon: 'History',
      label: 'Service History',
      action: () => onViewHistory(currentJob?.vehicleId),
      color: 'text-warning',
      disabled: !currentJob
    },
    {
      icon: 'UserCheck',
      label: 'Message Supervisor',
      action: () => setIsMessaging(true),
      color: 'text-secondary',
      disabled: false
    }
  ];

  const recentMessages = [
    {
      id: 1,
      from: 'Supervisor Mike',
      message: 'Priority job #JOB-2024-001 needs completion by 3 PM',
      timestamp: '10 min ago',
      type: 'priority'
    },
    {
      id: 2,
      from: 'Parts Department',
      message: 'Brake pads for JOB-2024-003 are ready for pickup',
      timestamp: '25 min ago',
      type: 'info'
    },
    {
      id: 3,
      from: 'Customer Service',
      message: 'Customer John Smith called about pickup time',
      timestamp: '1 hour ago',
      type: 'customer'
    }
  ];

  const getMessageTypeColor = (type) => {
    switch (type) {
      case 'priority': return 'border-l-error';
      case 'info': return 'border-l-accent';
      case 'customer': return 'border-l-success';
      default: return 'border-l-secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-surface rounded-lg border border-border p-6 shadow-card">
        <h3 className="text-lg font-heading-semibold text-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActionItems.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={item.action}
              disabled={item.disabled}
              className="flex flex-col items-center p-4 h-auto space-y-2"
            >
              <Icon name={item.icon} size={24} className={item.color} />
              <span className="text-xs text-center">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Current Job Info */}
      {currentJob && (
        <div className="bg-surface rounded-lg border border-border p-6 shadow-card">
          <h3 className="text-lg font-heading-semibold text-text-primary mb-4">Current Job Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Customer:</span>
              <span className="text-sm font-body-medium text-text-primary">{currentJob.customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Phone:</span>
              <span className="text-sm font-body-medium text-text-primary">{currentJob.customerPhone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Vehicle:</span>
              <span className="text-sm font-body-medium text-text-primary">{currentJob.vehicleInfo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Service:</span>
              <span className="text-sm font-body-medium text-text-primary">{currentJob.serviceDescription}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Estimated Time:</span>
              <span className="text-sm font-body-medium text-text-primary">{currentJob.estimatedTime}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Messages */}
      <div className="bg-surface rounded-lg border border-border p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading-semibold text-text-primary">Recent Messages</h3>
          <Button
            variant="ghost"
            className="text-sm"
          >
            <Icon name="MoreHorizontal" size={16} />
          </Button>
        </div>
        <div className="space-y-3">
          {recentMessages.map(msg => (
            <div key={msg.id} className={`border-l-4 ${getMessageTypeColor(msg.type)} pl-4 py-2`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-body-medium text-text-primary">{msg.from}</span>
                <span className="text-xs text-text-secondary">{msg.timestamp}</span>
              </div>
              <p className="text-sm text-text-secondary">{msg.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Message Supervisor Modal */}
      {isMessaging && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-modal p-4">
          <div className="bg-surface rounded-lg border border-border p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading-semibold text-text-primary">Message Supervisor</h3>
              <Button
                variant="ghost"
                onClick={() => setIsMessaging(false)}
                className="p-2"
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message to supervisor..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsMessaging(false)}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  fullWidth
                >
                  <Icon name="Send" size={16} className="mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActions;