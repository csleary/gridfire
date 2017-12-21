import React, { Component } from 'react';
import '../style/emailForm.css';

class EmailForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      emailAddress: ''
    };
  }

  onEmailChange = event => this.props.onEmailChange(event.target.value);

  render() {
    return (
      <div>
        <h2 className="text-center">Payment</h2>
        <p>
          To pay, please enter your email address. This is used to create your
          own unique ID to verify your payment.
        </p>
        <input
          disabled={this.props.emailDisabled}
          // value={this.state.emailAddress}
          onChange={this.onEmailChange}
          className="form-control email-form"
          placeholder="Email"
          type="email"
          required
        />
      </div>
    );
  }
}

export default EmailForm;
