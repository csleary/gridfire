import { faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './statusIcon.module.css';

const StatusIcon = ({ published, releaseTitle }) => {
  return (
    <div className={styles.status}>
      <FontAwesomeIcon
        icon={published ? faCheckCircle : faExclamationCircle}
        className={published ? styles.green : styles.yellow}
        title={
          published
            ? `'${releaseTitle}' is live and available for purchase.`
            : `'${releaseTitle}' is currently offline.`
        }
      />
    </div>
  );
};

StatusIcon.propTypes = {
  published: PropTypes.bool,
  releaseTitle: PropTypes.string
};

export default StatusIcon;
