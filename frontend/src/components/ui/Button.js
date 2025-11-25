import React from 'react';
import PropTypes from 'prop-types';

const classes = (...values) => values.filter(Boolean).join(' ');

/**
 * Bouton réutilisable pour l'interface.
 * Variantes disponibles :
 *  - variant: "primary" | "secondary" | "success" | "danger" | "ghost"
 *  - size: "sm" | "md" | "lg"
 *  - état: disabled (HTML) ou isLoading (affiche un spinner et bloque le clic)
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className,
  ...props
}) => {
  const computedClassName = classes(
    'btn',
    `btn-${variant}`,
    size !== 'md' && `btn-${size}`,
    fullWidth && 'btn-full',
    isLoading && 'is-loading',
    className
  );

  return (
    <button
      className={computedClassName}
      disabled={props.disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && <span className="btn-spinner" aria-hidden="true" />}
      <span className="btn-label">{children}</span>
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;