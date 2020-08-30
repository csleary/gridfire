import React, { useEffect, useRef } from 'react';
import { animated, useTransition } from 'react-spring';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import styles from './modal.module.css';

const Modal = props => {
  const { closeModal, isOpen, returnFocusElement, showClose = true } = props;
  const modal = useRef();
  const modalContent = useRef();
  const tabbable = useRef();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const children = modalContent.current.querySelectorAll('*');
      tabbable.current = Array.from(children).filter(el => el.hasAttribute('tabindex'));
      const inputField = tabbable.current.find(el => el.tagName === 'INPUT');
      const inputIndex = tabbable.current.indexOf(inputField);
      if (inputIndex > -1) tabbable.current[inputIndex].focus();
      else modal.current.focus();
    }

    return () => {
      document.body.style.overflow = 'unset';
      returnFocusElement && returnFocusElement.focus();
    };
  }, [isOpen, returnFocusElement]);

  const transition = useTransition(isOpen, {
    config: { mass: 1, tension: 250, friction: 30, clamp: true },
    from: { opacity: 0, transform: 'translateY(-1rem)' },
    enter: { opacity: 1, transform: 'translateY(0rem)' },
    leave: { opacity: 0, transform: 'translateY(1rem)' }
  });

  const handleClick = e => {
    if (!showClose) return;
    closeModal();
    e.stopPropagation();
  };

  const handleContentClick = e => {
    e.stopPropagation();
  };

  const handleKeyDown = e => {
    if (e.keyCode === 27 && showClose) {
      closeModal();
    }

    if (e.shiftKey && e.keyCode === 9 && e.target === tabbable.current[0]) {
      e.preventDefault();
      tabbable.current[tabbable.current.length - 1].focus();
    }
  };

  const handleCloseIconKeyDown = e => {
    const closeCodes = [13, 32];
    const tabCode = 9;

    if (closeCodes.includes(e.keyCode) && showClose) {
      closeModal();
    } else if (!e.shiftKey && e.keyCode === tabCode) {
      e.preventDefault();
      tabbable.current[0].focus();
    }
  };

  return ReactDOM.createPortal(
    transition(
      ({ opacity, transform }, item) =>
        item && (
          <animated.div
            className={styles.overlay}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            ref={ref => (modal.current = ref)}
            style={{ opacity }}
            tabIndex="0"
          >
            <animated.div
              ref={ref => (modalContent.current = ref)}
              onClick={handleContentClick}
              onKeyDown={handleKeyDown}
              style={{ transform }}
            >
              {props.children}
              {showClose ? (
                <FontAwesome
                  className={styles.closeIcon}
                  name="times"
                  onClick={handleClick}
                  onKeyDown={handleCloseIconKeyDown}
                  tabIndex="0"
                  title="Close this dialog box."
                />
              ) : null}
            </animated.div>
          </animated.div>
        )
    ),
    document.body
  );
};

Modal.propTypes = {
  children: PropTypes.element,
  closeModal: PropTypes.func,
  isOpen: PropTypes.bool,
  showClose: PropTypes.bool
};

export default Modal;
