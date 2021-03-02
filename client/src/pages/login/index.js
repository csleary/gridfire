import { Link, useHistory } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { faGoogle, faSpotify, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toastError, toastSuccess } from 'features/toast';
import Button from 'components/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Input from 'components/input';
import axios from 'axios';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { fetchUser } from 'features/user';
import styles from './login.module.css';

const Login = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { auth } = useSelector(state => state.user, shallowEqual);
  const [errors, setErrors] = useState({});
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState({});
  const hasErrors = Object.values(errors).some(error => Boolean(error));

  useEffect(() => {
    if (auth?.email.length && history.location.state) {
      history.push(history.location.state.from.pathname);
    } else if (auth?.email.length) {
      history.push('/');
    }
  }, [auth, history]);

  const handleChange = e => {
    const { name, value } = e.target;
    setIsPristine(false);

    setErrors(prev => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }

      return prev;
    });

    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const validationErrors = validate(values);
    if (Object.values(validationErrors).some(error => Boolean(error))) return setErrors(validationErrors);
    setIsSubmitting(true);

    try {
      const res = await axios.post('/api/auth/login', values);
      batch(() => {
        dispatch(toastSuccess(res.data.success));
        dispatch(fetchUser()).then(() => setIsSubmitting(false));
      });
      setValues({});
    } catch (error) {
      dispatch(toastError(error.response.data.error));
      setIsSubmitting(false);
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
          <form className="mb-5" onSubmit={handleSubmit}>
            <Input
              error={errors.email}
              icon={faEnvelope}
              label="Email Address:"
              onChange={handleChange}
              name="email"
              placeholder="Email Address"
              required
              type="email"
              value={values.email || ''}
            />
            <Input
              error={errors.password}
              icon={faKey}
              label="Password:"
              name="password"
              onChange={handleChange}
              placeholder="Password"
              required
              type="password"
              value={values.password || ''}
            />
            <div className="d-flex justify-content-center">
              <Button className="mt-4" type="submit" disabled={hasErrors || isPristine || isSubmitting}>
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
            <FontAwesomeIcon className={styles.icon} icon={faSpotify} />
            <a href="api/auth/spotify/">Log in with Spotify</a>
          </div>
          <div className={styles.service}>
            <FontAwesomeIcon className={styles.icon} icon={faTwitter} />
            <a href="api/auth/twitter/">Log in with Twitter</a>
          </div>
          <div className={styles.service}>
            <FontAwesomeIcon className={styles.icon} icon={faGoogle} />
            <a href="api/auth/google/">Log in with Google</a>
          </div>
        </div>
      </div>
    </main>
  );
};

const validate = ({ email, password }) => {
  const errors = {};
  if (!email) errors.email = 'Please enter your email address.';
  if (!password) errors.password = 'Please enter your password.';
  return errors;
};

export default Login;
