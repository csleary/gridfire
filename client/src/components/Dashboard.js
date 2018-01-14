import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { reduxForm } from 'redux-form';
import {
  deleteRelease,
  fetchUserReleases,
  publishStatus,
  toastMessage
} from '../actions';
import NemAddress from './NemAddress';
import PasswordUpdate from './PasswordUpdate';
import UserReleases from './UserReleases';
import '../style/dashboard.css';

class Dashboard extends Component {
  componentDidMount() {
    window.scrollTo(0, 0);
    this.props.fetchUserReleases();
  }

  render() {
    return (
      <main className="container-fluid">
        <div className="row">
          <div className="col">
            <h2 className="text-center">Dashboard</h2>
          </div>
        </div>
        <div className="row">
          <NemAddress />
          <PasswordUpdate />
        </div>
        <div className="row">
          <UserReleases
            deleteRelease={this.props.deleteRelease}
            history={this.props.history}
            isLoadingUserReleases={this.props.isLoadingUserReleases}
            publishStatus={this.props.publishStatus}
            toastMessage={this.props.toastMessage}
            userReleases={this.props.userReleases}
          />
        </div>
      </main>
    );
  }
}

function mapStateToProps(state) {
  return {
    isLoadingUserReleases: state.releases.isLoading,
    userReleases: state.releases.userReleases
  };
}

export default reduxForm({
  form: 'DashboardForm'
})(
  connect(mapStateToProps, {
    deleteRelease,
    fetchUserReleases,
    publishStatus,
    toastMessage
  })(withRouter(Dashboard))
);
