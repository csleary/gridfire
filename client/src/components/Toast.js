import React, { Component } from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';

import '../style/toast.css';

let timer = null;

class Toast extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: ''
    };
  }

  componentWillReceiveProps(nextProps) {
    this.clearTimer();
    this.setState({
      isVisible: true,
      message: nextProps.toast.message
    });
    this.setTimer();
  }

  componentWillUnmount() {
    clearTimeout(timer);
  }

  setTimer() {
    timer = setTimeout(() => {
      this.setState({
        isVisible: false
      });
    }, 5000);
  }

  clearTimer() {
    clearTimeout(timer);
  }

  toastIcon(alertClass) {
    switch (alertClass) {
      case 'alert-success':
        return 'thumbs-o-up';
      case 'alert-danger':
        return 'exclamation-circle';
      case 'alert-warning':
        return 'exclamation-circle';
      case 'alert-info':
        return 'info-circle';
      default:
        return '';
    }
  }

  render() {
    const icon = this.toastIcon(this.props.toast.alertClass);
    const className = classNames(
      'toast',
      'alert',
      this.props.toast.alertClass,
      {
        'toast-show': this.state.isVisible,
        'toast-fade': !this.state.isVisible
      }
    );
    return (
      <div className={className}>
        <FontAwesome name={icon} className="icon-left" />
        {this.state.message}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  toast: state.toast
});

export default connect(mapStateToProps)(Toast);
