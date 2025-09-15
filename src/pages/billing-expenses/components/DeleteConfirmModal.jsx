import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Delete Item', 
  message = 'Are you sure you want to delete this item?',
  itemName = '',
  loading = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-error/10 rounded-full flex items-center justify-center">
              <Icon name="AlertTriangle" size={20} className="text-error" />
            </div>
            <h2 className="text-lg font-heading-semibold text-text-primary">
              {title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="modern-button p-2 hover:bg-background"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-text-secondary mb-4">
            {message}
          </p>
          {itemName && (
            <div className="modern-card p-4 bg-error/5 border border-error/20 mb-4">
              <p className="text-sm text-text-primary font-body-medium">
                <span className="text-text-secondary">Item:</span> {itemName}
              </p>
            </div>
          )}
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Icon name="AlertCircle" size={20} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-body-medium text-warning mb-1">
                  Warning
                </h4>
                <p className="text-sm text-text-secondary">
                  This action cannot be undone. The item will be permanently deleted from the system.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-border bg-background/25">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="modern-button border-border hover:border-primary"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="modern-button bg-error text-error-foreground hover:bg-error/90"
          >
            {loading ? (
              <>
                <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Icon name="Trash2" size={16} className="mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
