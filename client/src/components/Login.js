import { Field, reduxForm } from 'redux-form';
import { Link, withRouter } from 'react-router-dom';
import React, { useEffect } from 'react';
import { fetchUser, toastError, toastSuccess } from '../actions';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import axios from 'axios';
import { connect } from 'react-redux';
import styles from 'style/Login.module.css';

const renderField = field => {
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
        <FontAwesome name={icon} className="red mr-2" />
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
      {touched && error && <div className="invalid-feedback">{error}</div>}
      {hint && <small className="form-text text-muted">{hint}</small>}
    </div>
  );
};

const Login = props => {
  const {
    handleSubmit,
    pristine,
    submitting,
    history,
    invalid,
    user: { auth }
  } = props;

  useEffect(() => {
    if (auth && auth.email.length) {
      if (history.location.state) {
        history.push(history.location.state.from.pathname);
      } else {
        history.push('/');
      }
    }
  }, [auth, history]);

  const onSubmit = values => {
    login(values, () => {
      props.fetchUser().then(() => {
        props.reset();
      });
    });
  };

  const login = async (values, callback) => {
    try {
      const res = await axios.post('/api/auth/login', values);
      props.toastSuccess(res.data.success);
      callback();
    } catch (e) {
      props.toastError(e.response.data.error);
    }
  };

  return (
    <main className="container">
      <div className="row">
        <div className="col py-3">
          <h2 className="text-center mt-4">Log In</h2>
        </div>
      </div>
      <div className="row">
        <div className="col-md mb-5">
          <p>
            If you already have a nemp3 account, please log in using the form
            below.
          </p>
          <form className="mb-5" onSubmit={handleSubmit(onSubmit)}>
            <Field
              className="form-control"
              component={renderField}
              icon="envelope-o"
              id="email"
              label="Email Address:"
              name="email"
              placeholder="Email Address"
              required
              type="email"
              validate={required}
            />
            <Field
              className="form-control"
              component={renderField}
              icon="key"
              id="password"
              label="Password:"
              name="password"
              placeholder="Password"
              required
              type="password"
              validate={required}
            />
            <div className="d-flex justify-content-center">
              <button
                className="btn btn-outline-primary mt-4"
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
          <p>
            If you&rsquo;ve forgotten your password, please{' '}
            <Link to={'/reset'}>reset it here</Link>.
          </p>
        </div>
        <div className={`${styles.divider} p-5 mb-5`}>Or</div>
        <div className="col-md d-flex align-items-center justify-content-center mb-5">
          <p>
            <FontAwesome name="google" className="mr-2" />
            <a href="api/auth/google/">Log in with your Google credentials</a>.
          </p>
        </div>
      </div>
    </main>
  );
};

Login.propTypes = {
  fetchUser: PropTypes.func,
  handleSubmit: PropTypes.func,
  history: PropTypes.object,
  invalid: PropTypes.bool,
  pristine: PropTypes.bool,
  reset: PropTypes.func,
  submitting: PropTypes.bool,
  toastError: PropTypes.func,
  toastSuccess: PropTypes.func,
  user: PropTypes.object
};

const required = value => (value ? undefined : 'Please enter a value.');

const mapStateToProps = state => ({
  user: state.user
});

export default reduxForm({
  form: 'loginForm'
})(
  connect(
    mapStateToProps,
    { fetchUser, toastError, toastSuccess }
  )(withRouter(Login))
);
