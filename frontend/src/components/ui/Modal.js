import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './Modal.css';

const classes = (...values) => values.filter(Boolean).join(' ');

/**
 * Fenêtre modale légère. Pour l'utiliser : rendre isOpen true, et fournir onClose.
 */
const Modal = ({ isOpen, title, children, footer, onClose, className, maxWidth = '900px' }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div 
        className={classes('modal-content', className)} 
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
        {title && (
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
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
  maxWidth: PropTypes.string,
};

export default Modal;