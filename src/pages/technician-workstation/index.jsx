import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import JobCard from './components/JobCard';
import ActiveJobTimer from './components/ActiveJobTimer';
import PartsRequest from './components/PartsRequest';
import QuickActions from './components/QuickActions';
import JobDetailsModal from './components/TestModal';
import JobStatusAlert from './components/JobStatusAlert';
import JobStatusUpdateModal from './components/JobStatusUpdateModal';
import JobAssignmentNotification from './components/JobAssignmentNotification';
import { useTechnicianSync, TechnicianSyncProvider } from './TechnicianSyncContext';
import { useUser } from '../../components/UserContext';

const TechnicianWorkstation = React.memo(() => {
  const { user } = useUser();
  const {
    jobs: assignedJobs,
    activeJob,
    loading,
    error,
    messages,
    syncData,
    startJob,
    pauseJob,
    resumeJob,
    completeJob,
    updateJobStatus,
    updateJobProgress,
    requestParts,
    sendMessage,
    sendStatusAlert,
    setError
  } = useTechnicianSync();

  const [selectedJob, setSelectedJob] = useState(null);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [statusUpdateJob, setStatusUpdateJob] = useState(null);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);

  useEffect(() => {
    // Sync data is handled automatically by the TechnicianSyncContext
    // No need to manually fetch jobs here
  }, [user?.id, user?.role]);

  const handleStartJob = useCallback(async (job) => {
    try {
      await startJob(job);
    } catch (error) {
      console.error('Error starting job:', error);
    }
  }, [startJob]);

  const handlePauseJob = useCallback(async (jobId, elapsedTime) => {
    try {
      await pauseJob(jobId, elapsedTime);
    } catch (error) {
      console.error('Error pausing job:', error);
    }
  }, [pauseJob]);

  const handleResumeJob = useCallback(async (jobId) => {
    try {
      await resumeJob(jobId);
    } catch (error) {
      console.error('Error resuming job:', error);
    }
  }, [resumeJob]);

  const handleCompleteJob = useCallback(async (jobId) => {
    try {
      await completeJob(jobId);
    } catch (error) {
      console.error('Error completing job:', error);
    }
  }, [completeJob]);

  // Update progress here is actually a status update in our API: call updateJobStatus
  const handleUpdateProgress = useCallback(async (jobId, status, notes) => {
    try {
      await updateJobStatus(jobId, status, notes || `Status updated to ${status}`);
      // Show a short success toast using the global helper if available
      if (typeof window !== 'undefined' && window.__SHOW_TOAST) {
        try {
          window.__SHOW_TOAST('Status updated', 'success');
        } catch (e) {
          // ignore toast errors
        }
      }
    } catch (error) {
      console.error('Error updating progress/status:', error);
    }
  }, [updateJobStatus]);

  const handleOpenStatusUpdate = useCallback((job, quickStatus = null) => {
    if (quickStatus) {
      // Quick status update (e.g., Complete button)
      handleUpdateJobStatus(job.id, quickStatus, `Job marked as ${quickStatus.toLowerCase()}`);
    } else {
      // Open modal for detailed status update
      setStatusUpdateJob(job);
      setIsStatusUpdateOpen(true);
    }
  }, []);

  const handleUpdateJobStatus = useCallback(async (jobId, newStatus, notes = '') => {
    try {
      await updateJobStatus(jobId, newStatus, notes);
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  }, [updateJobStatus]);

  const handleViewDetails = (job) => {
    // Open job details modal
    setSelectedJob(job);
    setIsJobDetailsOpen(true);
  };

  const handleRequestParts = useCallback(async (jobId, parts, notes) => {
    try {
      await requestParts(jobId, parts, notes);
    } catch (error) {
      console.error('Error requesting parts:', error);
    }
  }, [requestParts]);

  const handleContactCustomer = useCallback((phone, type = 'call') => {
    // This would typically integrate with phone/SMS system
    console.log(`${type === 'call' ? 'Calling' : 'Texting'} customer at ${phone}`);
  }, []);

  const handleViewHistory = useCallback((vehicleId) => {
    // This would typically fetch and display vehicle service history
    console.log('Viewing service history for vehicle:', vehicleId);
  }, []);

  const handleMessageSupervisor = useCallback(async (jobId, message) => {
    try {
      // Send message using the TechnicianSyncContext function
      await sendMessage(jobId, message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [sendMessage]);

  const handleUpdateJob = useCallback((jobId, updates) => {
    // This would typically update the job via API
    console.log('Updating job:', jobId, updates);
  }, []);

  const handleSendAlert = useCallback(async (jobId, alertData) => {
    try {
      await sendStatusAlert(jobId, alertData);
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  }, [sendStatusAlert]);

  // Memoize filtered jobs to prevent unnecessary re-calculations
  const { pendingJobs, inProgressJobs, readyToCollectJobs, completedJobs } = useMemo(() => ({
    pendingJobs: assignedJobs.filter(job => job.status === 'pending' || job.status === 'Pending' || job.status === 'Assigned'),
    inProgressJobs: assignedJobs.filter(job => job.status === 'in_progress' || job.status === 'In Progress' || job.status === 'on_hold' || job.status === 'On Hold' || job.status === 'Paused'),
    readyToCollectJobs: assignedJobs.filter(job => job.status === 'ready_to_collect' || job.status === 'Ready to Collect'),
    completedJobs: assignedJobs.filter(job => job.status === 'completed' || job.status === 'Completed')
  }), [assignedJobs]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Icon name="Loader" size={32} className="mx-auto mb-4 animate-spin text-accent" />
                <p className="text-text-secondary">Loading your assigned jobs...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-error/10 border border-error/20 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-2">
                <Icon name="AlertCircle" size={20} className="text-error" />
                <h3 className="text-lg font-heading-semibold text-error">Error Loading Jobs</h3>
              </div>
              <p className="text-error/80 mb-4">{error}</p>
              <Button onClick={() => {
                setError(null);
                syncData();
              }}>
                <Icon name="RefreshCw" size={16} className="mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show empty state if no jobs assigned
  if (assignedJobs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumb />
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-heading-bold text-text-primary">Technician Workstation</h1>
                <p className="text-text-secondary mt-1">Manage your assigned jobs and track progress</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                  <span className="text-sm text-text-secondary">Online</span>
                </div>
                <Button 
                  variant="outline" 
                  className="text-sm"
                  onClick={syncData}
                  disabled={loading}
                >
                  <Icon name="RefreshCw" size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="text-center py-12">
              <Icon name="Briefcase" size={64} className="mx-auto mb-4 opacity-50 text-text-secondary" />
              <h3 className="text-xl font-heading-semibold text-text-primary mb-2">No Jobs Assigned</h3>
              <p className="text-text-secondary mb-4">
                You don't have any jobs assigned to you at the moment.
              </p>
              <p className="text-sm text-text-secondary">
                Check back later or contact your supervisor if you expect to have jobs assigned.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb />
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-heading-bold text-text-primary">Technician Workstation</h1>
              <p className="text-text-secondary mt-1">Manage your assigned jobs and track progress</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="text-sm text-text-secondary">Online</span>
              </div>
                <Button 
                  variant="outline" 
                  className="text-sm"
                  onClick={syncData}
                  disabled={loading}
                >
                  <Icon name="RefreshCw" size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
            </div>
          </div>

          {/* Messages/Notifications */}
          {messages.length > 0 && (
            <div className="mb-6">
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon name="Bell" size={16} className="text-accent" />
                  <span className="text-sm font-body-medium text-accent">Recent Messages</span>
                </div>
                <div className="space-y-1">
                  {messages.slice(-3).map(message => (
                    <p key={message.id} className="text-sm text-text-secondary">
                      {message.message} - {new Date(message.sent_at).toLocaleTimeString()}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Job Timer */}
              {activeJob && (
                <ActiveJobTimer
                  job={activeJob}
                  onPause={handlePauseJob}
                  onResume={handleResumeJob}
                  onComplete={handleCompleteJob}
                  onUpdateProgress={handleUpdateProgress}
                />
              )}

              {/* Job Sections */}
              <div className="space-y-6">
                {/* Pending Jobs */}
                {pendingJobs.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Icon name="Clock" size={20} className="text-warning" />
                      <h2 className="text-lg font-heading-semibold text-text-primary">
                        Pending Jobs ({pendingJobs.length})
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {pendingJobs.map(job => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onStartJob={handleStartJob}
                          onViewDetails={handleViewDetails}
                          onUpdateStatus={handleOpenStatusUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* In Progress Jobs */}
                {inProgressJobs.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Icon name="Wrench" size={20} className="text-accent" />
                      <h2 className="text-lg font-heading-semibold text-text-primary">
                        In Progress ({inProgressJobs.length})
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {inProgressJobs.map(job => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onStartJob={handleStartJob}
                          onViewDetails={handleViewDetails}
                          onUpdateStatus={handleOpenStatusUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Ready to Collect Jobs */}
                {readyToCollectJobs.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Icon name="Car" size={20} className="text-info" />
                      <h2 className="text-lg font-heading-semibold text-text-primary">
                        Ready to Collect ({readyToCollectJobs.length})
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {readyToCollectJobs.map(job => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onStartJob={handleStartJob}
                          onViewDetails={handleViewDetails}
                          onUpdateStatus={handleOpenStatusUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Jobs */}
                {completedJobs.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Icon name="CheckCircle" size={20} className="text-success" />
                      <h2 className="text-lg font-heading-semibold text-text-primary">
                        Completed Today ({completedJobs.length})
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {completedJobs.map(job => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onStartJob={handleStartJob}
                          onViewDetails={handleViewDetails}
                          onUpdateStatus={handleOpenStatusUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Parts Request */}
              <PartsRequest
                jobId={activeJob?.id}
                onRequestParts={handleRequestParts}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <JobStatusAlert
                job={activeJob}
                onSendAlert={handleSendAlert}
              />
              
              <QuickActions
                currentJob={activeJob}
                jobs={assignedJobs}
                onContactCustomer={handleContactCustomer}
                onViewHistory={handleViewHistory}
                onMessageSupervisor={handleMessageSupervisor}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={isJobDetailsOpen}
        onClose={() => setIsJobDetailsOpen(false)}
        onUpdateJob={handleUpdateJob}
      />

      {/* Job Status Update Modal */}
      <JobStatusUpdateModal
        job={statusUpdateJob}
        isOpen={isStatusUpdateOpen}
        onClose={() => {
          setIsStatusUpdateOpen(false);
          setStatusUpdateJob(null);
        }}
        onUpdateStatus={handleUpdateJobStatus}
      />

      {/* Job Assignment Notifications */}
      <JobAssignmentNotification
        jobs={assignedJobs}
        onViewJob={handleViewDetails}
        onDismiss={() => {}}
      />
    </div>
  );
});

TechnicianWorkstation.displayName = 'TechnicianWorkstation';

// Wrapper component with provider
const TechnicianWorkstationWithProvider = () => {
  return (
    <TechnicianSyncProvider>
      <TechnicianWorkstation />
    </TechnicianSyncProvider>
  );
};

export default TechnicianWorkstationWithProvider;
