import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Field, reduxForm } from 'redux-form';
import FontAwesome from 'react-fontawesome';
import nem from 'nem-sdk';
import * as actions from '../actions';
import Spinner from './Spinner';
import UserReleases from './UserReleases';
import '../style/dashboard.css';

class Dashboard extends Component {
  componentDidMount() {
    window.scrollTo(0, 0);
    this.props.fetchUserReleases();
    this.props.initialize({
      nemAddress: nem.utils.format.address(this.props.nemAddress)
    });
  }

  onSubmit = (values) => {
    this.props
      .addNemAddress(values)
      .then(() => this.props.fetchUser())
      .then(() =>
        this.props.toastMessage({
          alertClass: 'alert-success',
          message: 'NEM payment address updated.'
        })
      );
  };

  checkNemAddress = (address) => {
    if (address && !nem.model.address.isValid(address)) {
      return (
        <div>
          <FontAwesome name="exclamation-circle" className="icon-left" />
          Does not appear to be a valid NEM address. Please double-check it!
        </div>
      );
    }
    return undefined;
  };

  renderNemAddressField = ({
    id,
    input,
    label,
    type,
    meta: { active, error, touched }
  }) => {
    const className = `form-group ${
      !active && touched && error ? 'invalid' : ''
    }`;
    return (
      <div className={className}>
        <label htmlFor={id}>{label}</label>
        <input
          {...input}
          className="form-control"
          placeholder="NEM Address (should start with an 'N')"
          type={type}
        />
        <small className="form-text text-muted">
          It doesn&rsquo;t matter whether you include dashes or not.
        </small>
        <div className="invalid-feedback">{!active && touched && error}</div>
      </div>
    );
  };

  render() {
    if (this.props.nemAddress === undefined) {
      return <Spinner />;
    }

    const { handleSubmit, pristine, submitting } = this.props;
    return (
      <div>
        <h2 className="text-center">Dashboard</h2>
        <h3>Payment Address</h3>
        <p>Please add your NEM address to receive customer payments.</p>
        <form onSubmit={handleSubmit(this.onSubmit)}>
          <Field
            disabled={submitting}
            id="nemAddress"
            label="NEM Address"
            name="nemAddress"
            type="text"
            component={this.renderNemAddressField}
            validate={this.checkNemAddress}
          />
          <div className="d-flex justify-content-end">
            <button
              type="submit"
              className="btn btn-outline-primary btn-lg"
              disabled={pristine || submitting}
            >
              Save Address
            </button>
          </div>
        </form>

        <UserReleases
          isLoadingUserReleases={this.props.isLoadingUserReleases}
          history={this.props.history}
          userReleases={this.props.userReleases}
          editRelease={this.props.editRelease}
          publishStatus={this.props.publishStatus}
          publishLoading={this.props.publishLoading}
          deleteRelease={this.props.deleteRelease}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isLoadingUserReleases: state.releases.isLoading,
    publishLoading: state.releases.publishLoading,
    nemAddress: state.user.nemAddress,
    userReleases: state.releases.userReleases
  };
}

export default reduxForm({
  form: 'DashboardForm'
})(connect(mapStateToProps, actions)(withRouter(Dashboard)));
