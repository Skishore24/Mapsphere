import React, { useState, useCallback } from 'react';
import { ToastContext, ToastItem, ToastType } from './ToastContextDefinition';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-3), { id, message, type }]); // Keep max 4 toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);
  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, info, success, warning, error }}>
      {children}
      {/* Toast Notification Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
        maxWidth: '90vw',
        width: '420px',
      }}>
        {toasts.map(toast => {
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          const isSuccess = toast.type === 'success';

          let bg = 'rgba(15, 23, 42, 0.95)';
          let border = 'rgba(255, 255, 255, 0.12)';
          let icon = <Info size={18} color="var(--accent-cyan)" />;

          if (isError) {
            bg = 'rgba(244, 63, 94, 0.95)';
            border = 'rgba(255, 255, 255, 0.2)';
            icon = <AlertCircle size={18} color="#ffffff" />;
          } else if (isWarning) {
            bg = 'rgba(245, 158, 11, 0.95)';
            border = 'rgba(255, 255, 255, 0.2)';
            icon = <AlertTriangle size={18} color="#ffffff" />;
          } else if (isSuccess) {
            bg = 'rgba(16, 185, 129, 0.95)';
            border = 'rgba(255, 255, 255, 0.2)';
            icon = <CheckCircle2 size={18} color="#ffffff" />;
          }

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: bg,
                backdropFilter: 'blur(16px)',
                border: `1px solid ${border}`,
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                animation: 'slideInTop 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {icon}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
