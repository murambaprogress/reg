import React from 'react';
import Button from '../../../components/ui/Button';

const ConfirmModal = ({ isOpen, title = 'Confirm', message = '', confirmLabel = 'Confirm', onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-sm border border-border">
        <h3 className="text-lg font-heading-semibold mb-2">{title}</h3>
        <p className="text-text-secondary mb-4">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
