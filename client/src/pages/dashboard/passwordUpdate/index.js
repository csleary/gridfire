import React, { useState } from 'react';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { faCheckCircle, faKey } from '@fortawesome/free-solid-svg-icons';
import { toastError, toastSuccess } from 'features/toast';
import Button from 'components/button';
import Input from 'components/input';
import axios from 'axios';
import { fetchUser } from 'features/user';
import { useHistory } from 'react-router-dom';

const PasswordUpdate = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { email } = useSelector(state => state.user.auth, shallowEqual);
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
      const res = await axios.post('/api/auth/update', { email, ...values });
      batch(() => {
        dispatch(toastSuccess(res.data.success));
        dispatch(fetchUser()).then(() => history.push('/dashboard'));
      });
      setValues({});
    } catch (error) {
      dispatch(toastError(error.response.data.error.message || error.message.toString()));
      setIsSubmitting(false);
      setValues({});
    }
  };

  return (
    <main className="container">
      <div className="row">
        <div className="col mb-5 py-3">
          <h3 className="text-center mt-4">Update Password</h3>
          <p className="text-center">
            You can update your password using the form below (unless you&rsquo;ve logged-in with a Google account).
          </p>
          <form className="my-5" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="col-md-6 mx-auto">
                <Input
                  error={errors.password}
                  icon={faKey}
                  label="Current Password:"
                  name="password"
                  onChange={handleChange}
                  placeholder="Current Password"
                  required
                  type="password"
                  value={values.password || ''}
                />
                <Input
                  error={errors.passwordNew}
                  icon={faCheckCircle}
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
                <div className="d-flex justify-content-end mt-4">
                  <Button type="submit" disabled={hasErrors || isPristine || isSubmitting}>
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

const validate = ({ password, passwordNew, passwordConfirm }) => {
  const errors = {};
  if (!password) errors.password = 'Please enter your current password.';
  if (!passwordNew) errors.passwordNew = 'Please enter your new password.';
  if (!passwordConfirm) errors.passwordConfirm = 'Please confirm your new password.';

  if (passwordNew !== passwordConfirm) {
    errors.passwordConfirm = 'The passwords entered do not match. Please double-check them.';
  }

  return errors;
};

export default PasswordUpdate;
