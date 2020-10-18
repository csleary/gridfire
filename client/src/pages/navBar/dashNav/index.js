import { shallowEqual, useSelector } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import styles from './dashNav.module.css';

const DashNav = () => {
  const { user } = useSelector(state => state, shallowEqual);

  return (
    <>
      <li>
        <NavLink className={styles.link} strict exact to={'/dashboard/artists'}>
          <FontAwesome name="archive" className={styles.icon} />
          Artists
        </NavLink>
      </li>
      <li>
        <NavLink className={styles.link} strict exact to={'/dashboard'}>
          <FontAwesome name="headphones" className={styles.icon} />
          Releases
        </NavLink>
      </li>
      <li
        title={
          user.nemAddress ? 'Your NEM payment address.' : 'You don\u2019t currently have a NEM payment address saved.'
        }
      ></li>
      <li>
        <NavLink className={styles.link} strict exact to={'/dashboard/nem-address'}>
          <FontAwesome
            name={user.nemAddress ? 'check-circle' : 'exclamation-circle'}
            className={classnames(styles.icon, { [styles.error]: !user.nemAddress })}
          />
          Payment
        </NavLink>
      </li>
      {user.auth.isLocal ? (
        <li>
          <NavLink className={styles.link} strict exact to={'/dashboard/password-update'}>
            <FontAwesome name="key" className={styles.icon} />
            Password
          </NavLink>
        </li>
      ) : null}
      <li>
        <NavLink className={styles.link} strict exact to={'/dashboard/collection'}>
          <FontAwesome name="archive" className={styles.icon} />
          Collection
        </NavLink>
      </li>
      <li>
        <NavLink className={styles.link} strict exact to={'/dashboard/favourites'}>
          <FontAwesome name="heart" className={styles.icon} />
          Faves
        </NavLink>
      </li>
      <li>
        <NavLink className={styles.link} strict exact to={'/dashboard/wish-list'}>
          <FontAwesome name="magic" className={styles.icon} />
          List
        </NavLink>
      </li>
    </>
  );
};

DashNav.propTypes = {
  user: PropTypes.object
};

export default DashNav;
