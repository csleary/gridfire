import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import { faRecordVinyl } from '@fortawesome/free-solid-svg-icons';
import styles from './recordLabel.module.css';

const RecordLabel = ({ recordLabel }) => {
  if (!recordLabel) return null;

  return (
    <h6>
      <FontAwesomeIcon className={styles.icon} icon={faRecordVinyl} />
      {recordLabel}
    </h6>
  );
};

RecordLabel.propTypes = {
  recordLabel: PropTypes.string
};

export default RecordLabel;
