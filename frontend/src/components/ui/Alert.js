import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';

const typeToIcon = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

const Alert = ({ type = 'info', title, message, actionLabel, onAction, onClose }) => (
  <div className={`ui-alert ui-alert-${type}`} role="alert">
    <div className="ui-alert-icon" aria-hidden="true">
      {typeToIcon[type] || 'ℹ️'}
    </div>
    <div className="ui-alert-content">
      {title && <p className="ui-alert-title">{title}</p>}
      {message && <p className="ui-alert-message">{message}</p>}
    </div>
    {(onAction || onClose) && (
      <div className="ui-alert-actions">
        {onAction && (
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel || 'Réessayer'}
          </Button>
        )}
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fermer
          </Button>
        )}
      </div>
    )}
  </div>
);

Alert.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  title: PropTypes.string,
  message: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  onClose: PropTypes.func,
};

export default Alert;