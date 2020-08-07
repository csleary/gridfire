import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import styles from './button.module.css';

const Button = ({
  autoFocus = false,
  children,
  className,
  disabled,
  icon,
  iconClassName,
  iconRight,
  isActive,
  menuOpen,
  onClick,
  secondary,
  buttonRef,
  size,
  spin,
  style,
  text,
  textLink,
  title,
  type,
  ...rest
}) => {
  const buttonClassNames = classnames(className, {
    [styles.active]: isActive,
    [styles.button]: !textLink,
    [styles.large]: size === 'large',
    [styles.link]: textLink,
    [styles.secondary]: secondary,
    [styles.small]: size === 'small'
  });

  const iconClassNames = classnames(styles.icon, {
    [iconClassName]: iconClassName,
    [styles.spin]: spin
  });

  const chevronClassNames = classnames(styles.chevron, {
    [styles.rotate]: menuOpen
  });

  const buttonIcon = icon ? <FontAwesome className={iconClassNames} name={icon} fixedWidth /> : null;

  return (
    <button
      autoFocus={autoFocus}
      className={buttonClassNames}
      disabled={disabled}
      onClick={onClick}
      ref={buttonRef}
      style={style}
      title={title}
      type={type}
      {...rest}
    >
      {icon && !iconRight ? buttonIcon : null}
      {children ? children : text || null}
      {icon && iconRight ? buttonIcon : null}
      {!textLink && menuOpen !== undefined ? <FontAwesome className={chevronClassNames} name="chevron-down" /> : null}
    </button>
  );
};

Button.propTypes = {
  autoFocus: PropTypes.bool,
  buttonRef: PropTypes.object,
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  icon: PropTypes.string,
  iconClassName: PropTypes.string,
  iconRight: PropTypes.bool,
  isActive: PropTypes.bool,
  menuOpen: PropTypes.bool,
  onClick: PropTypes.func,
  secondary: PropTypes.bool,
  size: PropTypes.string,
  spin: PropTypes.bool,
  style: PropTypes.object,
  text: PropTypes.string,
  textLink: PropTypes.bool,
  title: PropTypes.string,
  type: PropTypes.string
};

export default Button;
