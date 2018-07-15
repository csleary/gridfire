import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { NavLink, Route, Switch, withRouter } from 'react-router-dom';
import { reduxForm } from 'redux-form';
import {
  deleteRelease,
  fetchSales,
  fetchUserReleases,
  publishStatus,
  toastMessage
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
      <Fragment>
        <nav className="navbar navbar-expand-lg sub-menu">
          <ul className="navbar-nav mx-auto">
            <li className="nav-item">
              <NavLink exact to={'/dashboard'} className="nav-link">
                Releases
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink exact to={'/dashboard/collection'} className="nav-link">
                My Collection
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
          <Route path="/dashboard/collection" component={Collection} />
          <Route path="/dashboard/nem-address" component={NemAddress} />
          <Route path="/dashboard/password-update" component={PasswordUpdate} />
          <Route
            path="/dashboard"
            render={() => (
              <UserReleases
                deleteRelease={this.props.deleteRelease}
                history={this.props.history}
                isDeletingRelease={this.props.isDeletingRelease}
                isLoadingUserReleases={this.props.isLoadingUserReleases}
                publishStatus={this.props.publishStatus}
                salesData={this.props.salesData}
                toastMessage={this.props.toastMessage}
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
    isDeletingRelease: state.releases.isDeletingRelease,
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
      toastMessage
    }
  )(withRouter(Dashboard))
);
