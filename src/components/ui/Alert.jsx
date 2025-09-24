import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

const variants = {
  info: {
    icon: Info,
    className: 'bg-blue-50 text-blue-800 border-blue-200',
    iconClassName: 'text-blue-400',
  },
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 text-green-800 border-green-200',
    iconClassName: 'text-green-400',
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    iconClassName: 'text-yellow-400',
  },
  error: {
    icon: XCircle,
    className: 'bg-red-50 text-red-800 border-red-200',
    iconClassName: 'text-red-400',
  },
};

const Alert = ({ 
  variant = 'info', 
  title, 
  children, 
  className = '', 
  onClose,
  ...props 
}) => {
  const config = variants[variant] || variants.info;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-lg ${config.className} ${className}`}
      role="alert"
      {...props}
    >
      <Icon className={`w-5 h-5 mt-0.5 ${config.iconClassName}`} />
      <div className="flex-1">
        {title && <h3 className="font-medium mb-1">{title}</h3>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
          aria-label="Close alert"
        >
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Alert;