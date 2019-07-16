import React from 'react';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';
import '../style/toast.css';

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

  const classes = classNames('toast', 'alert', {
    'alert-danger': type === 'error',
    'alert-info': type === 'info',
    'alert-success': type === 'success',
    'alert-warning': type === 'warning',
    'toast-show': visible,
    'toast-fade': !visible
  });

  return (
    <div className={classes}>
      <FontAwesome name={toastIcon()} className="mr-2" />
      {message}
    </div>
  );
};

export default Toast;
