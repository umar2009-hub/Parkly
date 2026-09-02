import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 md:top-4 md:bottom-auto z-50 flex flex-col space-y-2 max-w-sm w-full px-4 md:px-0 pointer-events-none">
        {toasts.map((t) => {
          let bgColor = 'bg-brand-surface border-brand-lime/30 text-white';
          let Icon = Info;
          let iconColor = 'text-brand-lime';

          if (t.type === 'success') {
            bgColor = 'bg-brand-surface border-success/30 text-white';
            Icon = CheckCircle;
            iconColor = 'text-success';
          } else if (t.type === 'warning') {
            bgColor = 'bg-brand-surface border-warning/30 text-white';
            Icon = AlertTriangle;
            iconColor = 'text-warning';
          } else if (t.type === 'error') {
            bgColor = 'bg-brand-surface border-error/30 text-white';
            Icon = AlertCircle;
            iconColor = 'text-error';
          } else if (t.type === 'info') {
            bgColor = 'bg-brand-surface border-info/30 text-white';
            Icon = Info;
            iconColor = 'text-info';
          }

          return (
            <div
              key={t.id}
              className={`flex items-start p-4 rounded-lg border shadow-lg ${bgColor} pointer-events-auto animate-slide-up relative`}
              role="alert"
            >
              <div className="flex-shrink-0 mr-3 mt-0.5">
                <Icon size={18} className={iconColor} />
              </div>
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium tracking-wide leading-relaxed">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 text-brand-text-muted hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
