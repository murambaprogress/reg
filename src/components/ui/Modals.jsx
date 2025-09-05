import React from 'react';

export const PromptModal = ({ isOpen, title = '', placeholder = '', defaultValue = '', onCancel, onConfirm }) => {
  const [value, setValue] = React.useState(defaultValue);
  React.useEffect(() => { setValue(defaultValue); }, [defaultValue, isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-md p-4">
        <h3 className="text-lg font-heading-medium mb-2">{title}</h3>
        <input value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} className="w-full border border-border rounded px-3 py-2 mb-4" />
        <div className="flex justify-end space-x-2">
          <button className="px-3 py-1 rounded bg-background border" onClick={onCancel}>Cancel</button>
          <button className="px-3 py-1 rounded bg-accent text-white" onClick={() => onConfirm(value)}>OK</button>
        </div>
      </div>
    </div>
  );
};

export const HistoryModal = ({ isOpen, title = 'History', entries = [], onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-lg shadow-lg w-full max-w-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-heading-medium">{title}</h3>
          <button className="px-2 py-1 rounded" onClick={onClose}>Close</button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-sm text-text-secondary">No history available</p>
          ) : (
            <ul className="space-y-2">
              {entries.map((e, idx) => (
                <li key={idx} className="p-3 border border-border rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-body-medium">{e.type} {e.quantity}</div>
                      <div className="text-xs text-text-secondary">{e.notes || ''}</div>
                    </div>
                    <div className="text-xs text-text-secondary">{new Date(e.timestamp).toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
