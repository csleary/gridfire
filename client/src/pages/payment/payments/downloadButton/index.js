import Button from 'components/button';
import FontAwesome from 'react-fontawesome';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './downloadButton.module.css';

const DownloadButton = ({ formatExists, handleDownload, hasPurchased, isPreparingDownload, releaseTitle }) => {
  if (hasPurchased) {
    return (
      <div className={styles.download}>
        <Button
          className={styles.button}
          disabled={isPreparingDownload === true}
          icon={isPreparingDownload ? 'cog' : 'download'}
          onClick={handleDownload}
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
              <FontAwesome name="info-circle" className="cyan mr-2" />
              This can take a little while if we don&rsquo;t have your chosen format cached, as we&rsquo;ll freshly
              transcode the release from source, before building your archive.
            </p>
            <p>
              A download prompt will pop up when it&rsquo;s ready. You&rsquo;re free to continue browsing around the
              site while you wait.
            </p>
          </>
        ) : null}
      </div>
    );
  }

  return null;
};

DownloadButton.propTypes = {
  formatExists: PropTypes.bool,
  handleDownload: PropTypes.func,
  hasPurchased: PropTypes.bool,
  isPreparingDownload: PropTypes.bool,
  releaseTitle: PropTypes.string
};

export default DownloadButton;
