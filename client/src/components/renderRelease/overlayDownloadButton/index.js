import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import styles from 'components/renderRelease/renderRelease.module.css';

const OverlayDownloadButton = props => {
  const { artistName, format, handleDownload, releaseTitle } = props;

  return (
    <button
      className={styles.button}
      format={format}
      onClick={handleDownload}
      title={`Download ${artistName} - '${releaseTitle}' (${format.toUpperCase()})`}
    >
      <FontAwesome className={styles.icon} name="download" />
      <div className={`${styles.label} text-center`}>
        {format.toUpperCase()}
      </div>
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
