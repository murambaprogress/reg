import React from 'react';
import Icon from '../AppIcon';

const Input = ({ 
  className = '', 
  type = 'text', 
  placeholder, 
  icon, 
  iconPosition = 'left',
  error,
  label,
  required = false,
  disabled = false,
  ...props 
}) => {
  const baseClasses = 'modern-input w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200';
  
  const errorClasses = error 
    ? 'border-error focus:border-error focus:ring-error/20' :'';
  
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed bg-background' :'';

  const iconClasses = icon 
    ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') 
    : '';

  const classes = `${baseClasses} ${errorClasses} ${disabledClasses} ${iconClasses} ${className}`;

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-heading-medium text-text-primary mb-2">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name={icon} size={16} className="text-text-secondary" />
          </div>
        )}
        
        <input
          type={type}
          className={classes}
          placeholder={placeholder}
          disabled={disabled}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Icon name={icon} size={16} className="text-text-secondary" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-error flex items-center">
          <Icon name="AlertCircle" size={14} className="mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;