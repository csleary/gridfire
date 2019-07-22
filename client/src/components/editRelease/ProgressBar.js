import React from 'react';
import styles from '../../style/ProgressBar.module.css';

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

export default ProgressBar;
