import React from 'react';
import PropTypes from 'prop-types';

const Loader = ({ label = 'Chargement...', size = 'md', center = false }) => {
  const className = [
    'ui-loader',
    `ui-loader-${size}`,
    center ? 'ui-loader-center' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} role="status" aria-live="polite">
      <span className="ui-loader-spinner" aria-hidden="true" data-testid="loader-spinner" />
      {label && <span className="ui-loader-label">{label}</span>}
    </div>
  );
};

Loader.propTypes = {
  label: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  center: PropTypes.bool,
};

export default Loader;