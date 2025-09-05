import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ActiveJobTimer = ({ job, onPause, onResume, onComplete, onUpdateProgress }) => {
  const [elapsedTime, setElapsedTime] = useState(job.elapsedTime || 0);
  const [isRunning, setIsRunning] = useState(job.status === 'In Progress');
  const [notes, setNotes] = useState('');
  const [progressStatus, setProgressStatus] = useState('In Progress');

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsRunning(false);
    onPause(job.id, elapsedTime);
  };

  const handleResume = () => {
    setIsRunning(true);
    onResume(job.id);
  };

  const handleUpdateProgress = () => {
    onUpdateProgress(job.id, progressStatus, notes);
    setNotes('');
  };

  const progressOptions = [
    'In Progress',
    'Waiting for Parts',
    'Customer Approval Required',
    'Quality Check',
    'Ready for Pickup',
    'Completed'
  ];

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-heading-semibold text-text-primary mb-1">Active Job</h3>
          <p className="text-sm text-text-secondary">{job.jobNumber} - {job.customerName}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
          <span className="text-sm font-body-medium text-success">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-center mb-4">
            <div className="text-3xl font-data-normal text-text-primary mb-2">
              {formatTime(elapsedTime)}
            </div>
            <p className="text-sm text-text-secondary">Elapsed Time</p>
          </div>

          <div className="flex justify-center space-x-3">
            {isRunning ? (
              <Button
                variant="warning"
                onClick={handlePause}
                className="text-sm"
              >
                <Icon name="Pause" size={16} className="mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                variant="success"
                onClick={handleResume}
                className="text-sm"
              >
                <Icon name="Play" size={16} className="mr-2" />
                Resume
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => onComplete(job.id)}
              className="text-sm"
            >
              <Icon name="CheckCircle" size={16} className="mr-2" />
              Complete
            </Button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-heading-medium text-text-primary mb-3">Update Progress</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Status
              </label>
              <select
                value={progressStatus}
                onChange={(e) => setProgressStatus(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {progressOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-body-medium text-text-primary mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add progress notes..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
            <Button
              variant="primary"
              onClick={handleUpdateProgress}
              fullWidth
              className="text-sm"
            >
              <Icon name="Save" size={16} className="mr-2" />
              Update Progress
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveJobTimer;