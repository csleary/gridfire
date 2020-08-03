import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import styles from './button.module.css';

const ButtonClick = ({
  autoFocus = false,
  children,
  className,
  disabled,
  icon,
  iconClassName,
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

  const chevronClassNames = classnames(styles.chevron, {
    [styles.rotate]: menuOpen
  });

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
      {icon ? (
        <FontAwesome className={iconClassName ? iconClassName : styles.icon} name={icon} fixedWidth spin={spin} />
      ) : null}
      {children ? children : text || null}
      {!textLink && menuOpen !== undefined ? <FontAwesome className={chevronClassNames} name="chevron-down" /> : null}
    </button>
  );
};

ButtonClick.propTypes = {
  autoFocus: PropTypes.bool,
  buttonRef: PropTypes.object,
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  icon: PropTypes.string,
  iconClassName: PropTypes.string,
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

export default ButtonClick;
