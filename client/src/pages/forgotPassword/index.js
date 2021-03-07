import React, { useRef, useState } from 'react';
import { faEnvelope, faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import Button from 'components/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Helmet } from 'react-helmet';
import Input from 'components/input';
import Recaptcha from 'components/recaptcha';
import axios from 'axios';
import { faBomb } from '@fortawesome/free-solid-svg-icons';
import styles from './forgotPassword.module.css';

const ForgotPassword = () => {
  const captchaRef = useRef();
  const [errors, setErrors] = useState({});
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState({});
  const [response, setResponse] = useState();
  const className = response?.error ? 'alert-danger' : 'alert-success';
  const hasErrors = Object.values(errors).some(error => Boolean(error));

  const handleChange = e => {
    const { name, value } = e.target;
    setIsPristine(false);
    if (response) setResponse();

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
      const res = await axios.post('/api/email/reset', values);
      setResponse(res.data);
      setValues({});
    } catch (error) {
      setResponse(error.response.data);
      setValues(prev => ({ email: prev.email }));
    } finally {
      setIsSubmitting(false);
      captchaRef.current.reset();
    }
  };

  return (
    <main className="container">
      <Helmet>
        <title>Reset Password</title>
        <meta name="description" content="Forgotten your login credentials? Reset your password here." />
      </Helmet>
      <div className="row">
        <div className="col py-3 mb-4">
          <h2 className="text-center mt-4">Reset Password</h2>
          <p className="text-center">
            Please submit your email address below to receive a reset link, valid for an hour.
          </p>
          <form className="form-row mt-5" onSubmit={handleSubmit}>
            <div className="col-md-6 mx-auto">
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
              {response ? (
                <div className={`alert ${className} text-center`} role="alert">
                  {response.error ? (
                    <FontAwesomeIcon icon={faBomb} className="mr-2" />
                  ) : response.success ? (
                    <FontAwesomeIcon icon={faThumbsUp} className="mr-2" />
                  ) : null}
                  {response.error || response.success}
                </div>
              ) : null}
              <Recaptcha
                error={errors.recaptcha}
                onChange={handleChange}
                name={'recaptcha'}
                onError={error => setErrors(prev => ({ ...prev, recaptcha: String(error) }))}
                captchaRef={captchaRef}
              />
              <div className="d-flex justify-content-end">
                <Button className={styles.button} disabled={hasErrors || isPristine || isSubmitting} type="submit">
                  Send Reset Email
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

const validate = ({ email, recaptcha }) => {
  const errors = {};
  if (!email) errors.email = 'Please enter your email address.';
  if (!recaptcha) errors.recaptcha = 'Please complete the recaptcha.';
  return errors;
};

export default ForgotPassword;
