import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
import FontAwesome from 'react-fontawesome';
import axios from 'axios';
import { login } from '../actions';
import Spinner from './Spinner';

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
          this.props.login({ email, password: values.passwordNew }, () => {
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
          <FontAwesome name={icon} className="red icon-left" />
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
        {error && (
          <div className="invalid-feedback">{touched && error && error}</div>
        )}
        {hint && <small className="form-text text-muted">{hint}</small>}
      </div>
    );
  };

  render() {
    const { isLoading, response } = this.state;
    const className =
      response && response.error ? 'alert-danger' : 'alert-success';
    const { handleSubmit, pristine, submitting, invalid } = this.props;

    if (isLoading) {
      return <Spinner />;
    }

    return (
      <main className="container">
        <div className="row">
          <div className="col-6 mx-auto">
            <h2 className="text-center">Reset Password</h2>
            <p>
              Please enter your new password here. You&rsquo;ll be logged-in
              afterwards automatically.
            </p>
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
              {response &&
                response.error && (
                  <div
                    className={`alert ${className} text-center`}
                    role="alert"
                  >
                    <FontAwesome name="bomb" className="icon-left" />
                    {response.error}
                  </div>
                )}
              <div className="d-flex justify-content-center">
                <button
                  className="btn btn-outline-primary"
                  disabled={invalid || pristine || submitting}
                  type="submit"
                >
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

const mapStateToProps = state => ({
  user: state.user
});

export default reduxForm({
  form: 'resetPasswordForm'
})(
  connect(
    mapStateToProps,
    { login }
  )(ResetPassword)
);
