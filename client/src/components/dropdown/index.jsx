import React, { useRef, useState } from 'react';
import { animated, config, useTransition } from 'react-spring';
import Button from 'components/button';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { createPortal } from 'react-dom';
import styles from './dropdown.module.css';
import { useOnClickOutside } from 'hooks/useOnClickOutside';

const Dropdown = ({
  buttonChildren = null, // Children passthough to button.
  children, // Children passthough for the dropdown menu (usually list elements).
  className, // CSS class for the combined button and dropdown.
  closeOnClick, // Bool controlling whether menu should close on selection click or not.
  containerClassName,
  dropdownClassName, // CSS class just for the dropdown menu
  offset = 8,
  onClick,
  onClickOutside,
  fullWidth = false,
  label,
  name,
  role,
  ...rest
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const dropdownRef = useRef();
  const buttonRef = useRef();
  const menuRef = useRef();

  useOnClickOutside(dropdownRef, e => {
    if (e.target === buttonRef.current || buttonRef.current.contains(e.target)) return;
    setShowMenu(false);
    if (onClickOutside) onClickOutside();
  });

  const transition = useTransition(showMenu, {
    config: { clamp: true, ...config.stiff },
    from: { opacity: 0, transform: 'scale(0.98) translateY(-0.75rem)' },
    enter: { opacity: 1, transform: 'scale(1) translateY(0rem)' },
    leave: { opacity: 0, transform: 'scale(0.98) translateY(0.5rem)' },
    onStart: () => {
      if (!dropdownRef.current) return;
      const { left, top, bottom, right } = buttonRef.current.getBoundingClientRect();
      const { height, width } = dropdownRef.current.getBoundingClientRect();
      const yLimit = bottom + height + offset;
      const xLimit = left + width;
      dropdownRef.current.style.left = `${left}px`;
      dropdownRef.current.style.top = `${bottom + offset}px`;

      if (fullWidth && xLimit < right) {
        dropdownRef.current.style.right = `${right}px`;
        dropdownRef.current.style.width = `${right - left}px`;
      }

      // Menu will get cut off by bottom of screen
      if (yLimit > window.innerHeight) {
        const newTop = top - height - offset;
        if (newTop > 0) {
          dropdownRef.current.style.top = `${newTop}px`;
        }
      }

      // Menu will get cut off by right side of screen
      if (xLimit > window.innerWidth) {
        dropdownRef.current.style.left = `${right - width}px`;
      }
    }
  });

  const handleOnClick = e => {
    setShowMenu(!showMenu);
    if (onClick) onClick();
    e.preventDefault();
    e.stopPropagation();
  };

  const containerClassNames = classnames(styles.container, {
    [containerClassName]: Boolean(containerClassName),
    active: showMenu
  });
  const dropdownClassNames = classnames(styles.menu, { [dropdownClassName]: Boolean(dropdownClassName) });

  return (
    <>
      <div className={containerClassNames} ref={menuRef}>
        <Button
          buttonRef={buttonRef}
          className={className}
          isActive={showMenu}
          label={label}
          menuOpen={showMenu}
          name={name}
          onClick={handleOnClick}
          role={role}
          {...rest}
        >
          {buttonChildren}
        </Button>
      </div>
      {createPortal(
        transition(
          ({ opacity, transform }, item) =>
            item && (
              <animated.ul
                className={dropdownClassNames}
                onClick={closeOnClick && handleOnClick}
                ref={ref => (dropdownRef.current = ref)}
                style={{ opacity, transform }}
              >
                {children}
              </animated.ul>
            )
        ),
        document.body
      )}
    </>
  );
};

Dropdown.propTypes = {
  buttonChildren: PropTypes.object,
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  className: PropTypes.string,
  closeOnClick: PropTypes.bool,
  containerClassName: PropTypes.string,
  dropdownClassName: PropTypes.string,
  dropdownRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  fullWidth: PropTypes.bool,
  label: PropTypes.string,
  name: PropTypes.string,
  onClick: PropTypes.func,
  onClickOutside: PropTypes.func,
  override: PropTypes.func,
  overrideReset: PropTypes.bool,
  role: PropTypes.string,
  offset: PropTypes.number
};

export default Dropdown;
