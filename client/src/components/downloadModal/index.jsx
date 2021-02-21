import Button from 'components/button';
import { CLOUD_URL } from 'index';
import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import { faCloudDownloadAlt } from '@fortawesome/free-solid-svg-icons';
import placeholder from 'placeholder.svg';
import styles from './downloadModal.module.css';
import { useDownload } from 'hooks/useDownload';

const DownloadModal = ({ artistName, releaseId, releaseTitle }) => {
  const { anchorRef, downloadUrl, handleDownload, isPreparingDownload } = useDownload({
    artistName,
    releaseId,
    releaseTitle
  });

  return (
    <div className={classnames(styles.root, 'container-lg')}>
      <h2 className={styles.heading}>Download &lsquo;{releaseTitle}&rsquo;</h2>

      <div className={styles.card}>
        <div className={styles.wrapper}>
          <div className={styles.image}>
            <img alt={`${artistName} - ${releaseTitle}`} className={`${styles.placeholder}`} src={placeholder} />
            <img
              alt={`${artistName} - ${releaseTitle}`}
              className="lazyload"
              data-sizes="auto"
              data-src={`${CLOUD_URL}/${releaseId}.jpg`}
            />
          </div>
        </div>
        <div className={styles.buttons}>
          <Button className={styles.button} icon={faCloudDownloadAlt} onClick={() => handleDownload('mp3')}>
            Download MP3
          </Button>
          <Button className={styles.button} icon={faCloudDownloadAlt} onClick={() => handleDownload('flac')}>
            Download FLAC
          </Button>
        </div>
      </div>
      {isPreparingDownload ? (
        <p>We are building your chosen format. Please stand by.</p>
      ) : (
        <p>Depending on your chosen format there might be some processing time before your download begins.</p>
      )}
      <a download href={downloadUrl} ref={ref => (anchorRef.current = ref)} style={{ display: 'none' }}>
        Download
      </a>
    </div>
  );
};

DownloadModal.propTypes = {
  artistName: PropTypes.string,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string
};

export default DownloadModal;
