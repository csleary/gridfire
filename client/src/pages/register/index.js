import React, { useRef, useState } from 'react';
import { batch, useDispatch } from 'react-redux';
import { toastError, toastSuccess } from 'features/toast';
import Button from 'components/button';
import { Helmet } from 'react-helmet';
import Input from 'components/input';
import Recaptcha from 'components/recaptcha';
import axios from 'axios';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { fetchUser } from 'features/user';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const captchaRef = useRef();
  const [errors, setErrors] = useState({});
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState({});
  const hasErrors = Object.values(errors).some(error => Boolean(error));

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
      const res = await axios.post('/api/auth/register', values);
      batch(() => {
        dispatch(toastSuccess(res.data.success));
        dispatch(fetchUser()).then(() => navigate('/'));
      });
      setValues({});
    } catch (error) {
      dispatch(toastError(error.message.toString() || error.response?.data.error));
      setValues(prev => ({ email: prev.email }));
    } finally {
      setIsSubmitting(false);
      captchaRef.current.reset();
    }
  };

  return (
    <main className="container">
      <Helmet>
        <title>Register</title>
        <meta name="description" content="Sign up for a nemp3 account." />
      </Helmet>
      <div className="row">
        <div className="col py-3 mb-4">
          <h2 className="text-center mt-4">Register</h2>
          <form className="form-row mt-5" onSubmit={handleSubmit}>
            <div className="col-md-6 mx-auto">
              <Input
                error={errors.email}
                icon={faEnvelope}
                label="Email Address:"
                name="email"
                onChange={handleChange}
                placeholder="Email Address"
                required
                type="email"
                value={values.email || ''}
              />
              <Input
                error={errors.password}
                hint="A strong and unique alphanumeric password recommended."
                icon={faKey}
                label="Password:"
                name="password"
                onChange={handleChange}
                placeholder="Password"
                required
                type="password"
                value={values.password || ''}
              />
              <Recaptcha
                error={errors.recaptcha}
                onChange={handleChange}
                onError={error => setErrors(prev => ({ ...prev, recaptcha: String(error) }))}
                captchaRef={captchaRef}
              />
              <div className="d-flex justify-content-end">
                <Button className="my-3" type="submit" disabled={hasErrors || isPristine || isSubmitting}>
                  Sign Up
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

const validate = ({ email, password, recaptcha }) => {
  const errors = {};
  if (!email) errors.email = 'Please enter your email address.';
  if (!password) errors.password = 'Please enter your password.';
  if (!recaptcha) errors.recaptcha = 'Please complete the recaptcha.';
  return errors;
};

export default Register;
