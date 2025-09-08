import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const TechnicianActivity = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE || 'https://progress.pythonanywhere.com/api';

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/dashboard/technician-activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data);
      }
    } catch (error) {
      console.error('Error fetching technician activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-success text-success-foreground',
      'break': 'bg-warning text-warning-foreground',
      'offline': 'bg-secondary text-secondary-foreground'
    };
    return colors[status] || 'bg-secondary text-secondary-foreground';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'active': 'Zap',
      'break': 'Coffee',
      'offline': 'UserX'
    };
    return icons[status] || 'User';
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-success';
    if (efficiency >= 80) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="bg-surface rounded-lg shadow-card border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading-semibold text-text-primary">Technician Activity</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full pulse-animation"></div>
            <span className="text-sm text-text-secondary">Live</span>
          </div>
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Icon name="Loader" size={32} className="animate-spin text-accent" />
            <span className="ml-2 text-text-secondary">Loading technicians...</span>
          </div>
        ) : technicians.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50 text-text-secondary" />
            <p className="text-lg font-body-medium text-text-secondary">No technicians available</p>
            <p className="text-sm text-text-secondary">Technician activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {technicians.map((tech) => (
            <div key={tech.id} className="border border-border rounded-lg p-4 micro-interaction hover:shadow-md">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <Image 
                      src={tech.avatar} 
                      alt={tech.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${getStatusColor(tech.status)}`}>
                    <Icon name={getStatusIcon(tech.status)} size={8} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-heading-medium text-text-primary">{tech.name}</h3>
                    <span className={`text-xs font-body-medium ${getEfficiencyColor(tech.efficiency)}`}>
                      {tech.efficiency}% Efficiency
                    </span>
                  </div>
                  
                  {tech.currentJob ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Working on: {tech.currentJob}</span>
                        <span className="text-xs font-data-normal text-text-primary">{tech.timeSpent}</span>
                      </div>
                      <p className="text-sm text-text-primary">{tech.vehicle}</p>
                      
                      {tech.progress < 100 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-text-secondary">Progress</span>
                            <span className="text-xs font-data-normal text-text-primary">{tech.progress}%</span>
                          </div>
                          <div className="w-full bg-background rounded-full h-2">
                            <div 
                              className="bg-accent h-2 rounded-full state-transition" 
                              style={{ width: `${tech.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {tech.progress === 100 && (
                        <div className="flex items-center space-x-2 text-success">
                          <Icon name="CheckCircle" size={16} />
                          <span className="text-sm font-body-medium">Job Completed</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-warning">
                      <Icon name="Coffee" size={16} />
                      <span className="text-sm">On Break</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                    <div className="flex items-center space-x-1">
                      <Icon name="CheckCircle" size={14} className="text-success" />
                      <span className="text-xs text-text-secondary">Completed today: {tech.completedToday}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="micro-interaction hover:text-text-primary text-text-secondary">
                        <Icon name="MessageCircle" size={14} />
                      </button>
                      <button className="micro-interaction hover:text-text-primary text-text-secondary">
                        <Icon name="Phone" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianActivity;
