import React, { createContext, useContext, useEffect, useState } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
    }, duration);
  };

  // expose a global helper for ease of migration
  useEffect(() => {
    try {
      window.__SHOW_TOAST = showToast;
    } catch (e) {}
    return () => { try { delete window.__SHOW_TOAST; } catch (e) {} };
  }, []);

  const removeToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div aria-live="polite" className="fixed right-4 bottom-6 z-50 flex flex-col space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`max-w-xs w-full rounded px-4 py-2 shadow-md text-sm text-white ${t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-green-600' : 'bg-slate-700'}`}>
            <div className="flex items-center justify-between">
              <div>{t.message}</div>
              <button className="ml-3 opacity-80 hover:opacity-100" onClick={() => removeToast(t.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx.showToast;
};

export default ToastProvider;
