import PropTypes from 'prop-types';
import React from 'react';
import styles from 'components/selectedRelease/selectedRelease.module.css';

const Credits = ({ credits }) => {
  if (!credits) return null;

  return (
    <>
      <h6 className="yellow mt-4">{credits && 'Credits'}</h6>
      <p className={styles.credits}>{credits}</p>
    </>
  );
};

Credits.propTypes = {
  credits: PropTypes.string
};

export default Credits;
