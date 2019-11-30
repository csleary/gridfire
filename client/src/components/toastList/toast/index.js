import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from 'components/toastList/toast.module.css';

const Toast = ({ toast }) => {
  const { message, type, visible } = toast;

  const toastIcon = () => {
    switch (type) {
    case 'error':
      return 'exclamation-circle';
    case 'info':
      return 'info-circle';
    case 'success':
      return 'thumbs-o-up';
    case 'warning':
      return 'exclamation-circle';
    default:
      return 'info-circle';
    }
  };

  const classes = classNames('toast', styles.alert, 'alert', {
    'alert-success': type === 'success',
    'alert-info': type === 'info',
    'alert-warning': type === 'warning',
    [styles.warning]: type === 'warning',
    'alert-danger': type === 'error',
    [styles.danger]: type === 'error',
    [styles.show]: visible,
    [styles.fade]: !visible
  });

  return (
    <div className={classes}>
      <FontAwesome name={toastIcon()} className="mr-2" />
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
