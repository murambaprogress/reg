import React, { createContext, useContext, useState, useEffect } from 'react';

const JobContext = createContext();

export const useJob = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJob must be used within a JobProvider');
  }
  return context;
};

export const JobProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8000/api';

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('access_token');
  };

  // Create headers with auth token
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Fetch all jobs
  const fetchJobs = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.technician) queryParams.append('technician', filters.technician);
      if (filters.customer) queryParams.append('customer', filters.customer);
      if (filters.search) queryParams.append('search', filters.search);

      const url = `${API_BASE_URL}/jobs/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
      }

      const data = await response.json();
      setJobs(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching jobs:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch job statistics
  const fetchJobStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/stats/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching job stats:', err);
      return null;
    }
  };

  // Fetch single job details
  const fetchJobDetails = async (jobId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job details: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching job details:', err);
      throw err;
    }
  };

  // Create new job
  const createJob = async (jobData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create job: ${response.statusText}`);
      }

      const newJob = await response.json();
      setJobs(prev => [newJob, ...prev]);
      return newJob;
    } catch (err) {
      setError(err.message);
      console.error('Error creating job:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update existing job
  const updateJob = async (jobId, jobData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update job: ${response.statusText}`);
      }

      const updatedJob = await response.json();
      setJobs(prev => prev.map(job => job.id === jobId ? updatedJob : job));
      return updatedJob;
    } catch (err) {
      setError(err.message);
      console.error('Error updating job:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete job
  const deleteJob = async (jobId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete job: ${response.statusText}`);
      }

      setJobs(prev => prev.filter(job => job.id !== jobId));
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting job:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update job status
  const updateJobStatus = async (jobId, status, notes = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/status/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update job status: ${response.statusText}`);
      }

      const updatedJob = await response.json();
      setJobs(prev => prev.map(job => job.id === jobId ? updatedJob : job));
      return updatedJob;
    } catch (err) {
      console.error('Error updating job status:', err);
      throw err;
    }
  };

  // Fetch available customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/customers/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }

      const data = await response.json();
      setCustomers(data);
      return data;
    } catch (err) {
      console.error('Error fetching customers:', err);
      return [];
    }
  };

  // Fetch available technicians
  const fetchTechnicians = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/technicians/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch technicians: ${response.statusText}`);
      }

      const data = await response.json();
      setTechnicians(data);
      return data;
    } catch (err) {
      console.error('Error fetching technicians:', err);
      return [];
    }
  };

  // Add job part
  const addJobPart = async (jobId, partData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/parts/add/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(partData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add job part: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error adding job part:', err);
      throw err;
    }
  };

  // Get job parts
  const fetchJobParts = async (jobId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/parts/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job parts: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Error fetching job parts:', err);
      return [];
    }
  };

  // Bulk operations
  const bulkUpdateJobStatus = async (jobIds, status) => {
    const promises = jobIds.map(jobId => updateJobStatus(jobId, status));
    try {
      await Promise.all(promises);
      return true;
    } catch (err) {
      console.error('Error in bulk status update:', err);
      throw err;
    }
  };

  const bulkDeleteJobs = async (jobIds) => {
    const promises = jobIds.map(jobId => deleteJob(jobId));
    try {
      await Promise.all(promises);
      return true;
    } catch (err) {
      console.error('Error in bulk delete:', err);
      throw err;
    }
  };

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchJobs(),
        fetchCustomers(),
        fetchTechnicians()
      ]);
    };

    initializeData();
  }, []);

  const value = {
    // State
    jobs,
    customers,
    technicians,
    loading,
    error,

    // Job operations
    fetchJobs,
    fetchJobDetails,
    fetchJobStats,
    createJob,
    updateJob,
    deleteJob,
    updateJobStatus,

    // Helper data
    fetchCustomers,
    fetchTechnicians,

    // Job parts
    addJobPart,
    fetchJobParts,

    // Bulk operations
    bulkUpdateJobStatus,
    bulkDeleteJobs,

    // Utility
    setError,
    setLoading
  };

  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  );
};

export default JobContext;
