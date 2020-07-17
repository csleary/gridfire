import { Field, reduxForm } from 'redux-form';
import { connect, shallowEqual, useSelector } from 'react-redux';
import { toastError, toastSuccess } from 'features/toast';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import axios from 'axios';

const renderField = field => {
  const {
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
      <div className="invalid-feedback">{touched && error && error}</div>
    </div>
  );
};

export const passwordUpdate = values => async dispatch => {
  try {
    const res = await axios.post('/api/auth/update', values);
    toastSuccess(res.data.success)(dispatch);
  } catch (e) {
    toastError(e.response.data.error)(dispatch);
  }
};

function PasswordUpdate(props) {
  const { handleSubmit, reset, pristine, submitting, invalid } = props;
  const { auth } = useSelector(state => state.user, shallowEqual);

  const onSubmit = async values => {
    await passwordUpdate({ email: auth.email, ...values });
    reset();
  };

  return (
    <main className="container">
      <div className="row">
        <div className="col mb-5 py-3">
          <h3 className="text-center mt-4">Update Password</h3>
          <p className="text-center">
            You can update your password using the form below (unless you&rsquo;ve logged-in with a Google account).
          </p>
          <form className="my-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="col-md-6 mx-auto">
                <Field
                  component={renderField}
                  icon="key"
                  id="password"
                  label="Current Password:"
                  name="password"
                  placeholder="Current Password"
                  required
                  type="password"
                  validate={required}
                />
                <Field
                  component={renderField}
                  icon="check-circle-o"
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
                  icon="check-circle"
                  label="Confirm New Password:"
                  name="passwordConfirm"
                  placeholder="New Password"
                  required
                  type="password"
                  validate={[required, isMatched]}
                />
                <div className="d-flex justify-content-end mt-4">
                  <button
                    className="btn btn-outline-primary btn-lg"
                    disabled={invalid || pristine || submitting}
                    type="submit"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

PasswordUpdate.propTypes = {
  handleSubmit: PropTypes.func,
  reset: PropTypes.func,
  pristine: PropTypes.bool,
  submitting: PropTypes.bool,
  invalid: PropTypes.bool
};

const required = value => (value ? undefined : 'Please enter a value.');

const isMatched = (value, allValues) => {
  if (value === allValues.passwordNew) {
    return undefined;
  }
  return 'The passwords entered do not match. Please double-check them.';
};

export default reduxForm({ form: 'loginForm' })(connect(PasswordUpdate));
