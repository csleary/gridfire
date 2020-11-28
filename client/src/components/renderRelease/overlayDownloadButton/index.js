import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import styles from '../renderRelease.module.css';

const OverlayDownloadButton = props => {
  const { artistName, format, handleDownload, releaseTitle } = props;

  return (
    <button
      className={styles.button}
      format={format}
      onClick={handleDownload}
      title={`Download ${artistName} - '${releaseTitle}' (${format.toUpperCase()})`}
    >
      <FontAwesomeIcon className={styles.icon} icon={faDownload} />
      <div className={`${styles.label} text-center`}>{format.toUpperCase()}</div>
    </button>
  );
};

OverlayDownloadButton.propTypes = {
  artistName: PropTypes.string,
  format: PropTypes.string,
  handleDownload: PropTypes.func,
  releaseTitle: PropTypes.string
};

export default OverlayDownloadButton;
