import PropTypes from 'prop-types';
import React from 'react';
import styles from './info.module.css';

const Info = ({ info }) => {
  if (!info) return null;

  return (
    <>
      <h6 className="yellow mt-4">Info</h6>
      <p className={styles.info}>{info}</p>
    </>
  );
};

Info.propTypes = {
  info: PropTypes.string
};

export default Info;
