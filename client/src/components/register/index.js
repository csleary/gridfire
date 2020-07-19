import { Field, reduxForm } from 'redux-form';
import React, { useRef } from 'react';
import { toastError, toastSuccess } from 'features/toast';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import RenderRecaptcha from 'components/renderRecaptcha';
import axios from 'axios';
import { fetchUser } from 'features/user';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

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

const Register = ({ handleSubmit, pristine, reset, submitting, invalid }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const captchaRef = useRef();

  const onSubmit = async values => {
    try {
      const res = await axios.post('/api/auth/register', values);
      dispatch(toastSuccess(res.data.success));
      reset();
      captchaRef.current.getRenderedComponent().reset();
      await dispatch(fetchUser());
      history.push('/');
    } catch (error) {
      dispatch(toastError(error.message.toString() || error.response?.data.error));
      captchaRef.current.getRenderedComponent().reset();
    }
  };

  return (
    <main className="container">
      <div className="row">
        <div className="col py-3 mb-4">
          <h2 className="text-center mt-4">Register</h2>
          <form className="form-row mt-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="col-md-6 mx-auto">
              <Field
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
                hint="A strong and unique alphanumeric password recommended."
                icon="key"
                id="password"
                label="Password:"
                name="password"
                placeholder="Password"
                required
                type="password"
                validate={required}
              />
              <Field
                classNames="justify-content-end"
                component={RenderRecaptcha}
                forwardRef
                name="recaptcha"
                ref={el => {
                  captchaRef.current = el;
                }}
                validate={required}
              />
              <div className="d-flex justify-content-end">
                <button
                  className="btn btn-outline-primary my-3"
                  disabled={invalid || pristine || submitting}
                  type="submit"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

Register.propTypes = {
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

export default reduxForm({ form: 'registerForm' })(Register);
