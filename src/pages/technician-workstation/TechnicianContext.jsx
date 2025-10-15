import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBaseUrl } from '../../utils/config';

const TechnicianContext = createContext();

export const useTechnician = () => {
  const context = useContext(TechnicianContext);
  if (!context) {
    throw new Error('useTechnician must be used within a TechnicianProvider');
  }
  return context;
};

export const TechnicianProvider = ({ children }) => {
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Use the config helper to get the PythonAnywhere API base URL in production
  const API_BASE_URL = getBaseUrl();

  // Safe JSON parser to surface HTML / unexpected responses clearly
  const safeParseJSON = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch (e) {
        throw new Error(`Invalid JSON body (status ${response.status})`);
      }
    }
    const text = await response.text();
    const preview = text.slice(0, 160).replace(/\s+/g, ' ');
    throw new Error(`Non-JSON response (status ${response.status}). Preview: ${preview}`);
  };

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Create headers with auth token
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Add notification helper
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Fetch technician's assigned jobs
  const fetchTechnicianJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/technician-dashboard/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        // Try to capture any HTML error message
        let errorDetail = '';
        try {
          const text = await response.text();
          errorDetail = text.slice(0, 120).replace(/\s+/g, ' ');
        } catch { /* ignore */ }
        throw new Error(`Failed to fetch jobs (${response.status}): ${response.statusText} ${errorDetail}`.trim());
      }

      const data = await safeParseJSON(response);
      
      // Transform backend data to match frontend expectations
      const transformedJobs = data.map(job => ({
        id: job.id,
        jobNumber: `JOB-${job.id}`,
        customerName: job.customer_name || job.customer?.name || 'Unknown Customer',
        customerPhone: job.customer?.phone || '',
        customerEmail: job.customer?.email || '',
        vehicleInfo: `${job.vehicle_year || ''} ${job.vehicle_model || ''}`.trim() || 'Vehicle Info Not Available',
        vehicleYear: job.vehicle_year?.toString() || '',
        vehicleVin: job.vehicle_vin || '',
        licensePlate: job.vehicle_plate || '',
        mileage: job.mileage || '',
        vehicleImage: job.vehicle_photos?.[0] || null,
        serviceDescription: job.service_description || job.description || '',
        services: job.services || [],
        status: transformStatus(job.status),
        priority: job.priority || 'Medium',
        estimatedTime: job.estimated_hours ? `${job.estimated_hours} hours` : '',
        createdDate: job.created_at ? new Date(job.created_at).toLocaleDateString() : '',
        notes: job.notes || '',
        elapsedTime: 0, // This would need to be calculated from progress updates
        dueDate: job.due_date,
        estimatedCost: job.estimated_cost,
        actualCost: job.actual_cost,
        startedAt: job.started_at,
        completedAt: job.completed_at,
  progressUpdates: job.progress_updates || [],
  partsUsed: job.parts || job.parts_used || [], // unified alias
  partsRequests: job.parts_requests || [],
        messages: job.messages || []
      }));

      setAssignedJobs(transformedJobs);
      
      // Set active job if there's one in progress
      const inProgressJob = transformedJobs.find(job => job.status === 'In Progress');
      if (inProgressJob) {
        setActiveJob(inProgressJob);
      }

      return transformedJobs;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching technician jobs:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Transform backend status to frontend status
  const transformStatus = (backendStatus) => {
    const statusMap = {
      'pending': 'Assigned',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'on_hold': 'Paused'
    };
    return statusMap[backendStatus] || backendStatus;
  };

  // Transform frontend status to backend status
  const transformStatusToBackend = (frontendStatus) => {
    const statusMap = {
      'Assigned': 'pending',
      'In Progress': 'in_progress',
      'Completed': 'completed',
      'Cancelled': 'cancelled',
      'Paused': 'on_hold'
    };
    return statusMap[frontendStatus] || frontendStatus.toLowerCase();
  };

  // Update job status
  const updateJobStatus = async (jobId, newStatus, notes = '') => {
    try {
      const backendStatus = transformStatusToBackend(newStatus);
      
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/status/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          status: backendStatus, 
          notes 
        }),
      });

      if (!response.ok) {
        try {
          const errorData = await safeParseJSON(response);
          throw new Error(errorData.message || `Failed to update job status: ${response.statusText}`);
        } catch (e) {
          throw new Error(e.message || `Failed to update job status: ${response.statusText}`);
        }
      }

      const updatedJob = await safeParseJSON(response);
      
      // Transform the updated job
      const transformedJob = {
        ...assignedJobs.find(j => j.id === jobId),
        status: transformStatus(updatedJob.status),
        notes: updatedJob.notes,
        startedAt: updatedJob.started_at,
        completedAt: updatedJob.completed_at
      };

      // Update jobs list
      setAssignedJobs(prev => prev.map(job => 
        job.id === jobId ? transformedJob : job
      ));

      // Update active job if it's the one being updated
      if (activeJob && activeJob.id === jobId) {
        setActiveJob(transformedJob);
      }

      addNotification(`Job ${jobId} status updated to ${newStatus}`, 'success');
      return transformedJob;
    } catch (err) {
      setError(err.message);
      addNotification(`Failed to update job status: ${err.message}`, 'error');
      throw err;
    }
  };

  // Start a job
  const startJob = async (job) => {
    try {
      const updatedJob = await updateJobStatus(job.id, 'In Progress', 'Job started by technician');
      setActiveJob(updatedJob);
      addNotification(`Started job ${job.jobNumber}`, 'success');
      return updatedJob;
    } catch (err) {
      console.error('Error starting job:', err);
      throw err;
    }
  };

  // Pause a job
  const pauseJob = async (jobId, elapsedTime) => {
    try {
      const updatedJob = await updateJobStatus(jobId, 'Paused', `Job paused. Elapsed time: ${elapsedTime} seconds`);
      if (activeJob && activeJob.id === jobId) {
        setActiveJob({ ...updatedJob, elapsedTime });
      }
      addNotification(`Paused job ${jobId}`, 'info');
      return updatedJob;
    } catch (err) {
      console.error('Error pausing job:', err);
      throw err;
    }
  };

  // Resume a job
  const resumeJob = async (jobId) => {
    try {
      const updatedJob = await updateJobStatus(jobId, 'In Progress', 'Job resumed by technician');
      if (activeJob && activeJob.id === jobId) {
        setActiveJob(updatedJob);
      }
      addNotification(`Resumed job ${jobId}`, 'success');
      return updatedJob;
    } catch (err) {
      console.error('Error resuming job:', err);
      throw err;
    }
  };

  // Complete a job
  const completeJob = async (jobId) => {
    try {
      const updatedJob = await updateJobStatus(jobId, 'Completed', 'Job completed by technician');
      setActiveJob(null);
      addNotification(`Completed job ${jobId}`, 'success');
      return updatedJob;
    } catch (err) {
      console.error('Error completing job:', err);
      throw err;
    }
  };

  // Update job progress
  const updateJobProgress = async (jobId, progressData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/progress/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        try {
          const errorData = await safeParseJSON(response);
          throw new Error(errorData.message || `Failed to update progress: ${response.statusText}`);
        } catch (e) {
          throw new Error(e.message || `Failed to update progress: ${response.statusText}`);
        }
      }

      const progressUpdate = await safeParseJSON(response);
      addNotification(`Progress updated for job ${jobId}`, 'success');
      return progressUpdate;
    } catch (err) {
      setError(err.message);
      addNotification(`Failed to update progress: ${err.message}`, 'error');
      throw err;
    }
  };

  // Request parts for a job
  const requestParts = async (jobId, selectedParts, notes = '') => {
    try {
      // If selectedParts is an array of parts (from PartsRequest component), 
      // we need to create separate requests for each part
      if (Array.isArray(selectedParts)) {
        const results = [];
        
        for (const part of selectedParts) {
          const partRequestData = {
            part_number: part.partNumber,
            part_name: part.name,
            quantity_requested: part.quantity,
            reason: notes || `Parts needed for job ${jobId}: ${part.name} (${part.quantity} units)`
          };
          
          const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/request-parts/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(partRequestData),
          });

          if (!response.ok) {
            try {
              const errorData = await safeParseJSON(response);
              throw new Error(errorData.message || `Failed to request part ${part.name}: ${response.statusText}`);
            } catch (e) {
              throw new Error(e.message || `Failed to request part ${part.name}: ${response.statusText}`);
            }
          }

          const partsRequest = await safeParseJSON(response);
          results.push(partsRequest);
        }
        
        addNotification(`${selectedParts.length} parts requested for job ${jobId}`, 'success');
        return results;
      } else {
        // Handle single part request (legacy format)
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/request-parts/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(selectedParts),
        });

        if (!response.ok) {
          try {
            const errorData = await safeParseJSON(response);
            throw new Error(errorData.message || `Failed to request parts: ${response.statusText}`);
          } catch (e) {
            throw new Error(e.message || `Failed to request parts: ${response.statusText}`);
          }
        }

        const partsRequest = await safeParseJSON(response);
        addNotification(`Parts requested for job ${jobId}`, 'success');
        return partsRequest;
      }
    } catch (err) {
      setError(err.message);
      addNotification(`Failed to request parts: ${err.message}`, 'error');
      throw err;
    }
  };

  // Send message about a job
  const sendMessage = async (jobId, recipientId, message) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/send-message/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          // allow backend auto-pick if null/undefined
          recipient_id: recipientId || undefined,
          message
        }),
      });

      if (!response.ok) {
        try {
          const errorData = await safeParseJSON(response);
          throw new Error(errorData.message || `Failed to send message: ${response.statusText}`);
        } catch (e) {
          throw new Error(e.message || `Failed to send message: ${response.statusText}`);
        }
      }

      const sentMessage = await safeParseJSON(response);
      addNotification(`Message sent about job ${jobId}`, 'success');
      // Broadcast globally so dashboards can refresh immediately
      try {
        window.dispatchEvent(new CustomEvent('technician-message-sent', { detail: sentMessage }));
      } catch (_) { /* noop for SSR */ }
      return sentMessage;
    } catch (err) {
      setError(err.message);
      addNotification(`Failed to send message: ${err.message}`, 'error');
      throw err;
    }
  };

  // Send alert to admin about job status
  const sendAlert = async (jobId, alertData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/send-alert/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          alert_type: alertData.type,
          message: alertData.message,
          job_number: alertData.jobNumber,
          customer_name: alertData.customerName,
          vehicle_info: alertData.vehicleInfo
        }),
      });

      if (!response.ok) {
        try {
          const errorData = await safeParseJSON(response);
          throw new Error(errorData.message || `Failed to send alert: ${response.statusText}`);
        } catch (e) {
          throw new Error(e.message || `Failed to send alert: ${response.statusText}`);
        }
      }

      const sentAlert = await safeParseJSON(response);
      addNotification(`Alert sent to admin about job ${jobId}`, 'success');
      return sentAlert;
    } catch (err) {
      setError(err.message);
      addNotification(`Failed to send alert: ${err.message}`, 'error');
      throw err;
    }
  };

  // Get messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/messages/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        let detail = '';
        try {
          const text = await response.text();
          detail = text.slice(0,100).replace(/\s+/g,' ');
        } catch { /* ignore */ }
        throw new Error(`Failed to fetch messages (${response.status}): ${response.statusText} ${detail}`.trim());
      }

      return await safeParseJSON(response);
    } catch (err) {
      console.error('Error fetching messages:', err);
      return [];
    }
  };

  // Initialize data on mount and set up periodic refresh
  useEffect(() => {
    fetchTechnicianJobs();
    
    // Set up periodic refresh every 30 seconds instead of frequent polling
    const refreshInterval = setInterval(() => {
      fetchTechnicianJobs();
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const value = {
    // State
    assignedJobs,
    activeJob,
    loading,
    error,
    notifications,

    // Job operations
    fetchTechnicianJobs,
    startJob,
    pauseJob,
    resumeJob,
    completeJob,
    updateJobStatus,
    updateJobProgress,

    // Communication
    requestParts,
    sendMessage,
    sendAlert,
    fetchMessages,

    // Utility
    setError,
    setActiveJob,
    addNotification
  };

  return (
    <TechnicianContext.Provider value={value}>
      {children}
    </TechnicianContext.Provider>
  );
};

export default TechnicianContext;
