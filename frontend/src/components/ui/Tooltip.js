import React from 'react';
import PropTypes from 'prop-types';

/**
 * Affiche un tooltip simple au survol ou au focus clavier.
 */
const Tooltip = ({ content, children }) => (
  <span className="tooltip" tabIndex={0} aria-label={typeof content === 'string' ? content : undefined}>
    {children}
    <span className="tooltip-bubble">{content}</span>
  </span>
);

Tooltip.propTypes = {
  content: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
};

export default Tooltip;