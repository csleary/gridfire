import React from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';
import '../style/toast.css';

const Toast = props => {
  const { isVisible, toast } = props;
  const { message, type } = toast;

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
    'toast-show': isVisible,
    'toast-fade': !isVisible
  });

  return (
    <div className={classes}>
      <FontAwesome name={toastIcon()} className="mr-2" />
      {message}
    </div>
  );
};

const mapStateToProps = state => ({
  toastList: state.toastList
});

export default connect(mapStateToProps)(Toast);
