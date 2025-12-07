// frontend/src/components/ui/Toast.js
import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import './Toast.css';

const TOAST_TYPES = {
  error: { icon: AlertCircle, className: 'toast-error' },
  success: { icon: CheckCircle, className: 'toast-success' },
  info: { icon: Info, className: 'toast-info' },
  warning: { icon: AlertTriangle, className: 'toast-warning' }
};

export const Toast = ({ id, type = 'info', message, duration = 5000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const config = TOAST_TYPES[type] || TOAST_TYPES.info;
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div className={`toast ${config.className} ${isExiting ? 'toast-exit' : ''}`}>
      <div className="toast-icon">
        <Icon size={20} />
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={handleClose} aria-label="Fermer">
        <X size={18} />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};
