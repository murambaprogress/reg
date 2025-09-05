import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import JobCard from './components/JobCard';
import JobForm from './components/JobForm';
import JobDetails from './components/JobDetails';
import JobFilters from './components/JobFilters';
import JobStats from './components/JobStats';
import BulkActions from './components/BulkActions';
import { useJob, JobProvider } from './JobContext';

const JobManagementContent = () => {
  const {
    jobs,
    customers,
    technicians,
    loading,
    error,
    fetchJobs,
    createJob,
    updateJob,
    deleteJob,
    updateJobStatus,
    bulkUpdateJobStatus,
    bulkDeleteJobs,
    setError
  } = useJob();

  const [selectedJob, setSelectedJob] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // For mobile: 'list' or 'details'
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Apply filters when filter states change
  useEffect(() => {
    const filters = {};
    if (statusFilter) filters.status = statusFilter;
    if (priorityFilter) filters.priority = priorityFilter;
    if (technicianFilter) filters.technician = technicianFilter;
    if (searchTerm) filters.search = searchTerm;

    fetchJobs(filters);
  }, [statusFilter, priorityFilter, technicianFilter, searchTerm]);

  // Sort jobs (filtering is now handled by the backend)
  const sortedJobs = [...jobs].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt);
      case 'oldest':
        return new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt);
      case 'priority':
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'dueDate':
        return new Date(a.due_date || a.dueDate) - new Date(b.due_date || b.dueDate);
      case 'customer':
        return (a.customer_name || a.customerName || '').localeCompare(b.customer_name || b.customerName || '');
      default:
        return 0;
    }
  });

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setActiveTab('details');
  };

  const handleCreateJob = () => {
    setShowForm(true);
    setEditingJob(null);
    setSelectedJob(null);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowForm(true);
  };

  const handleSaveJob = async (formData) => {
    try {
      if (editingJob) {
        // Update existing job
        await updateJob(editingJob.id, formData);
      } else {
        // Create new job
        await createJob(formData);
      }
      
      setShowForm(false);
      setEditingJob(null);
    } catch (err) {
      console.error('Error saving job:', err);
      // Error is already handled in the context
    }
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      const updatedJob = await updateJobStatus(jobId, newStatus);
      
      // Update selected job if it's the one being updated
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(updatedJob);
      }
    } catch (err) {
      console.error('Error updating job status:', err);
      // Error is already handled in the context
    }
  };

  const handleAddNote = async (jobId, noteContent) => {
    try {
      // For now, we'll update the job with the note
      // In the future, you might want to create a separate notes API
      const updatedJob = await updateJobStatus(jobId, selectedJob.status, noteContent);
      
      // Update selected job if it's the one being updated
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(updatedJob);
      }
    } catch (err) {
      console.error('Error adding note:', err);
      // Error is already handled in the context
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    try {
      await bulkUpdateJobStatus(selectedJobs, newStatus);
      setSelectedJobs([]);
    } catch (err) {
      console.error('Error in bulk status update:', err);
      // Error is already handled in the context
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedJobs.length} job(s)?`)) {
      try {
        await bulkDeleteJobs(selectedJobs);
        setSelectedJobs([]);
        if (selectedJob && selectedJobs.includes(selectedJob.id)) {
          setSelectedJob(null);
        }
      } catch (err) {
        console.error('Error in bulk delete:', err);
        // Error is already handled in the context
      }
    }
  };

  const handleJobSelection = (jobId, isSelected) => {
    if (isSelected) {
      setSelectedJobs(prev => [...prev, jobId]);
    } else {
      setSelectedJobs(prev => prev.filter(id => id !== jobId));
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
    setTechnicianFilter('');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-heading-bold text-text-primary">Job Management</h1>
              <p className="text-text-secondary mt-1">Create, track, and manage service jobs</p>
            </div>
            <Button variant="primary" onClick={handleCreateJob}>
              <Icon name="Plus" size={20} className="mr-2" />
              Create Job
            </Button>
          </div>

          {/* Job Statistics */}
          <JobStats jobs={jobs} />

          {/* Mobile Tab Navigation */}
          <div className="lg:hidden mb-6">
            <div className="flex bg-surface rounded-lg border border-border p-1">
              <button
                onClick={() => setActiveTab('list')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-body-medium transition-colors ${
                  activeTab === 'list' ?'bg-primary text-primary-foreground' :'text-text-secondary hover:text-text-primary'
                }`}
              >
                Jobs List
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-body-medium transition-colors ${
                  activeTab === 'details' ?'bg-primary text-primary-foreground' :'text-text-secondary hover:text-text-primary'
                }`}
                disabled={!selectedJob}
              >
                Job Details
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel - Job List */}
            <div className={`lg:col-span-4 ${activeTab === 'details' ? 'hidden lg:block' : ''}`}>
              <div className="space-y-4">
                {/* Filters */}
                <JobFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  priorityFilter={priorityFilter}
                  onPriorityFilterChange={setPriorityFilter}
                  technicianFilter={technicianFilter}
                  onTechnicianFilterChange={setTechnicianFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onClearFilters={clearFilters}
                  technicians={technicians}
                />

                {/* Bulk Actions */}
                <BulkActions
                  selectedJobs={selectedJobs}
                  onBulkStatusUpdate={handleBulkStatusUpdate}
                  onBulkDelete={handleBulkDelete}
                  onClearSelection={() => setSelectedJobs([])}
                />

                {/* Loading State */}
                {loading && (
                  <div className="text-center py-8">
                    <Icon name="Loader" size={32} className="mx-auto mb-2 animate-spin text-accent" />
                    <p className="text-text-secondary">Loading jobs...</p>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Icon name="AlertCircle" size={16} className="text-error" />
                      <span className="text-error font-body-medium">Error loading jobs</span>
                    </div>
                    <p className="text-error/80 text-sm mt-1">{error}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setError(null);
                        fetchJobs();
                      }}
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Job Cards */}
                <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {!loading && sortedJobs.length > 0 ? (
                    sortedJobs.map(job => (
                      <div key={job.id} className="relative">
                        <input
                          type="checkbox"
                          checked={selectedJobs.includes(job.id)}
                          onChange={(e) => handleJobSelection(job.id, e.target.checked)}
                          className="absolute top-3 right-3 z-10 w-4 h-4 text-accent bg-surface border-border rounded focus:ring-accent focus:ring-2"
                        />
                        <JobCard
                          job={job}
                          onSelect={handleJobSelect}
                          isSelected={selectedJob?.id === job.id}
                          onStatusUpdate={handleStatusUpdate}
                        />
                      </div>
                    ))
                  ) : !loading && (
                    <div className="text-center py-12 text-text-secondary">
                      <Icon name="Search" size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-body-medium">No jobs found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Job Details/Form */}
            <div className={`lg:col-span-8 ${activeTab === 'list' ? 'hidden lg:block' : ''}`}>
              {showForm ? (
                <JobForm
                  job={editingJob}
                  onSave={handleSaveJob}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingJob(null);
                  }}
                  customers={customers}
                  technicians={technicians}
                  isEditing={!!editingJob}
                />
              ) : selectedJob ? (
                <JobDetails
                  job={selectedJob}
                  onEdit={handleEditJob}
                  onStatusUpdate={handleStatusUpdate}
                  onAddNote={handleAddNote}
                />
              ) : (
                <div className="bg-surface rounded-lg border border-border p-12 text-center">
                  <Icon name="Clipboard" size={64} className="mx-auto mb-4 text-text-secondary opacity-50" />
                  <h3 className="text-xl font-heading-medium text-text-primary mb-2">
                    Select a job to view details
                  </h3>
                  <p className="text-text-secondary mb-6">
                    Choose a job from the list to see detailed information and manage it
                  </p>
                  <Button variant="primary" onClick={handleCreateJob}>
                    <Icon name="Plus" size={20} className="mr-2" />
                    Create New Job
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const JobManagement = () => {
  return (
    <JobProvider>
      <JobManagementContent />
    </JobProvider>
  );
};

export default JobManagement;
