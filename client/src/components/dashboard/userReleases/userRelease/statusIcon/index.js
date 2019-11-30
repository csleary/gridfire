import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import styles from '../userRelease.module.css';

const StatusIcon = ({ published, releaseTitle }) => {
  if (published) {
    return (
      <div
        className={`${styles.status} d-flex align-items-center justify-content-center`}
      >
        <FontAwesome
          name="check-circle"
          className={`${styles.icon} cyan`}
          title={`'${releaseTitle}' is live and available for purchase.`}
        />
      </div>
    );
  }
  return (
    <div
      className={`${styles.status} d-flex align-items-center justify-content-center`}
    >
      <FontAwesome
        name="exclamation-circle"
        className={`${styles.icon} yellow`}
        title={`'${releaseTitle}' is currently offline.`}
      />
    </div>
  );
};

StatusIcon.propTypes = {
  published: PropTypes.bool,
  releaseTitle: PropTypes.string
};

export default StatusIcon;
