import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';

const classes = (...values) => values.filter(Boolean).join(' ');

/**
 * Fenêtre modale légère. Pour l'utiliser : rendre isOpen true, et fournir onClose.
 */
const Modal = ({ isOpen, title, children, footer, onClose, className }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className={classes('modal-content', className)}>
        {(title || onClose) && (
          <div className="modal-header">
            {title && <h3 className="card-title">{title}</h3>}
            {onClose && (
              <Button variant="ghost" size="sm" aria-label="Fermer" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  onClose: PropTypes.func,
  className: PropTypes.string,
};

export default Modal;