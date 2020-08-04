import { Field, reduxForm } from 'redux-form';
import React, { useEffect, useState } from 'react';
import { batch, useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import Button from 'components/button';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import Spinner from 'components/spinner';
import axios from 'axios';
import { fetchUser } from 'features/user';
import { toastSuccess } from 'features/toast';

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
      {error ? <div className="invalid-feedback">{touched && error && error}</div> : null}
      {hint ? <small className="form-text text-muted">{hint}</small> : null}
    </div>
  );
};

const ResetPassword = ({ handleSubmit, pristine, reset, submitting, invalid }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const params = useParams();
  const { token } = params;
  const [isLoading, setIsLoading] = useState();
  const [response, setResponse] = useState();
  const className = response?.error ? 'alert-danger' : 'alert-success';

  useEffect(() => {
    if (!token) return;

    try {
      axios.get(`/api/auth/reset/${token}`).then(() => setIsLoading(false));
    } catch (error) {
      setIsLoading(false);
      setResponse(error.response.data);
    }
  }, [token]);

  const onSubmit = async values => {
    try {
      const resetReq = await axios.post(`/api/auth/reset/${token}`, values);
      const email = resetReq.data;
      const loginReq = await axios.post('/api/auth/login', { email, password: values.passwordNew });
      reset();

      batch(() => {
        dispatch(fetchUser());
        dispatch(toastSuccess(loginReq.data.success));
      });

      history.push('/');
    } catch (error) {
      reset();
      setResponse(error.response.data);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <main className="container">
      <div className="row">
        <div className="col-6 mx-auto mb-4 py-3">
          <h2 className="text-center mt-4">Reset Password</h2>
          <p>Please enter your new password here. You&rsquo;ll be logged-in afterwards automatically.</p>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Field
              component={renderField}
              icon="key"
              id="passwordNew"
              label="New Password:"
              name="passwordNew"
              placeholder="New Password"
              required
              type="password"
              validate={required}
            />
            <Field
              component={renderField}
              id="passwordConfirm"
              icon="check-circle-o"
              label="Confirm New Password:"
              name="passwordConfirm"
              placeholder="New Password"
              required
              type="password"
              validate={[required, isMatched]}
            />
            {response?.error && (
              <div className={`alert ${className} text-center`} role="alert">
                <FontAwesome name="bomb" className="mr-2" />
                {response.error}
              </div>
            )}
            <div className="d-flex justify-content-center">
              <Button className="mt-4" type="submit" disabled={invalid || pristine || submitting}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

ResetPassword.propTypes = {
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

const isMatched = (value, allValues) => {
  if (value === allValues.passwordNew) return undefined;
  return 'The passwords entered do not match. Please double-check them.';
};

export default reduxForm({ form: 'resetPasswordForm' })(ResetPassword);
