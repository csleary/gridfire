import { Field, reduxForm } from 'redux-form';
import { Link, useHistory } from 'react-router-dom';
import React, { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toastError, toastSuccess } from 'features/toast';
import Button from 'components/button';
import FontAwesome from 'react-fontawesome';
import InputField from 'components/inputField';
import PropTypes from 'prop-types';
import axios from 'axios';
import { fetchUser } from 'features/user';
import styles from './login.module.css';

const Login = props => {
  const { handleSubmit, pristine, reset, submitting, invalid } = props;
  const dispatch = useDispatch();
  const history = useHistory();
  const { auth } = useSelector(state => state.user, shallowEqual);

  useEffect(() => {
    if (auth?.email.length && history.location.state) {
      history.push(history.location.state.from.pathname);
    } else if (auth?.email.length) {
      history.push('/');
    }
  }, [auth, history]);

  const onSubmit = async values => {
    try {
      const res = await axios.post('/api/auth/login', values);
      dispatch(toastSuccess(res.data.success));
      await dispatch(fetchUser());
    } catch (error) {
      dispatch(toastError(error.response.data.error));
      reset();
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
          <p>If you already have a nemp3 account, please log in using the form below.</p>
          <form className="mb-5" onSubmit={handleSubmit(onSubmit)}>
            <Field
              className="form-control"
              component={InputField}
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
              component={InputField}
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
              <Button className="mt-4" type="submit" disabled={invalid || pristine || submitting}>
                Log In
              </Button>
            </div>
          </form>
          <p>
            Don&rsquo;t have an account? Please <Link to={'/register'}>sign up here</Link>.
          </p>
          <p>
            If you&rsquo;ve forgotten your password, please <Link to={'/reset'}>reset it here</Link>.
          </p>
        </div>
        <div className={styles.divider}>Or</div>
        <div className={`${styles.oauth} col-md`}>
          <div className={styles.service}>
            <FontAwesome className={styles.icon} name="spotify" />
            <a href="api/auth/spotify/">Log in with Spotify</a>
          </div>
          <div className={styles.service}>
            <FontAwesome className={styles.icon} name="twitter" />
            <a href="api/auth/twitter/">Log in with Twitter</a>
          </div>
          <div className={styles.service}>
            <FontAwesome className={styles.icon} name="google" />
            <a href="api/auth/google/">Log in with Google</a>
          </div>
        </div>
      </div>
    </main>
  );
};

Login.propTypes = {
  handleSubmit: PropTypes.func,
  invalid: PropTypes.bool,
  pristine: PropTypes.bool,
  reset: PropTypes.func,
  submitting: PropTypes.bool
};

const required = value => {
  if (value) return;
  return 'Please enter a value.';
};

export default reduxForm({ form: 'loginForm' })(Login);
