import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const JobAssignmentNotification = ({ jobs, onDismiss, onViewJob }) => {
  const [notifications, setNotifications] = useState([]);
  const [previousJobIds, setPreviousJobIds] = useState(new Set());
  const audioRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Create notification sound
  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio notification not supported');
    }
  };

  // Check for new job assignments
  useEffect(() => {
    if (!jobs || jobs.length === 0) return;

    const currentJobIds = new Set(jobs.map(job => job.id));
    const newJobs = jobs.filter(job => 
      !previousJobIds.has(job.id) && 
      (job.status === 'Assigned' || job.status === 'Pending')
    );

    if (newJobs.length > 0 && previousJobIds.size > 0) {
      // New jobs detected - create notifications
      const newNotifications = newJobs.map(job => ({
        id: `notification-${job.id}-${Date.now()}`,
        jobId: job.id,
        title: 'New Job Assignment',
        message: `Job #${job.id} has been assigned to you`,
        job: job,
        timestamp: new Date(),
        dismissed: false
      }));

      setNotifications(prev => [...newNotifications, ...prev.slice(0, 4)]); // Keep max 5 notifications
      setIsVisible(true);
      
      // Play notification sound
      playNotificationSound();
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        newJobs.forEach(job => {
          new Notification('New Job Assignment', {
            body: `Job #${job.id} - ${job.customer_name || 'Unknown Customer'}`,
            icon: '/favicon.ico',
            tag: `job-${job.id}`
          });
        });
      }
    }

    setPreviousJobIds(currentJobIds);
  }, [jobs, previousJobIds]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Auto-dismiss notifications after 10 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.dismissed));
        if (notifications.every(n => n.dismissed)) {
          setIsVisible(false);
        }
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const handleDismissNotification = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, dismissed: true } : n
      )
    );
    
    // Hide container if all notifications are dismissed
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => !n.dismissed));
      if (notifications.every(n => n.dismissed || n.id === notificationId)) {
        setIsVisible(false);
      }
    }, 300);
  };

  const handleViewJob = (job) => {
    if (onViewJob) {
      onViewJob(job);
    }
    // Dismiss the notification when job is viewed
    const notification = notifications.find(n => n.jobId === job.id);
    if (notification) {
      handleDismissNotification(notification.id);
    }
  };

  const handleDismissAll = () => {
    setNotifications([]);
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const activeNotifications = notifications.filter(n => !n.dismissed);

  if (!isVisible || activeNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {activeNotifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-accent text-white rounded-lg shadow-lg border border-accent/20 p-4 animate-slide-in-right"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="Bell" size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-body-semibold text-white mb-1">
                  {notification.title}
                </h4>
                <p className="text-xs text-white/90 mb-2">
                  {notification.message}
                </p>
                <div className="text-xs text-white/80 mb-3">
                  <div>Customer: {notification.job.customer_name || 'Unknown'}</div>
                  <div>Vehicle: {notification.job.vehicle_info || 'N/A'}</div>
                  <div>Priority: {notification.job.priority || 'Normal'}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={() => handleViewJob(notification.job)}
                  >
                    View Job
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-white/80 hover:text-white hover:bg-white/10"
                    onClick={() => handleDismissNotification(notification.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10 p-1"
              onClick={() => handleDismissNotification(notification.id)}
            >
              <Icon name="X" size={14} />
            </Button>
          </div>
        </div>
      ))}
      
      {activeNotifications.length > 1 && (
        <div className="text-center">
          <Button
            size="sm"
            variant="outline"
            className="text-xs bg-surface border-border text-text-secondary hover:bg-background"
            onClick={handleDismissAll}
          >
            Dismiss All ({activeNotifications.length})
          </Button>
        </div>
      )}
    </div>
  );
};

export default JobAssignmentNotification;
