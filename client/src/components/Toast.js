import FontAwesome from 'react-fontawesome';
import React from 'react';
import classNames from 'classnames';
import styles from '../style/Toast.module.css';

const Toast = ({ toast }) => {
  const { message, type, visible } = toast;

  const toastIcon = type => {
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

export default Toast;
