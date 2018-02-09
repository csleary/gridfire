import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NavLink, Route, Switch, withRouter } from 'react-router-dom';
import { reduxForm } from 'redux-form';
import {
  deleteRelease,
  fetchUserReleases,
  publishStatus,
  toastMessage
} from '../actions';
import NemAddress from './dashboard/NemAddress';
import PasswordUpdate from './dashboard/PasswordUpdate';
import UserReleases from './dashboard/UserReleases';
import '../style/dashboard.css';

class Dashboard extends Component {
  componentDidMount() {
    window.scrollTo(0, 0);
    this.props.fetchUserReleases();
  }

  renderPasswordChange() {
    if (
      this.props.user &&
      !this.props.user.auth.googleId &&
      this.props.user.auth.email
    ) {
      return (
        <li className="nav-item">
          <NavLink to={'/dashboard/password-update'} className="nav-link">
            Password
          </NavLink>
        </li>
      );
    }
  }

  render() {
    return (
      <div>
        <nav className="navbar navbar-expand-lg sub-menu">
          <ul className="navbar-nav mx-auto">
            <li className="nav-item">
              <NavLink exact to={'/dashboard'} className="nav-link">
                Releases
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to={'/dashboard/nem-address'} className="nav-link">
                Payment
              </NavLink>
            </li>
            {this.renderPasswordChange()}
          </ul>
        </nav>
        <Switch>
          <Route path="/dashboard/nem-address" component={NemAddress} />
          <Route path="/dashboard/password-update" component={PasswordUpdate} />
          <Route
            path="/dashboard"
            render={() => (
              <UserReleases
                deleteRelease={this.props.deleteRelease}
                history={this.props.history}
                isLoadingUserReleases={this.props.isLoadingUserReleases}
                publishStatus={this.props.publishStatus}
                toastMessage={this.props.toastMessage}
                userReleases={this.props.userReleases}
              />
            )}
          />
        </Switch>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    isLoadingUserReleases: state.releases.isLoading,
    userReleases: state.releases.userReleases,
    user: state.user
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
