import React from 'react';
import PropTypes from 'prop-types';

const classes = (...values) => values.filter(Boolean).join(' ');

/**
 * Conteneur de carte avec zones optionnelles pour l'en-tête et le pied de page.
 */
const Card = ({ title, subtitle, footer, children, className, headerAction }) => (
  <div className={classes('card', className)}>
    {(title || subtitle || headerAction) && (
      <div className="card-header">
        <div>
          {title && <h2 className="card-title">{title}</h2>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {headerAction}
      </div>
    )}
    <div className="card-body">{children}</div>
    {footer && <div className="card-footer">{footer}</div>}
  </div>
);

Card.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  footer: PropTypes.node,
  headerAction: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Card;