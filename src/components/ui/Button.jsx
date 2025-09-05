import React from 'react';
import Icon from '../AppIcon';

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className = '', 
  disabled = false, 
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick: propOnClick,
  confirmMessage,
  ...props 
}) => {
  const baseClasses = 'modern-button inline-flex items-center justify-center rounded-lg font-body-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50';
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl',
    outline: 'border border-border text-text-primary hover:bg-background hover:text-text-primary',
    ghost: 'text-text-primary hover:bg-background hover:text-text-primary',
    text: 'text-primary hover:text-primary/80 hover:bg-primary/5',
    destructive: 'bg-error text-error-foreground hover:bg-error/90 shadow-lg hover:shadow-xl',
    success: 'bg-success text-success-foreground hover:bg-success/90 shadow-lg hover:shadow-xl',
    warning: 'bg-warning text-warning-foreground hover:bg-warning/90 shadow-lg hover:shadow-xl',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' :'cursor-pointer';

  const widthClasses = fullWidth ? 'w-full' : '';

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${widthClasses} ${className}`;
  const handleClick = (e) => {
    if (disabled) return;
    // If a confirmation message is provided, require confirmation before proceeding
    if (confirmMessage) {
      try {
        const ok = window.confirm(confirmMessage);
        if (!ok) return;
      } catch (err) {
        // If window.confirm isn't available, fall back to not proceeding
        return;
      }
    }
    if (typeof propOnClick === 'function') return propOnClick(e);
    // In development, surface a clear console warning when a button is clickable but has no handler.
    if (process.env.NODE_ENV !== 'production') {
      try {
        const label = typeof children === 'string' ? children : (children?.props?.children || 'button');
        // eslint-disable-next-line no-console
        console.warn(`[Button] Unhandled click on button (${label}). No onClick handler provided.`);
      } catch (err) {
        // ignore
      }
    }
  };

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <Icon name={icon} size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="mr-2" />
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <Icon name={icon} size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="ml-2" />
      )}
    </button>
  );
};

export default Button;