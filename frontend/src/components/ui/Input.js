import React from 'react';
import PropTypes from 'prop-types';

const classes = (...values) => values.filter(Boolean).join(' ');

/**
 * Champ de saisie stylisé avec prise en charge des labels, tailles et états d'erreur.
 */
const Input = ({
  label,
  helperText,
  error = false,
  size = 'md',
  className,
  inputClassName,
  children,
  ...props
}) => {
  const inputClasses = classes(
    'input',
    size !== 'md' && `input-${size}`,
    error && 'input-error',
    inputClassName
  );

  return (
    <label className={classes('input-group', className)}>
      {label && <span className="input-label">{label}</span>}
      <input className={inputClasses} {...props} />
      {helperText && (
        <small className={classes('input-helper', error && 'input-helper-error')}>
          {helperText}
        </small>
      )}
      {children}
    </label>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  helperText: PropTypes.node,
  error: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  children: PropTypes.node,
};

export default Input;