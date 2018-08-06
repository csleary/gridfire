import axios from 'axios';
import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import { Field, reduxForm } from 'redux-form';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import { fetchUser, toastError, toastSuccess } from '../actions';
import '../style/login.css';

class Login extends Component {
  componentDidMount() {
    if (this.props.user.email && this.props.user.email.length) {
      this.props.history.push('/');
    }
  }

  onSubmit = values => {
    const { location } = this.props;
    this.login(values, () => {
      this.props.fetchUser().then(() => {
        this.props.reset();
        if (location.state && location.state.from) {
          this.props.history.push(location.state.from);
        } else {
          this.props.history.push('/');
        }
      });
    });
  };

  login = async (values, callback) => {
    try {
      const res = await axios.post('/api/auth/login', values);
      this.props.toastSuccess(res.data.success);
      callback();
    } catch (e) {
      this.props.toastError(e.response.data.error);
    }
  };

  required = value => (value ? undefined : 'Please enter a value.');

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
        {touched && error && <div className="invalid-feedback">{error}</div>}
        {hint && <small className="form-text text-muted">{hint}</small>}
      </div>
    );
  };

  render() {
    const { handleSubmit, pristine, submitting, invalid } = this.props;

    return (
      <main className="container">
        <div className="row">
          <div className="col py-3">
            <h2 className="red text-center mt-4">Log In</h2>
          </div>
        </div>
        <div className="row">
          <div className="col-md mb-5">
            <p>
              If you already have an account with us, please log in with the
              form below.
            </p>
            <form className="mb-5" onSubmit={handleSubmit(this.onSubmit)}>
              <Field
                className="form-control"
                component={this.renderField}
                icon="envelope-o"
                id="email"
                label="Email Address:"
                name="email"
                placeholder="Email Address"
                required
                type="email"
                validate={this.required}
              />
              <Field
                className="form-control"
                component={this.renderField}
                icon="key"
                id="password"
                label="Password:"
                name="password"
                placeholder="Password"
                required
                type="password"
                validate={this.required}
              />
              <div className="d-flex justify-content-center">
                <button
                  className="btn btn-outline-primary mt-4"
                  disabled={invalid || pristine || submitting}
                  type="submit"
                >
                  Log In
                </button>
              </div>
            </form>
            <p>
              Don&rsquo;t have an account? Please{' '}
              <Link to={'/register'}>sign up here</Link>.
            </p>
            <p>
              If you&rsquo;ve forgotten your password, please{' '}
              <Link to={'/reset'}>reset it here</Link>.
            </p>
          </div>
          <div className="divider p-5 mb-5">Or</div>
          <div className="col-md d-flex align-items-center justify-content-center mb-5">
            <p>
              <FontAwesome name="google" className="mr-2" />
              <a href="api/auth/google/">
                Log in with your Google credentials
              </a>.
            </p>
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
  form: 'loginForm'
})(
  connect(
    mapStateToProps,
    { fetchUser, toastError, toastSuccess }
  )(withRouter(Login))
);
