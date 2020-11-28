import { faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import styles from '../userRelease.module.css';

const StatusIcon = ({ published, releaseTitle }) => {
  if (published) {
    return (
      <div className={`${styles.status} d-flex align-items-center justify-content-center`}>
        <FontAwesomeIcon
          icon={faCheckCircle}
          className={`${styles.icon} cyan`}
          title={`'${releaseTitle}' is live and available for purchase.`}
        />
      </div>
    );
  }
  return (
    <div className={`${styles.status} d-flex align-items-center justify-content-center`}>
      <FontAwesomeIcon
        icon={faExclamationCircle}
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
