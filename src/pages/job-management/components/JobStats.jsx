import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { useJob } from '../JobContext';

const JobStats = ({ jobs }) => {
  const { fetchJobStats } = useJob();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const statsData = await fetchJobStats();
        if (statsData) {
          setStats(statsData);
        }
      } catch (err) {
        console.error('Error loading job stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [jobs]); // Reload stats when jobs change

  // Fallback to calculating from jobs array if API stats not available
  const calculateLocalStats = () => {
    const totalJobs = jobs.length;
    const pendingJobs = jobs.filter(job => job.status?.toLowerCase() === 'pending').length;
    const inProgressJobs = jobs.filter(job => job.status?.toLowerCase() === 'in_progress' || job.status === 'In Progress').length;
    const completedJobs = jobs.filter(job => job.status?.toLowerCase() === 'completed').length;
    const highPriorityJobs = jobs.filter(job => job.priority === 'High').length;

    return {
      total_jobs: totalJobs,
      status_breakdown: {
        pending: pendingJobs,
        in_progress: inProgressJobs,
        completed: completedJobs
      },
      priority_breakdown: {
        High: highPriorityJobs
      }
    };
  };

  const displayStats = stats || calculateLocalStats();

  const statsConfig = [
    {
      label: 'Total Jobs',
      value: displayStats.total_jobs || 0,
      icon: 'Clipboard',
      color: 'text-text-primary',
      bgColor: 'bg-background'
    },
    {
      label: 'Pending',
      value: displayStats.status_breakdown?.pending || 0,
      icon: 'Clock',
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      label: 'In Progress',
      value: displayStats.status_breakdown?.in_progress || 0,
      icon: 'Wrench',
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      label: 'Completed',
      value: displayStats.status_breakdown?.completed || 0,
      icon: 'CheckCircle',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'High Priority',
      value: displayStats.priority_breakdown?.High || 0,
      icon: 'AlertTriangle',
      color: 'text-error',
      bgColor: 'bg-error/10'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-background rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-surface">
                <div className="w-5 h-5 bg-text-secondary/20 rounded"></div>
              </div>
              <div>
                <div className="w-8 h-6 bg-text-secondary/20 rounded mb-1"></div>
                <div className="w-16 h-4 bg-text-secondary/20 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {statsConfig.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-lg p-4`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-surface`}>
              <Icon name={stat.icon} size={20} className={stat.color} />
            </div>
            <div>
              <p className="text-2xl font-heading-semibold text-text-primary">{stat.value}</p>
              <p className="text-sm text-text-secondary">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobStats;
