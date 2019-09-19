import FontAwesome from 'react-fontawesome';
import React from 'react';
import styles from '../style/RenderRelease.module.css';

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

export default OverlayDownloadButton;
