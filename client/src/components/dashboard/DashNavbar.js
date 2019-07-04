import React from 'react';
import { connect } from 'react-redux';
import { NavLink, withRouter } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';

function DashNavbar(props) {
  const { user } = props;

  const showPasswordChange = () => {
    if (!user.auth) return false;

    if (user.auth.isLocal || !user.auth.googleId) {
      return (
        <li className="nav-item">
          <NavLink
            strict
            exact
            to={'/dashboard/password-update'}
            className="nav-link"
          >
            <FontAwesome name="key" className="mr-1" />
            <span className="nav-label">Password</span>
          </NavLink>
        </li>
      );
    }
  };

  return (
    <nav className="navbar navbar-expand-lg sub-menu">
      <ul className="navbar-nav mx-auto">
        <li className="nav-item">
          <NavLink strict exact to={'/dashboard'} className="nav-link">
            <FontAwesome name="headphones" className="mr-1" />
            <span className="nav-label">Releases</span>
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            strict
            exact
            to={'/dashboard/collection'}
            className="nav-link"
          >
            <FontAwesome name="archive" className="mr-1" />
            <span className="nav-label">My Collection</span>
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
          <NavLink
            strict
            exact
            to={'/dashboard/nem-address'}
            className="nav-link"
          >
            <FontAwesome
              name={user.nemAddress ? 'check-circle' : 'exclamation-circle'}
              className={`mr-1 ${!user.nemAddress && 'no-address'}`}
            />
            <span className="nav-label">Payment</span>
          </NavLink>
        </li>
        {showPasswordChange()}
      </ul>
    </nav>
  );
}

function mapStateToProps(state) {
  return {
    user: state.user
  };
}

export default withRouter(connect(mapStateToProps)(DashNavbar));
