import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import { Field, reduxForm } from 'redux-form';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Recaptcha from 'react-google-recaptcha';
import { register } from '../actions';

const sitekey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

class Register extends Component {
  onSubmit = values => {
    this.props.register(values, () => {
      this.props.reset();
      this.props.history.push('/');
    });
  };

  required = value => (value ? undefined : 'Please enter a value.');

  renderRecaptcha = field => {
    const { error, input, touched } = field;

    return (
      <div className="form-group d-flex flex-wrap justify-content-center py-2">
        <Recaptcha
          onChange={response => input.onChange(response)}
          sitekey={sitekey}
        />
        {touched &&
          error && (
            <div className="invalid-feedback">{touched && error && error}</div>
          )}
      </div>
    );
  };

  renderField = field => {
    const {
      hint,
      icon,
      id,
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
        <label htmlFor={id}>
          <FontAwesome name={icon} className="red icon-left" />
          {label}
        </label>
        <input
          {...input}
          className="form-control"
          name={name}
          placeholder={placeholder}
          required={required}
          type={type}
        />
        {error && (
          <div className="invalid-feedback">{touched && error && error}</div>
        )}
        {hint && <small className="form-text text-muted">{hint}</small>}
      </div>
    );
  };

  render() {
    const { handleSubmit, pristine, submitting, invalid } = this.props;

    return (
      <main className="container">
        <div className="row">
          <div className="col">
            <h2 className="text-center mt-4">Register</h2>
            <form onSubmit={handleSubmit(this.onSubmit)}>
              <div className="form-row mt-5">
                <div className="col-md-6 mx-auto">
                  <Field
                    component={this.renderField}
                    icon="envelope-o"
                    id="email"
                    label="Email Address:"
                    name="email"
                    placeholder="Email Address"
                    required
                    type="email"
                    validate={this.required}
                  />
                  <Field
                    className="form-control"
                    component={this.renderField}
                    hint="A strong and unique alphanumeric password recommended."
                    icon="key"
                    id="password"
                    label="Password:"
                    name="password"
                    placeholder="Password"
                    required
                    type="password"
                    validate={this.required}
                  />
                  <Field
                    component={this.renderRecaptcha}
                    name="recaptcha"
                    validate={this.required}
                  />
                  <div className="d-flex justify-content-center">
                    <button
                      className="btn btn-outline-primary"
                      disabled={invalid || pristine || submitting}
                      type="submit"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    );
  }
}

export default reduxForm({
  form: 'registerForm'
})(
  connect(
    null,
    { register }
  )(withRouter(Register))
);
