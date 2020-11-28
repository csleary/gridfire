import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import styles from './info.module.css';

const Info = ({ info }) => {
  if (!info) return null;

  return (
    <>
      <FontAwesomeIcon className={styles.icon} icon={faInfoCircle} />
      <p className={styles.info}>{info}</p>
    </>
  );
};

Info.propTypes = {
  info: PropTypes.string
};

export default Info;
