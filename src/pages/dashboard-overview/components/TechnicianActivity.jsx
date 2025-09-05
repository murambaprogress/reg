import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const TechnicianActivity = () => {
  const technicians = [
    {
      id: 1,
      name: "Mike Johnson",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      status: "active",
      currentJob: "JOB-001",
      vehicle: "Toyota Camry",
      progress: 65,
      timeSpent: "2h 15m",
      efficiency: 92,
      completedToday: 3
    },
    {
      id: 2,
      name: "David Brown",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      status: "break",
      currentJob: null,
      vehicle: null,
      progress: 0,
      timeSpent: "0h 0m",
      efficiency: 88,
      completedToday: 2
    },
    {
      id: 3,
      name: "Alex Martinez",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      status: "active",
      currentJob: "JOB-003",
      vehicle: "Ford F-150",
      progress: 100,
      timeSpent: "3h 45m",
      efficiency: 95,
      completedToday: 4
    },
    {
      id: 4,
      name: "Chris Anderson",
      avatar: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face",
      status: "active",
      currentJob: "JOB-004",
      vehicle: "BMW X5",
      progress: 30,
      timeSpent: "1h 20m",
      efficiency: 90,
      completedToday: 1
    }
  ];

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
      </div>
    </div>
  );
};

export default TechnicianActivity;