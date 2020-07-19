import { Field, reduxForm } from 'redux-form';
import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import Spinner from 'components/spinner';
import axios from 'axios';
import { connect } from 'react-redux';

class ResetPassword extends Component {
  state = {
    isLoading: true,
    response: null
  };

  componentDidMount() {
    this.checkToken();
  }

  onSubmit = values =>
    new Promise(async resolve => {
      const { token } = this.props.match.params;
      try {
        axios.post(`/api/auth/reset/${token}`, values).then(res => {
          const email = res.data;
          this.login({ email, password: values.passwordNew }, () => {
            this.props.reset();
            this.props.history.push('/');
          });
        });
      } catch (e) {
        this.setState({ response: e.response.data });
      }
      this.props.reset();
      resolve();
    });

  login = async (values, callback) => {
    try {
      const res = await axios.post('/auth/login', values);
      this.props.toastSuccess(res.data.success);
      callback();
    } catch (e) {
      this.props.toastError(e.response.data.error);
    }
  };

  checkToken = () =>
    new Promise(async resolve => {
      const { token } = this.props.match.params;
      try {
        await axios.get(`/api/auth/reset/${token}`);
        this.setState({ isLoading: false });
      } catch (e) {
        this.setState({ isLoading: false, response: e.response.data });
      }
      resolve();
    });

  required = value => (value ? undefined : 'Please enter a value.');

  isMatched = (value, allValues) => {
    if (value === allValues.passwordNew) {
      return undefined;
    }
    return 'The passwords entered do not match. Please double-check them.';
  };

  renderField = field => {
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
        {error && <div className="invalid-feedback">{touched && error && error}</div>}
        {hint && <small className="form-text text-muted">{hint}</small>}
      </div>
    );
  };

  render() {
    const { isLoading, response } = this.state;
    const className = response && response.error ? 'alert-danger' : 'alert-success';
    const { handleSubmit, pristine, submitting, invalid } = this.props;

    if (isLoading) {
      return <Spinner />;
    }

    return (
      <main className="container">
        <div className="row">
          <div className="col-6 mx-auto mb-4 py-3">
            <h2 className="text-center mt-4">Reset Password</h2>
            <p>Please enter your new password here. You&rsquo;ll be logged-in afterwards automatically.</p>
            <form onSubmit={handleSubmit(this.onSubmit)}>
              <Field
                component={this.renderField}
                icon="key"
                id="passwordNew"
                label="New Password:"
                name="passwordNew"
                placeholder="New Password"
                required
                type="password"
                validate={this.required}
              />
              <Field
                component={this.renderField}
                id="passwordConfirm"
                icon="check-circle-o"
                label="Confirm New Password:"
                name="passwordConfirm"
                placeholder="New Password"
                required
                type="password"
                validate={[this.required, this.isMatched]}
              />
              {response && response.error && (
                <div className={`alert ${className} text-center`} role="alert">
                  <FontAwesome name="bomb" className="mr-2" />
                  {response.error}
                </div>
              )}
              <div className="d-flex justify-content-center">
                <button className="btn btn-outline-primary" disabled={invalid || pristine || submitting} type="submit">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    );
  }
}

ResetPassword.propTypes = {
  handleSubmit: PropTypes.func,
  history: PropTypes.object,
  invalid: PropTypes.bool,
  match: PropTypes.object,
  pristine: PropTypes.bool,
  reset: PropTypes.func,
  toastError: PropTypes.func,
  toastSuccess: PropTypes.func,
  submitting: PropTypes.bool
};

const mapStateToProps = state => ({
  user: state.user
});

export default reduxForm({
  form: 'resetPasswordForm'
})(connect(mapStateToProps)(ResetPassword));
