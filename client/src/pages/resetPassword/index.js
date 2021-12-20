import React, { useEffect, useState } from 'react';
import { batch, useDispatch } from 'react-redux';
import { faBomb, faCheckCircle, faKey } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useParams } from 'react-router-dom';
import Button from 'components/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Input from 'components/input';
import Spinner from 'components/spinner';
import axios from 'axios';
import classnames from 'classnames';
import { fetchUser } from 'features/user';
import { toastSuccess } from 'features/toast';

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const { token } = params;
  const [isLoading, setIsLoading] = useState();
  const [response, setResponse] = useState();
  const [errors, setErrors] = useState({});
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState({});
  const hasErrors = Object.values(errors).some(error => Boolean(error));

  useEffect(() => {
    if (!token) return;

    try {
      axios.get(`/api/email/reset/${token}`).then(() => setIsLoading(false));
    } catch (error) {
      setIsLoading(false);
      setResponse(error.response.data);
    }
  }, [token]);

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
      const resetReq = await axios.post(`/api/email/reset/${token}`, values);
      const email = resetReq.data;
      const loginReq = await axios.post('/api/auth/login', { email, password: values.passwordNew });
      batch(() => {
        dispatch(toastSuccess(loginReq.data.success));
        dispatch(fetchUser()).then(() => navigate('/'));
      });
    } catch (error) {
      setResponse(error.response.data);
      setValues(prev => ({ email: prev.email }));
    } finally {
      setIsSubmitting(false);
      setValues({});
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <main className="container">
      <div className="row">
        <div className="col-6 mx-auto mb-4 py-3">
          <h2 className="text-center mt-4">Reset Password</h2>
          <p>Please enter your new password here. You&rsquo;ll be logged-in afterwards automatically.</p>
          <form onSubmit={handleSubmit}>
            <Input
              error={errors.passwordNew}
              icon={faKey}
              label="New Password:"
              name="passwordNew"
              onChange={handleChange}
              placeholder="New Password"
              required
              type="password"
              value={values.passwordNew || ''}
            />
            <Input
              error={errors.passwordConfirm}
              icon={faCheckCircle}
              label="Confirm New Password:"
              name="passwordConfirm"
              onChange={handleChange}
              placeholder="New Password"
              required
              type="password"
              value={values.passwordConfirm || ''}
            />
            {response?.error && (
              <div
                className={classnames('alert', response?.error ? 'alert-danger' : 'alert-success', 'text-center')}
                role="alert"
              >
                <FontAwesomeIcon icon={faBomb} className="mr-2" />
                {response.error}
              </div>
            )}
            <div className="d-flex justify-content-center">
              <Button className="mt-4" type="submit" disabled={hasErrors || isPristine || isSubmitting}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

const validate = ({ passwordNew, passwordConfirm }) => {
  const errors = {};
  if (!passwordNew) errors.passwordNew = 'Please enter your password.';
  if (!passwordConfirm) errors.passwordConfirm = 'Please enter your password.';

  if (passwordNew !== passwordConfirm) {
    errors.passwordConfirm = 'The passwords entered do not match. Please double-check them.';
  }

  return errors;
};

export default ResetPassword;
