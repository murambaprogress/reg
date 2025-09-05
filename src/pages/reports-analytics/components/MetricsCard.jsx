import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricsCard = ({ title, value, change, changeType, icon, target, unit = '' }) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-error';
    return 'text-text-secondary';
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return 'TrendingUp';
    if (changeType === 'negative') return 'TrendingDown';
    return 'Minus';
  };

  const getTargetStatus = () => {
    if (!target) return null;
    const percentage = (value / target) * 100;
    if (percentage >= 100) return { color: 'text-success', status: 'Exceeding' };
    if (percentage >= 80) return { color: 'text-warning', status: 'Meeting' };
    return { color: 'text-error', status: 'Below' };
  };

  const targetStatus = getTargetStatus();

  return (
    <div className="bg-surface rounded-lg p-6 shadow-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name={icon} size={20} className="text-accent" />
          </div>
          <h3 className="text-sm font-body-medium text-text-secondary">{title}</h3>
        </div>
        {targetStatus && (
          <span className={`text-xs font-body-medium ${targetStatus.color}`}>
            {targetStatus.status}
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-heading-semibold text-text-primary">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && <span className="text-sm text-text-secondary">{unit}</span>}
        </div>
        
        {change && (
          <div className="flex items-center space-x-1">
            <Icon name={getChangeIcon()} size={14} className={getChangeColor()} />
            <span className={`text-sm font-body-medium ${getChangeColor()}`}>
              {Math.abs(change)}% vs last period
            </span>
          </div>
        )}
        
        {target && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Progress</span>
              <span>{Math.round((value / target) * 100)}%</span>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  targetStatus.color === 'text-success' ? 'bg-success' :
                  targetStatus.color === 'text-warning' ? 'bg-warning' : 'bg-error'
                }`}
                style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;