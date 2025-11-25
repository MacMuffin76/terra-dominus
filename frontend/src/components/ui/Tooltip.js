import React from 'react';
import PropTypes from 'prop-types';

/**
 * Affiche un tooltip simple au survol ou au focus clavier.
 */
const Tooltip = ({ content, children }) => (
  <span className="tooltip" role="presentation">
    {children}
    <span className="tooltip-bubble" aria-live="polite">{content}</span>
  </span>
);

Tooltip.propTypes = {
  content: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
};

export default Tooltip;