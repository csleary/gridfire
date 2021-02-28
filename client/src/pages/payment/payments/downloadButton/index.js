import { faCloudDownloadAlt, faCog, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { shallowEqual, useSelector } from 'react-redux';
import Button from 'components/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import React from 'react';
import styles from './downloadButton.module.css';
import { useDownload } from 'hooks/useDownload';

const DownloadButton = () => {
  const { hasPurchased, release } = useSelector(state => state.payment, shallowEqual);
  const { _id: releaseId, artistName, releaseTitle } = release;

  const { anchorRef, downloadUrl, formatExists, handleDownload, isPreparingDownload } = useDownload({
    artistName,
    format: 'mp3',
    releaseId,
    releaseTitle
  });

  if (!hasPurchased) return null;

  return (
    <div className={styles.download}>
      <Button
        className={styles.button}
        disabled={isPreparingDownload === true}
        icon={isPreparingDownload ? faCog : faCloudDownloadAlt}
        onClick={() => handleDownload()}
        spin={isPreparingDownload}
      >
        {isPreparingDownload ? 'Preparing download…' : 'Download (mp3)'}
      </Button>
      <p className="text-center">
        <span className={styles.title}>{releaseTitle}</span> has been added to{' '}
        <Link to={'/dashboard/collection'}>your collection</Link>.
      </p>
      {isPreparingDownload && !formatExists ? (
        <>
          <p className={styles.note}>
            <FontAwesomeIcon icon={faInfoCircle} className="cyan mr-2" />
            This can take a little while if we don&rsquo;t have your chosen format cached, as we&rsquo;ll freshly
            transcode the release from source, before building your archive.
          </p>
          <p>
            A download prompt will pop up when it&rsquo;s ready. You&rsquo;re welcome to continue browsing around the
            site while you wait.
          </p>
        </>
      ) : null}
      <a download href={downloadUrl} ref={ref => (anchorRef.current = ref)} style={{ display: 'none' }}>
        Download
      </a>
    </div>
  );
};

export default DownloadButton;
