import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import React from 'react';
import classnames from 'classnames';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import styles from './button.module.css';

interface ButtonProps {
  autoFocus?: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement>;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: IconDefinition;
  iconClassName?: string;
  iconRight?: boolean;
  isActive?: boolean;
  menuOpen?: boolean;
  onClick: (e: React.MouseEvent) => React.MouseEvent<HTMLButtonElement>;
  secondary?: boolean;
  size?: string;
  spin?: boolean;
  style?: React.CSSProperties;
  text?: string;
  textLink?: boolean;
  title?: string;
  type?: 'submit' | 'reset' | 'button';
}

const Button:React.FC<ButtonProps> = ({
  autoFocus = false,
  children,
  className,
  disabled,
  icon,
  iconClassName = '',
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


export default Button;
