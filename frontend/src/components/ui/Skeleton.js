import React from 'react';
import PropTypes from 'prop-types';

const Skeleton = ({ width = '100%', height = '1rem', rounded = false }) => (
  <span
    className={`ui-skeleton ${rounded ? 'ui-skeleton-rounded' : ''}`}
    style={{ width, height }}
    aria-hidden="true"
  />
);

Skeleton.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  rounded: PropTypes.bool,
};

export default Skeleton;