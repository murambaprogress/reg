import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TechnicianSyncContext = createContext();

export const useTechnicianSync = () => {
  const context = useContext(TechnicianSyncContext);
  if (!context) {
    throw new Error('useTechnicianSync must be used within a TechnicianSyncProvider');
  }
  return context;
};

export const TechnicianSyncProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [partsRequests, setPartsRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncInterval, setSyncInterval] = useState(null);

  // Prefer explicit env var, fallback to '/api' so all requests stay under proxy
  let API_BASE = import.meta.env.VITE_API_BASE || '/api';
  // Normalize (remove trailing slash)
  if (API_BASE.endsWith('/')) API_BASE = API_BASE.slice(0, -1);

  // Helper to safely parse JSON and surface HTML / unexpected responses
  const safeParseJSON = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    // Attempt to read text (likely HTML error page / index.html)
    const text = await response.text();
    // Provide a concise preview for diagnostics
    const preview = text.slice(0, 120).replace(/\s+/g, ' ');
    throw new Error(`Non-JSON response (status ${response.status}). Preview: ${preview}`);
  };

  // Auto-sync every 10 seconds for faster job assignment detection
  useEffect(() => {
    const interval = setInterval(() => {
      syncData();
    }, 10000); // Reduced from 30 seconds to 10 seconds
    
    setSyncInterval(interval);
    
    // Initial sync
    syncData();
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Additional fast polling for job assignments (every 5 seconds)
  useEffect(() => {
    const fastPollInterval = setInterval(() => {
      // Only fetch jobs for assignment detection
      fetchJobs();
    }, 5000);
    
    return () => {
      if (fastPollInterval) clearInterval(fastPollInterval);
    };
  }, []);

  // Listen for admin replies so technician client can refresh immediately
  useEffect(() => {
    const handler = (e) => {
      try {
        console.log('TechnicianSyncContext received admin-message-sent:', e.detail);
        const newMsg = e.detail?.message;
        if (newMsg) {
          setMessages(prev => [newMsg, ...prev]);
        }
        // Refresh jobs/messages to reflect any changes
        fetchJobs();
        fetchMessages();
      } catch (err) {
        console.warn('Error handling admin-message-sent event:', err);
      }
    };

    window.addEventListener('admin-message-sent', handler);
    return () => window.removeEventListener('admin-message-sent', handler);
  }, []);

  const syncData = useCallback(async () => {
    try {
      await Promise.all([
        fetchJobs(),
        fetchPartsRequests(),
        fetchMessages()
      ]);
    } catch (error) {
      console.error('Sync error:', error);
    }
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/jobs/technician-dashboard/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Jobs fetch failed (${response.status}) ${text.slice(0,80)}`);
      }
      const data = await safeParseJSON(response);
      if (!Array.isArray(data)) {
        throw new Error('Jobs response not an array');
      }
      setJobs(data);
      if (activeJob) {
        const updatedActiveJob = data.find(job => job.id === activeJob.id);
        if (updatedActiveJob) setActiveJob(updatedActiveJob);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError(error.message || 'Failed to load jobs');
    }
  };

  const fetchPartsRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/jobs/parts-requests/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) return; // silent fail (not critical)
      const data = await safeParseJSON(response);
      if (Array.isArray(data)) setPartsRequests(data);
    } catch (error) {
      console.error('Error fetching parts requests:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/jobs/messages/recent/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) return;
      const data = await safeParseJSON(response);
      if (Array.isArray(data)) setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const updateJobStatus = async (jobId, status, notes = '') => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/jobs/${jobId}/technician-status-update/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          notes
        })
      });

      if (response.ok) {
        const result = await response.json();
        const updatedJob = result.job;
        
        // Update jobs list
        setJobs(prev => prev.map(job => 
          job.id === jobId ? updatedJob : job
        ));
        
        // Update active job if it's the same
        if (activeJob && activeJob.id === jobId) {
          setActiveJob(updatedJob);
        }
        
        // Trigger immediate sync to notify admin dashboard
        await syncData();
        
        return updatedJob;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update job status');
        throw new Error(errorData.message || 'Failed to update job status');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      setError(error.message || 'Network error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const requestParts = async (jobId, parts, notes = '') => {
    if (!jobId) throw new Error('jobId is required to request parts');
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const newRequests = [];
      const optimisticEntries = [];

      // Handle both array of parts and single part object
      const partsArray = Array.isArray(parts) ? parts : [parts];

      // Send individual requests for each part
      for (const part of partsArray) {
        const requestData = {
          part_number: part.partNumber,
          part_name: part.name,
          quantity_requested: part.quantity,
          reason: notes || `Required for job #${jobId}`
        };

        // Insert optimistic entry before server roundtrip
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        const optimistic = {
          id: tempId,
          job: jobId,
          technician: null,
          technician_name: null,
          part_number: requestData.part_number,
          part_name: requestData.part_name,
          quantity_requested: requestData.quantity_requested,
          reason: requestData.reason,
          status: 'pending',
          requested_at: new Date().toISOString(),
          approved_by: null,
          approved_at: null,
          _optimistic: true
        };
        optimisticEntries.push(optimistic);
        // Add to UI immediately
        setPartsRequests(prev => [optimistic, ...prev]);

        console.log('Requesting part:', requestData);
        const response = await fetch(`${API_BASE}/jobs/${jobId}/request-parts/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        if (response.ok) {
          // Prefer safe JSON parse for consistent object shape
          let newRequest;
          try {
            newRequest = await safeParseJSON(response);
          } catch (e) {
            // Fallback to plain json() if safeParseJSON threw (shouldn't happen)
            try { newRequest = await response.json(); } catch (_) { newRequest = null; }
          }
          if (newRequest) {
            newRequests.push(newRequest);
            // Replace optimistic entry with server truth
            setPartsRequests(prev => prev.map(r => r.id === tempId ? newRequest : r));
          } else {
            // If server returned empty body but status OK, remove optimistic flag
            setPartsRequests(prev => prev.map(r => r.id === tempId ? { ...r, _optimistic: false } : r));
          }
        } else {
          // Build a helpful error message: prefer JSON, otherwise text preview, otherwise status code
          let errorMessage = `Failed to request part: ${part.name} (status ${response.status})`;
          try {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const parsed = await response.json();
              if (parsed) {
                errorMessage = parsed.message || parsed.detail || JSON.stringify(parsed) || errorMessage;
              }
            } else {
              const text = await response.text();
              if (text && text.trim().length > 0) {
                errorMessage = text.trim().slice(0, 400);
              }
            }
          } catch (e) {
            console.warn('Error parsing error response body:', e);
          }
          console.error('Parts request failed:', errorMessage);
          // Remove optimistic entry on failure
          setPartsRequests(prev => prev.filter(r => r.id !== tempId));
          throw new Error(errorMessage);
        }
      }

  // Successful requests were already merged into the partsRequests via replacement above.
  // No need to append newRequests again (would cause duplicates).

      // Trigger sync to notify admin
      await syncData();

      return newRequests;
    } catch (error) {
      console.error('Error requesting parts:', error);
      setError(error.message || 'Network error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (jobId, message, recipientType = 'supervisor') => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      // Use the job-specific message endpoint that the backend expects
      const url = `${API_BASE}/jobs/${jobId}/send-message/`;
      console.log('Sending message to URL:', url);
      console.log('Request payload:', { recipient_id: null, message });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_id: null, // Let backend auto-pick supervisor/admin
          message
        })
      });

      if (response.ok) {
        const newMessage = await safeParseJSON(response);
        setMessages(prev => [newMessage, ...prev]);
        
        // Trigger sync to notify admin
        await syncData();
        
        // Dispatch custom event for real-time dashboard updates
        try {
          console.log('[sendMessage] dispatching technician-message-sent event', { jobId, message: newMessage });
          window.dispatchEvent(new CustomEvent('technician-message-sent', { 
            detail: { 
              message: newMessage, 
              jobId: jobId 
            } 
          }));
        } catch (e) {
          console.warn('Could not dispatch message event:', e);
        }
        
        return newMessage;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send message');
        throw new Error(errorData.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message || 'Network error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const startJob = async (jobIdOrJob) => {
    try {
      // Handle both job ID and job object for backward compatibility
      const jobId = typeof jobIdOrJob === 'object' ? jobIdOrJob.id : jobIdOrJob;
      const updatedJob = await updateJobStatus(jobId, 'in_progress', 'Job started by technician');
      setActiveJob(updatedJob);
      return updatedJob;
    } catch (error) {
      throw error;
    }
  };

  const pauseJob = async (jobId, elapsedTime) => {
    try {
      const updatedJob = await updateJobStatus(jobId, 'paused', `Job paused. Elapsed time: ${elapsedTime}s`);
      return updatedJob;
    } catch (error) {
      throw error;
    }
  };

  const resumeJob = async (jobId) => {
    try {
      const updatedJob = await updateJobStatus(jobId, 'in_progress', 'Job resumed by technician');
      return updatedJob;
    } catch (error) {
      throw error;
    }
  };

  const completeJob = async (jobId) => {
    try {
      const updatedJob = await updateJobStatus(jobId, 'completed', 'Job completed by technician');
      if (activeJob && activeJob.id === jobId) {
        setActiveJob(null);
      }
      return updatedJob;
    } catch (error) {
      throw error;
    }
  };

  const updateJobProgress = async (jobId, progressPercentage, description, photos = []) => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/jobs/${jobId}/progress/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          progress_percentage: progressPercentage,
          description,
          photos
        })
      });

      if (response.ok) {
        const progressUpdate = await response.json();
        
        // Update job with new progress
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, progress_percentage: progressPercentage }
            : job
        ));
        
        if (activeJob && activeJob.id === jobId) {
          setActiveJob(prev => ({ ...prev, progress_percentage: progressPercentage }));
        }
        
        // Trigger sync to notify admin
        await syncData();
        
        return progressUpdate;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update progress');
        throw new Error(errorData.message || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      setError(error.message || 'Network error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendStatusAlert = async (jobId, alertData) => {
    try {
      // Use sendMessage with jobId and the alert message
      await sendMessage(jobId, `${alertData.type.toUpperCase()}: ${alertData.message}`);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    // State
    jobs,
    activeJob,
    partsRequests,
    messages,
    loading,
    error,
    
    // Actions
    syncData,
    updateJobStatus,
    requestParts,
    reconcilePartsRequests: fetchPartsRequests,
    sendMessage,
    startJob,
    pauseJob,
    resumeJob,
    completeJob,
    updateJobProgress,
    sendStatusAlert,
    setActiveJob,
    setError
  };

  return (
    <TechnicianSyncContext.Provider value={value}>
      {children}
    </TechnicianSyncContext.Provider>
  );
};
