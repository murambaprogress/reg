import React from 'react';
import Icon from '../../../components/AppIcon';

const ExpenseStatsCard = ({ title, value, change, changeType, icon, color }) => {
  const getColorClasses = (colorName) => {
    switch (colorName) {
      case 'success':
        return 'bg-success text-success-foreground';
      case 'warning':
        return 'bg-warning text-warning-foreground';
      case 'error':
        return 'bg-error text-error-foreground';
      case 'accent':
        return 'bg-accent text-accent-foreground';
      case 'primary':
        return 'bg-primary text-primary-foreground';
      case 'secondary':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  const getChangeColor = (type) => {
    switch (type) {
      case 'increase':
        return 'text-success';
      case 'decrease':
        return 'text-error';
      default:
        return 'text-text-secondary';
    }
  };

  const getChangeIcon = (type) => {
    switch (type) {
      case 'increase':
        return 'TrendingUp';
      case 'decrease':
        return 'TrendingDown';
      default:
        return 'Minus';
    }
  };

  return (
    <div className="modern-card p-6 relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-caption-normal text-text-secondary mb-1">
            {title}
          </p>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-heading-semibold text-text-primary">
              {value}
            </p>
            <div className={`flex items-center space-x-1 text-sm font-body-medium ${getChangeColor(changeType)}`}>
              <Icon name={getChangeIcon(changeType)} size={14} />
              <span>{change}</span>
            </div>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses(color)} shadow-lg floating-animation`}>
          <Icon name={icon} size={20} />
        </div>
      </div>
      
      {/* Gradient overlay for hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

export default ExpenseStatsCard;