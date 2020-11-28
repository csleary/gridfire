import { faExclamationCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import styles from '../toast.module.css';

const Toast = ({ toast }) => {
  const { message, type, visible } = toast;

  const toastIcon = () => {
    switch (type) {
      case 'error':
        return faExclamationCircle;
      case 'info':
        return faInfoCircle;
      case 'success':
        return faThumbsUp;
      case 'warning':
        return faExclamationCircle;
      default:
        return faInfoCircle;
    }
  };

  const classes = classNames(styles.alert, 'toast', {
    [styles.success]: type === 'success',
    [styles.info]: type === 'info',
    [styles.warning]: type === 'warning',
    [styles.danger]: type === 'error',
    [styles.show]: visible,
    [styles.fade]: !visible
  });

  return (
    <div className={classes}>
      <FontAwesomeIcon icon={toastIcon()} className="mr-2" />
      {message}
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string,
  toast: PropTypes.object,
  type: PropTypes.string,
  visible: PropTypes.bool
};

export default Toast;
