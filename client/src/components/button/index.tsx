import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import styles from './button.module.css';

interface Props {
  autoFocus?: boolean;
  children?: Object;
  className?: string;
  disabled?: boolean;
  icon?: IconProp;
  iconClassName: string;
  iconRight?: boolean;
  isActive?: boolean;
  menuOpen?: boolean;
  onClick: (arg0: any) => CustomEvent;
  secondary?: boolean;
  buttonRef?: string;
  size?: string;
  spin?: boolean;
  style?: Object;
  text?: string;
  textLink?: boolean;
  title?: string;
  type?: 'submit' | 'reset' | 'button';
}

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
}: Props) => {
  const buttonClassNames = classnames(className, {
    [styles.active]: isActive,
    [styles.button]: !textLink,
    [styles.large]: size === 'large',
    [styles.link]: textLink,
    [styles.secondary]: secondary,
    [styles.small]: size === 'small'
  });

  const iconClassNames = classnames({
    [iconClassName]: iconClassName,
    [styles.spin]: spin,
    [styles.icon]: Boolean(icon) && !iconRight,
    [styles.iconRight]: iconRight
  });

  const chevronClassNames = classnames(styles.chevron, {
    [styles.rotate]: menuOpen
  });

  const buttonIcon = icon ? <FontAwesomeIcon className={iconClassNames} icon={icon} fixedWidth /> : null;

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
      {!textLink && menuOpen !== undefined ? <FontAwesomeIcon className={chevronClassNames} icon={faChevronDown} /> : null}
    </button>
  );
};

Button.propTypes = {
  autoFocus: PropTypes.bool,
  buttonRef: PropTypes.object,
  children: PropTypes.node,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  icon: PropTypes.object,
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
