import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import FontAwesome from 'react-fontawesome';
import Recaptcha from 'react-google-recaptcha';
import axios from 'axios';

const sitekey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

class ForgotPassword extends Component {
  state = {
    response: null
  };

  onSubmit = values =>
    new Promise(async resolve => {
      try {
        const res = await axios.post('/api/auth/reset', values);
        this.setState({ response: res.data });
      } catch (e) {
        this.setState({ response: e.response.data });
      }
      this.props.reset();
      resolve();
    });

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
    const { response } = this.state;
    const className =
      response && response.error ? 'alert-danger' : 'alert-success';
    const { handleSubmit, pristine, submitting, invalid } = this.props;

    return (
      <main className="container">
        <div className="row">
          <div className="col">
            <h2 className="text-center mt-4">Reset Password</h2>
            <p className="text-center">
              Please enter your account email address below and submit to
              receive a password reset link, valid for an hour.
            </p>
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
                  {response && (
                    <div
                      className={`alert ${className} text-center`}
                      role="alert"
                    >
                      {response.success && (
                        <FontAwesome name="thumbs-up" className="icon-left" />
                      )}
                      {response.error && (
                        <FontAwesome name="bomb" className="icon-left" />
                      )}
                      {response.success || response.error}
                    </div>
                  )}
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
                      Send Reset Email
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
  form: 'forgotPasswordForm'
})(ForgotPassword);
