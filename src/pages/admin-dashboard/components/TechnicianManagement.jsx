import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useUser } from '../../../components/UserContext';

const TechnicianManagement = ({ onStatsUpdate }) => {
  const { user } = useUser();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTechnician, setNewTechnician] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/technicians`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data);
      } else {
        setError('Failed to fetch technicians');
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTechnician = async (e) => {
    e.preventDefault();
    setError('');

    if (newTechnician.password !== newTechnician.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newTechnician.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/auth/create-technician`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: newTechnician.username,
          email: newTechnician.email,
          password: newTechnician.password
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewTechnician({
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        fetchTechnicians();
        onStatsUpdate();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create technician');
      }
    } catch (error) {
      console.error('Error creating technician:', error);
      setError('Network error occurred');
    }
  };

  const handleDeleteTechnician = async (technicianId) => {
    if (!confirm('Are you sure you want to delete this technician?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/technicians/${technicianId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchTechnicians();
        onStatsUpdate();
      } else {
        setError('Failed to delete technician');
      }
    } catch (error) {
      console.error('Error deleting technician:', error);
      setError('Network error occurred');
    }
  };

  const handleToggleActive = async (technicianId, isActive) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/technicians/${technicianId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        fetchTechnicians();
        onStatsUpdate();
      } else {
        setError('Failed to update technician status');
      }
    } catch (error) {
      console.error('Error updating technician:', error);
      setError('Network error occurred');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading-semibold text-text-primary">Technician Management</h2>
          <p className="text-sm text-text-secondary">Create and manage technician accounts</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <Icon name="Plus" size={16} />
          <span>Add Technician</span>
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-error" />
            <span className="text-sm font-body-medium text-error">Error</span>
          </div>
          <p className="text-sm text-error/80 mt-1">{error}</p>
        </div>
      )}

      {/* Technicians Table */}
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-body-semibold text-text-primary">All Technicians</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <Icon name="Loader" size={32} className="mx-auto mb-2 animate-spin text-accent" />
            <p className="text-text-secondary">Loading technicians...</p>
          </div>
        ) : technicians.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50 text-text-secondary" />
            <p className="text-lg font-body-medium text-text-secondary">No technicians found</p>
            <p className="text-sm text-text-secondary">Create your first technician account</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-body-medium text-text-secondary uppercase tracking-wider">
                    Technician
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-body-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-body-medium text-text-secondary uppercase tracking-wider">
                    Jobs Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-body-medium text-text-secondary uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-body-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {technicians.map((technician) => (
                  <tr key={technician.id} className="hover:bg-background/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                          <Icon name="User" size={16} className="text-accent" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-body-medium text-text-primary">
                            {technician.username}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {technician.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body-medium ${
                        technician.is_active
                          ? 'bg-success/10 text-success'
                          : 'bg-error/10 text-error'
                      }`}>
                        {technician.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {technician.assigned_jobs_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {technician.last_login ? new Date(technician.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-body-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(technician.id, technician.is_active)}
                        >
                          {technician.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        {user?.role === 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTechnician(technician.id)}
                            className="text-error hover:bg-error/10"
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Technician Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading-semibold text-text-primary">Create New Technician</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>

            <form onSubmit={handleCreateTechnician} className="space-y-4">
              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={newTechnician.username}
                  onChange={(e) => setNewTechnician({ ...newTechnician, username: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newTechnician.email}
                  onChange={(e) => setNewTechnician({ ...newTechnician, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newTechnician.password}
                  onChange={(e) => setNewTechnician({ ...newTechnician, password: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-body-medium text-text-primary mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={newTechnician.confirmPassword}
                  onChange={(e) => setNewTechnician({ ...newTechnician, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Technician
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianManagement;
