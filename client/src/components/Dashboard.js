import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { NavLink, Route, Switch, withRouter } from 'react-router-dom';
import { reduxForm } from 'redux-form';
import FontAwesome from 'react-fontawesome';
import {
  deleteRelease,
  fetchSales,
  fetchUserReleases,
  publishStatus,
  toastSuccess,
  toastWarning
} from '../actions';
import Collection from './dashboard/Collection';
import NemAddress from './dashboard/NemAddress';
import PasswordUpdate from './dashboard/PasswordUpdate';
import UserReleases from './dashboard/UserReleases';
import '../style/dashboard.css';

class Dashboard extends Component {
  componentDidMount() {
    window.scrollTo(0, 0);
    this.props.fetchUserReleases().then(this.props.fetchSales());
  }

  render() {
    const { user } = this.props;
    const showPasswordChange =
      user.auth.isLocal || (user && !user.auth.googleId && user.auth.email);

    return (
      <Fragment>
        <nav className="navbar navbar-expand-lg sub-menu">
          <ul className="navbar-nav mx-auto">
            <li className="nav-item">
              <NavLink exact to={'/dashboard'} className="nav-link">
                <FontAwesome name="headphones" className="mr-1" />
                Releases
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink exact to={'/dashboard/collection'} className="nav-link">
                <FontAwesome name="archive" className="mr-1" />
                My Collection
              </NavLink>
            </li>
            <li
              className="nav-item"
              title={
                user.nemAddress
                  ? 'Your NEM payment address.'
                  : "You don't currently have a NEM payment address saved."
              }
            >
              <NavLink to={'/dashboard/nem-address'} className="nav-link">
                <FontAwesome
                  name={user.nemAddress ? 'check-circle' : 'exclamation-circle'}
                  className={`mr-1 ${!user.nemAddress && 'yellow'}`}
                />
                Payment
              </NavLink>
            </li>
            {showPasswordChange && (
              <li className="nav-item">
                <NavLink to={'/dashboard/password-update'} className="nav-link">
                  <FontAwesome name="key" className="mr-1" />
                  Password
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
        <Switch>
          <Route path="/dashboard/collection" component={Collection} />
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
                salesData={this.props.salesData}
                toastSuccess={this.props.toastSuccess}
                toastWarning={this.props.toastWarning}
                userReleases={this.props.userReleases}
              />
            )}
          />
        </Switch>
      </Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    isLoadingUserReleases: state.releases.isLoading,
    salesData: state.salesData.releaseSales,
    userReleases: state.releases.userReleases,
    user: state.user
  };
}

export default reduxForm({
  form: 'DashboardForm'
})(
  connect(
    mapStateToProps,
    {
      deleteRelease,
      fetchSales,
      fetchUserReleases,
      publishStatus,
      toastSuccess,
      toastWarning
    }
  )(withRouter(Dashboard))
);
