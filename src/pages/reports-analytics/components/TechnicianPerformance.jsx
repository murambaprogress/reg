import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';


const TechnicianPerformance = () => {
  // Technician data should be provided from backend or context
  const technicianData = [];
  const chartData = [];

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-success';
    if (efficiency >= 80) return 'text-warning';
    return 'text-error';
  };

  const getEfficiencyBg = (efficiency) => {
    if (efficiency >= 90) return 'bg-success/10';
    if (efficiency >= 80) return 'bg-warning/10';
    return 'bg-error/10';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border rounded-lg p-3 shadow-modal">
          <p className="text-sm font-body-medium text-text-primary mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-text-secondary">{entry.name}:</span>
              <span className="font-body-medium text-text-primary">
                {entry.name === 'Efficiency' ? `${entry.value}%` : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface rounded-lg p-6 shadow-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-heading-medium text-text-primary">Technician Performance</h3>
          <p className="text-sm text-text-secondary mt-1">Individual productivity and efficiency metrics</p>
        </div>
        <Button variant="outline" iconName="Download" iconSize={16}>
          Export Report
        </Button>
      </div>

      {/* Performance Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="name" 
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--color-text-secondary)"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="completed" fill="var(--color-accent)" name="Jobs Completed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="efficiency" fill="var(--color-success)" name="Efficiency" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Technician Details */}
      <div className="space-y-4">
        {technicianData.map((technician) => (
          <div key={technician.id} className="flex items-center justify-between p-4 bg-background rounded-lg">
            <div className="flex items-center space-x-4">
              <Image 
                src={technician.avatar} 
                alt={technician.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h4 className="text-sm font-body-medium text-text-primary">{technician.name}</h4>
                <p className="text-xs text-text-secondary">{technician.specialization}</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-lg font-heading-medium text-text-primary">{technician.jobsCompleted}</div>
                <div className="text-xs text-text-secondary">Jobs</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-heading-medium text-text-primary">{technician.avgCompletionTime}h</div>
                <div className="text-xs text-text-secondary">Avg Time</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center space-x-1">
                  <Icon name="Star" size={14} className="text-warning fill-current" />
                  <span className="text-lg font-heading-medium text-text-primary">{technician.customerRating}</span>
                </div>
                <div className="text-xs text-text-secondary">Rating</div>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-body-medium ${getEfficiencyBg(technician.efficiency)} ${getEfficiencyColor(technician.efficiency)}`}>
                  {technician.efficiency}%
                </div>
                <div className="text-xs text-text-secondary mt-1">Efficiency</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechnicianPerformance;