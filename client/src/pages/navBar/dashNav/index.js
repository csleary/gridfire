import {
  faArchive,
  faCheckCircle,
  faExclamationCircle,
  faHeadphonesAlt,
  faHeart,
  faKey,
  faMagic
} from '@fortawesome/free-solid-svg-icons';
import { shallowEqual, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
          <FontAwesomeIcon icon={faArchive} className={styles.icon} />
          Artists
        </NavLink>
      </li>
      <li>
        <NavLink className={styles.link} strict exact to={'/dashboard'}>
          <FontAwesomeIcon icon={faHeadphonesAlt} className={styles.icon} />
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
          <FontAwesomeIcon
            icon={user.nemAddress ? faCheckCircle : faExclamationCircle}
            className={classnames(styles.icon, { [styles.error]: !user.nemAddress })}
          />
          Payment
        </NavLink>
      </li>
      {!user.auth.oauthId ? (
        <li>
          <NavLink className={styles.link} strict exact to={'/dashboard/password-update'}>
            <FontAwesomeIcon icon={faKey} className={styles.icon} />
            Password
          </NavLink>
        </li>
      ) : null}
      <li>
        <NavLink className={styles.link} strict exact to={'/dashboard/collection'}>
          <FontAwesomeIcon icon={faArchive} className={styles.icon} />
          Collection
        </NavLink>
      </li>
      <li>
        <NavLink className={styles.link} strict exact to={'/dashboard/favourites'}>
          <FontAwesomeIcon icon={faHeart} className={styles.icon} />
          Faves
        </NavLink>
      </li>
      <li>
        <NavLink className={styles.link} strict exact to={'/dashboard/wishlist'}>
          <FontAwesomeIcon icon={faMagic} className={styles.icon} />
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
