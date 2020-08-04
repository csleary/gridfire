import { Field, reduxForm } from 'redux-form';
import React, { useRef } from 'react';
import { toastError, toastSuccess } from 'features/toast';
import Button from 'components/button';
import InputField from 'components/inputField';
import PropTypes from 'prop-types';
import RenderRecaptcha from 'components/renderRecaptcha';
import axios from 'axios';
import { fetchUser } from 'features/user';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

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
                <Button className="my-3" type="submit" disabled={invalid || pristine || submitting}>
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
