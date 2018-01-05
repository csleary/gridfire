import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { passwordUpdate } from '../actions';

class PasswordUpdate extends Component {
  onSubmit = values =>
    this.props.passwordUpdate({
      email: this.props.user.auth.email,
      ...values
    });

  required = value => (value ? undefined : 'Please enter a value.');

  isMatched = (value, allValues) => {
    if (value === allValues.passwordNew) {
      return undefined;
    }
    return 'The passwords entered do not match. Please double-check them.';
  };

  renderField = field => {
    const {
      input,
      label,
      meta: { touched, error },
      name,
      placeholder,
      required,
      type
    } = field;

    return (
      <div className="form-group">
        <label htmlFor="password">{label}</label>
        <input
          {...input}
          className="form-control"
          name={name}
          placeholder={placeholder}
          required={required}
          type={type}
        />
        <div className="invalid-feedback">{touched && error && error}</div>
      </div>
    );
  };

  render() {
    const { handleSubmit, pristine, submitting } = this.props;

    return (
      <div>
        <h3>Update Password</h3>
        <p>You can update your password using the form below.</p>
        <form onSubmit={handleSubmit(this.onSubmit)}>
          <Field
            component={this.renderField}
            label="Current Password:"
            name="password"
            placeholder="Current Password"
            required="true"
            type="password"
            validate={this.required}
          />
          <Field
            component={this.renderField}
            label="New Password:"
            name="passwordNew"
            placeholder="New Password"
            required
            type="password"
            validate={this.required}
          />
          <Field
            component={this.renderField}
            label="Confirm New Password:"
            name="passwordConfirm"
            placeholder="New Password"
            required
            type="password"
            validate={[this.required, this.isMatched]}
          />
          <div className="d-flex justify-content-end">
            <button
              className="btn btn-outline-primary btn-lg"
              disabled={pristine || submitting}
              type="submit"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  user: state.user
});

export default reduxForm({
  form: 'loginForm'
})(connect(mapStateToProps, { passwordUpdate })(withRouter(PasswordUpdate)));
