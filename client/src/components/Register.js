import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import { Field, reduxForm } from 'redux-form';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Recaptcha from 'react-google-recaptcha';
import { register } from '../actions';

const sitekey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

class Register extends Component {
  componentDidMount() {}

  onSubmit = values => {
    this.props.register(values, () => {
      this.props.reset();
      this.props.history.push('/');
    });
  };

  render() {
    const { handleSubmit, pristine, submitting } = this.props;

    const recaptcha = ({ input }) => (
      <Recaptcha
        sitekey={sitekey}
        onChange={response => input.onChange(response)}
      />
    );

    return (
      <main className="container">
        <div className="row">
          <div className="col-6 mx-auto">
            <h2 className="text-center">Register</h2>
            <form onSubmit={handleSubmit(this.onSubmit)}>
              <div className="form-group">
                <label htmlFor="email">
                  <FontAwesome name="envelope-o" className="icon-left" />
                  Email Address:
                </label>
                <Field
                  className="form-control"
                  component="input"
                  name="email"
                  placeholder="Email Address"
                  required
                  type="email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">
                  <FontAwesome name="key" className="icon-left" />
                  Password:
                </label>
                <Field
                  className="form-control"
                  component="input"
                  name="password"
                  placeholder="Password"
                  required
                  type="password"
                />
                <small className="form-text text-muted">
                  A strong and unique alphanumeric password recommended.
                </small>
              </div>
              <div className="form-group d-flex justify-content-center py-2">
                <Field component={recaptcha} name="recaptcha" />
              </div>
              <div className="d-flex justify-content-center">
                <button
                  className="btn btn-outline-primary"
                  disabled={pristine || submitting}
                  type="submit"
                >
                  Sign Up
                </button>
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
})(connect(null, { register })(withRouter(Register)));
