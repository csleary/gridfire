import { NavLink, withRouter } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

function DashNavBar(props) {
  const { user } = props;

  const showPasswordChange = () => {
    if (!user.auth) return false;

    if (user.auth.isLocal) {
      return (
        <li className="nav-item">
          <NavLink strict exact to={'/dashboard/password-update'} className="nav-link">
            <FontAwesome name="key" className="mr-2" />
            Password
          </NavLink>
        </li>
      );
    }
  };

  return (
    <ul className="dash-dropdown">
      <li>
        <NavLink strict exact to={'/dashboard'} className="nav-link">
          <FontAwesome name="headphones" className="mr-2" />
          Releases
        </NavLink>
      </li>
      <li
        title={
          user.nemAddress ? 'Your NEM payment address.' : 'You don\u2019t currently have a NEM payment address saved.'
        }
      ></li>
      <li>
        <NavLink strict exact to={'/dashboard/nem-address'} className="nav-link">
          <FontAwesome
            name={user.nemAddress ? 'check-circle' : 'exclamation-circle'}
            className={`mr-2 ${!user.nemAddress && 'no-address'}`}
          />
          Payment
        </NavLink>
      </li>
      {showPasswordChange()}
      <li>
        <NavLink strict exact to={'/dashboard/collection'} className="nav-link">
          <FontAwesome name="archive" className="mr-2" />
          Collection
        </NavLink>
      </li>
      <li>
        <NavLink strict exact to={'/dashboard/favourites'} className="nav-link">
          <FontAwesome name={'heart'} className={'mr-2'} />
          Favourites
        </NavLink>
      </li>
      <li>
        <NavLink strict exact to={'/dashboard/wish-list'} className="nav-link">
          <FontAwesome name={'magic'} className={'mr-2'} />
          Wish List
        </NavLink>
      </li>
    </ul>
  );
}

function mapStateToProps(state) {
  return {
    user: state.user
  };
}

DashNavBar.propTypes = {
  user: PropTypes.object
};

export default withRouter(connect(mapStateToProps)(DashNavBar));
