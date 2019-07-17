import React from 'react';
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
import { sendEmail } from '../actions';
import RenderRecaptcha from './RenderRecaptcha';

class Contact extends React.Component {
  renderField = field => {
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
            autoFocus
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

  render() {
    const { handleSubmit, invalid, pristine, submitSucceeded } = this.props;
    const captcha = this.captcha;

    return (
      <main className="container">
        <div className="row">
          <div className="col py-3 mb-4">
            <h2 className="text-center mt-4">Contact Us</h2>
            <form
              className="form-row mt-5"
              onSubmit={handleSubmit(values => {
                this.props.sendEmail(values, () => {
                  this.props.reset();
                  captcha.getRenderedComponent().reset();
                });
              })}
            >
              <div className="col-md-6 mx-auto">
                <Field
                  component={this.renderField}
                  icon="envelope-o"
                  id="email"
                  label="Email Address:"
                  name="email"
                  placeholder="Email Address"
                  type="email"
                  required
                />
                <Field
                  component={this.renderField}
                  id="message"
                  label="Your Message:"
                  name="message"
                  placeholder="Enter your message."
                  rows="6"
                  type="textarea"
                  required
                />
                <Field
                  component={RenderRecaptcha}
                  classNames="justify-content-end"
                  forwardRef
                  name="recaptcha"
                  ref={el => {
                    this.captcha = el;
                  }}
                />
                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-outline-primary my-3"
                    disabled={invalid || pristine || submitSucceeded}
                    type="submit"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    );
  }
}

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

export default reduxForm({
  form: 'contactForm',
  validate
})(
  connect(
    null,
    { sendEmail }
  )(Contact)
);
