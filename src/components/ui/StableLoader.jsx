import React from 'react';
import Icon from '../AppIcon';

const StableLoader = ({ 
  isLoading, 
  children, 
  fallback = null, 
  minHeight = '200px',
  showSpinner = true,
  message = 'Loading...' 
}) => {
  if (isLoading && !children) {
    return (
      <div 
        className="flex items-center justify-center p-8 smooth-transition"
        style={{ minHeight }}
      >
        {showSpinner && (
          <div className="text-center">
            <Icon name="Loader" size={32} className="mx-auto mb-2 animate-spin text-accent" />
            <p className="text-text-secondary text-sm">{message}</p>
          </div>
        )}
        {fallback}
      </div>
    );
  }

  // Show children with smooth transition
  return (
    <div className="smooth-transition loading-fade-in" style={{ minHeight }}>
      {children}
    </div>
  );
};

export default StableLoader;