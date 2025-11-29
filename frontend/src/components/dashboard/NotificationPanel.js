// src/components/dashboard/NotificationPanel.js

import React from 'react';
import './NotificationPanel.css';

const NotificationPanel = ({ connectionStatus, onRefresh }) => {
  const getStatusVariant = (status) => {
    if (status.includes('Connecté')) return 'success';
    if (status.includes('Reconnexion')) return 'warning';
    if (status.includes('Déconnecté')) return 'danger';
    return 'default';
  };

  const variant = getStatusVariant(connectionStatus);

  return (
    <div className={`terra-notification-panel terra-notification-${variant}`}>
      <div className="terra-notification-icon">
        {variant === 'success' && '✓'}
        {variant === 'warning' && '⚠'}
        {variant === 'danger' && '✗'}
        {variant === 'default' && 'ℹ'}
      </div>
      <div className="terra-notification-content">
        <span className="terra-notification-label">Statut de connexion</span>
        <span className="terra-notification-message">{connectionStatus}</span>
      </div>
      {onRefresh && (
        <button
          className="terra-notification-action terra-btn terra-btn-sm terra-btn-ghost"
          onClick={onRefresh}
          title="Rafraîchir les données"
        >
          🔄 Rafraîchir
        </button>
      )}
      <div className="terra-notification-pulse"></div>
    </div>
  );
};

export default NotificationPanel;
