import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import styles from '../renderRelease.module.css';
import { useDownload } from 'hooks/useDownload';

const OverlayDownloadButton = ({ artistName, format, releaseId, releaseTitle }) => {
  const { anchorRef, downloadUrl, handleDownload } = useDownload({
    artistName,
    format,
    releaseId,
    releaseTitle
  });

  return (
    <>
      <button
        className={styles.button}
        format={format}
        onClick={handleDownload}
        title={`Download ${artistName} - '${releaseTitle}' (${format.toUpperCase()})`}
      >
        <FontAwesomeIcon className={styles.icon} icon={faDownload} />
        <div className={`${styles.label} text-center`}>{format.toUpperCase()}</div>
      </button>
      <a download href={downloadUrl} ref={ref => (anchorRef.current = ref)} style={{ display: 'none' }}>
        Download
      </a>
    </>
  );
};

OverlayDownloadButton.propTypes = {
  artistName: PropTypes.string,
  format: PropTypes.string,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string
};

export default OverlayDownloadButton;
