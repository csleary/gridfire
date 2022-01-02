import { faArchive, faHeadphonesAlt, faHeart, faMagic } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import { faEthereum } from '@fortawesome/free-brands-svg-icons';
import styles from './dashNav.module.css';

const DashNav = () => {
  return (
    <>
      <li>
        <NavLink className={styles.link} end to={'/dashboard/artists'}>
          <FontAwesomeIcon icon={faArchive} className={styles.icon} />
          Artists
        </NavLink>
      </li>
      <li>
        <NavLink className={styles.link} end to={'/dashboard'}>
          <FontAwesomeIcon icon={faHeadphonesAlt} className={styles.icon} />
          Releases
        </NavLink>
      </li>
      <li>
        <NavLink className={styles.link} end to={'/dashboard/address'}>
          <FontAwesomeIcon icon={faEthereum} className={styles.icon} />
          Payment
        </NavLink>
      </li>
      <li>
        <NavLink className={styles.link} end to={'/dashboard/collection'}>
          <FontAwesomeIcon icon={faArchive} className={styles.icon} />
          Collection
        </NavLink>
      </li>
      <li>
        <NavLink className={styles.link} end to={'/dashboard/favourites'}>
          <FontAwesomeIcon icon={faHeart} className={styles.icon} />
          Faves
        </NavLink>
      </li>
      <li>
        <NavLink className={styles.link} end to={'/dashboard/wishlist'}>
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
