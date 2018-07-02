import React from 'react';
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
import Recaptcha from 'react-google-recaptcha';
import { sendEmail } from '../actions';

const sitekey =
  process.env.NODE_ENV === 'production'
    ? '6LeickAUAAAAAHTCcATYXRsubAk4Hag0tnNTVwwg'
    : '6Lc2cUAUAAAAABRMSdyEIGF9WFccUzzlq7Bi7B5h';

let captcha;

const validate = values => {
  const errors = {};
  if (!values.email) {
    errors.email = 'Please enter your email address.';
  }
  if (!values.message) {
    errors.message = 'Please enter a message.';
  }
  if (!values.recaptcha) {
    errors.recaptcha = 'Please complete the recaptcha.';
  }
  return errors;
};

const renderField = field => {
  const {
    id,
    input,
    label,
    meta: { touched, error },
    name,
    placeholder,
    required,
    rows,
    type
  } = field;

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      {type !== 'textarea' ? (
        <input
          {...input}
          className="form-control"
          name={name}
          placeholder={placeholder}
          required={required}
          type={type}
        />
      ) : (
        <textarea
          {...input}
          className="form-control"
          name={name}
          placeholder={placeholder}
          required={required}
          rows={rows}
        />
      )}
      {touched && error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

const renderRecaptcha = field => {
  const { error, input, touched } = field;

  return (
    <div className="form-group d-flex flex-wrap justify-content-end py-2">
      <Recaptcha
        onChange={response => input.onChange(response)}
        ref={el => {
          captcha = el;
        }}
        sitekey={sitekey}
      />
      {touched &&
        error && (
          <div className="invalid-feedback">{touched && error && error}</div>
        )}
    </div>
  );
};

const Contact = props => {
  const { handleSubmit, invalid, pristine, submitSucceeded } = props;
  return (
    <main className="container">
      <div className="row">
        <div className="col-6 mx-auto">
          <h2 className="text-center">Contact Us</h2>
          <form
            onSubmit={handleSubmit(values => {
              props.sendEmail(values, () => {
                props.reset();
                captcha.reset();
              });
            })}
          >
            <Field
              component={renderField}
              icon="envelope-o"
              id="email"
              label="Email Address:"
              name="email"
              placeholder="Email Address"
              type="email"
              required
            />
            <Field
              component={renderField}
              id="message"
              label="Your Message:"
              name="message"
              placeholder="Enter your message."
              rows="6"
              type="textarea"
              required
            />
            <Field component={renderRecaptcha} name="recaptcha" />
            <div className="d-flex justify-content-end">
              <button
                className="btn btn-outline-primary mt-3"
                disabled={invalid || pristine || submitSucceeded}
                type="submit"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default reduxForm({
  form: 'contactForm',
  validate
})(
  connect(
    null,
    { sendEmail }
  )(Contact)
);
