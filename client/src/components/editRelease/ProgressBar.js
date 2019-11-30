import PropTypes from 'prop-types';
import React from 'react';
import styles from 'style/ProgressBar.module.css';

const ProgressBar = ({ percentComplete, willDisplay }) => {
  if (willDisplay) {
    return (
      <div
        className={styles.progressBar}
        style={{
          width: `${percentComplete}%`
        }}
      />
    );
  }
  return null;
};

ProgressBar.propTypes = {
  percentComplete: PropTypes.number,
  willDisplay: PropTypes.bool
};

export default ProgressBar;
