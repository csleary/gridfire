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
      text: ''
    };
  }

  componentWillReceiveProps(nextProps) {
    this.clearTimer();
    this.setState({
      isVisible: true,
      text: nextProps.toast.text
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

  toastIcon(type) {
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
  }

  render() {
    const { type } = this.props.toast;
    const icon = this.toastIcon(type);
    const classes = classNames('toast', 'alert', {
      'alert-danger': type === 'error',
      'alert-info': type === 'info',
      'alert-success': type === 'success',
      'alert-warning': type === 'warning',
      'toast-show': this.state.isVisible,
      'toast-fade': !this.state.isVisible
    });
    return (
      <div className={classes}>
        <FontAwesome name={icon} className="icon-left" />
        {this.state.text}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  toast: state.toast
});

export default connect(mapStateToProps)(Toast);
