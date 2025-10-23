import useSessionErrorHandler from '../../../hooks/useSessionErrorHandler';
import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PartsRequestApproval = () => {
  const [partsRequests, setPartsRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const handleSessionError = useSessionErrorHandler();

  const API_BASE = import.meta.env.VITE_API_BASE || 'https://progress.pythonanywhere.com/api';

  useEffect(() => {
    fetchPartsRequests();
  }, []);

  const fetchPartsRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/jobs/parts-requests/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPartsRequests(data);
      } else {
        // Try to parse error for session
        const errorObj = { message: response.status === 401 ? 'AUTHENTICATION_REQUIRED' : 'UNKNOWN' };
        if (handleSessionError(errorObj, setError)) return;
        setError('Failed to fetch parts requests');
      }
    } catch (error) {
      console.error('Error fetching parts requests:', error);
      if (handleSessionError(error, setError)) return;
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    setProcessingId(requestId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/jobs/parts-requests/${requestId}/approve/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'approve' })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the local state
        setPartsRequests(prev => prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'approved', approved_by: data.parts_request.approved_by, approved_at: data.parts_request.approved_at }
            : req
        ));
        alert('Parts request approved successfully!');
      } else {
        alert(`Failed to approve request: ${data.message}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Network error occurred while approving request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setProcessingId(requestId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/jobs/parts-requests/${requestId}/approve/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'reject' })
      });

      const data = await response.json();

      if (response.ok) {
        // Update the local state
        setPartsRequests(prev => prev.map(req =>
          req.id === requestId
            ? { ...req, status: 'rejected', approved_by: data.parts_request.approved_by, approved_at: data.parts_request.approved_at }
            : req
        ));
        alert('Parts request rejected');
      } else {
        alert(`Failed to reject request: ${data.message}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Network error occurred while rejecting request');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-warning bg-warning/10';
      case 'approved': return 'text-success bg-success/10';
      case 'rejected': return 'text-error bg-error/10';
      case 'fulfilled': return 'text-info bg-info/10';
      default: return 'text-text-secondary bg-background';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'Clock';
      case 'approved': return 'CheckCircle';
      case 'rejected': return 'XCircle';
      case 'fulfilled': return 'Package';
      default: return 'HelpCircle';
    }
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-lg border border-border p-6 shadow-card">
        <div className="flex items-center justify-center py-8">
          <Icon name="Loader" size={24} className="animate-spin text-accent mr-2" />
          <span className="text-sm text-text-secondary">Loading parts requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading-semibold text-text-primary">Parts Request Approval</h3>
        <Button
          variant="outline"
          onClick={fetchPartsRequests}
          className="text-sm"
        >
          <Icon name="RefreshCw" size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-error" />
            <span className="text-sm font-body-medium text-error">Error</span>
          </div>
          <p className="text-sm text-error/80 mt-1">{error}</p>
        </div>
      )}

      {partsRequests.length === 0 ? (
        <div className="text-center py-8">
          <Icon name="Package" size={48} className="text-text-secondary mx-auto mb-3" />
          <p className="text-text-secondary">No parts requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {partsRequests.map(request => (
            <div key={request.id} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-sm font-heading-medium text-text-primary">
                      Job #{request.job}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-body-medium ${getStatusColor(request.status)}`}>
                      <Icon name={getStatusIcon(request.status)} size={12} className="mr-1 inline" />
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-1">
                    Requested by: {request.technician_name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Requested: {new Date(request.requested_at).toLocaleDateString()}
                  </p>
                </div>
                {request.approved_at && (
                  <div className="text-right">
                    <p className="text-xs text-text-secondary">Approved by</p>
                    <p className="text-sm font-body-medium text-text-primary">{request.approved_by_name}</p>
                    <p className="text-xs text-text-secondary">
                      {new Date(request.approved_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-background rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-body-medium text-text-primary">{request.part_name}</h5>
                    <p className="text-xs text-text-secondary">Part #: {request.part_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-body-medium text-text-primary">
                      Qty: {request.quantity_requested}
                    </p>
                  </div>
                </div>
                {request.reason && (
                  <div className="mt-2">
                    <p className="text-xs text-text-secondary">Reason:</p>
                    <p className="text-sm text-text-primary">{request.reason}</p>
                  </div>
                )}
              </div>

              {request.status === 'pending' && (
                <div className="flex space-x-2">
                  <Button
                    variant="success"
                    onClick={() => handleApproveRequest(request.id)}
                    disabled={processingId === request.id}
                    className="text-sm flex-1"
                  >
                    {processingId === request.id ? (
                      <Icon name="Loader" size={16} className="animate-spin mr-2" />
                    ) : (
                      <Icon name="Check" size={16} className="mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="error"
                    onClick={() => handleRejectRequest(request.id)}
                    disabled={processingId === request.id}
                    className="text-sm flex-1"
                  >
                    {processingId === request.id ? (
                      <Icon name="Loader" size={16} className="animate-spin mr-2" />
                    ) : (
                      <Icon name="X" size={16} className="mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartsRequestApproval;
