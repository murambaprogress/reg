import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkActions = ({ selectedJobs, onBulkStatusUpdate, onBulkDelete, onClearSelection }) => {
  if (selectedJobs.length === 0) return null;

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon name="CheckSquare" size={20} className="text-accent" />
          <span className="font-body-medium text-text-primary">
            {selectedJobs.length} job{selectedJobs.length > 1 ? 's' : ''} selected
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onBulkStatusUpdate('in_progress')}
            className="text-sm"
          >
            <Icon name="Play" size={14} className="mr-1" />
            Start Jobs
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => onBulkStatusUpdate('completed')}
            className="text-sm"
          >
            <Icon name="CheckCircle" size={14} className="mr-1" />
            Complete Jobs
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onBulkDelete}
            className="text-sm text-error hover:text-error"
          >
            <Icon name="Trash2" size={14} className="mr-1" />
            Delete
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={onClearSelection}
            className="text-sm"
          >
            <Icon name="X" size={14} className="mr-1" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;
