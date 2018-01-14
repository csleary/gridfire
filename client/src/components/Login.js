import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import { Field, reduxForm } from 'redux-form';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { login } from '../actions';

class Login extends Component {
  componentDidMount() {
    if (this.props.user.email && this.props.user.email.length) {
      this.props.history.push('/');
    }
  }

  onSubmit = values => {
    this.props.login(values, () => {
      this.props.reset();
      this.props.history.push('/');
    });
  };

  required = value => (value ? undefined : 'Please enter a value.');

  renderField = field => {
    const {
      hint,
      icon,
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
        <label htmlFor={name}>
          <FontAwesome name={icon} className="icon-left" />
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
            <h2 className="text-center">Log In</h2>
          </div>
        </div>
        <div className="row">
          <div className="col-xl">
            <p>
              If you already have an account with us, please log in with the
              form below.
            </p>
            <form onSubmit={handleSubmit(this.onSubmit)}>
              <Field
                className="form-control"
                component={this.renderField}
                icon="envelope-o"
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
                icon="key"
                label="Password:"
                name="password"
                placeholder="Password"
                required
                type="password"
                validate={this.required}
              />
              <div className="d-flex justify-content-center">
                <button
                  className="btn btn-outline-primary"
                  disabled={invalid || pristine || submitting}
                  type="submit"
                >
                  Log In
                </button>
              </div>
            </form>
            <p>
              Don&rsquo;t have an account? Please{' '}
              <Link to={'/register'}>sign up here</Link>.
            </p>
          </div>
          <div className="col-xl">
            <p>
              <FontAwesome name="google" className="icon-left" />
              You can also{' '}
              <a href="auth/google/">log in with your Google credentials</a>.
            </p>
          </div>
        </div>
      </main>
    );
  }
}

const mapStateToProps = state => ({
  user: state.user
});

export default reduxForm({
  form: 'loginForm'
})(connect(mapStateToProps, { login })(withRouter(Login)));
