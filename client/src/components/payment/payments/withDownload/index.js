import React, { useState } from 'react';
import { checkFormatMp3, fetchDownloadToken, toastInfo } from 'actions';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

const withDownload = WrappedComponent => props => {
  const { artistName, format, releaseId, releaseTitle } = props;
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  const [formatExists, setFormatExists] = useState(false);

  const handleDownload = () => {
    props.fetchDownloadToken(releaseId, downloadToken => {
      if (downloadToken) {
        setIsPreparingDownload(true);
        props.toastInfo(
          `Fetching download: ${artistName} - '${releaseTitle}' (${format.toUpperCase()})`
        );

        switch (format) {
          case 'mp3':
            props.checkFormatMp3(downloadToken, () => {
              setFormatExists(true);
              setIsPreparingDownload(false);
              window.location = `/api/download/${downloadToken}`;
            });
            break;
          default:
            setIsPreparingDownload(false);
            window.location = `/api/download/${downloadToken}/flac`;
        }
      } else {
        setIsPreparingDownload(false);
      }
    });
  };

  return (
    <WrappedComponent
      formatExists={formatExists}
      handleDownload={handleDownload}
      isPreparingDownload={isPreparingDownload}
      releaseTitle={releaseTitle}
      {...props}
    />
  );
};

withDownload.propTypes = {
  artistName: PropTypes.string,
  checkFormatMp3: PropTypes.func,
  fetchDownloadToken: PropTypes.func,
  format: PropTypes.string,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string,
  toastInfo: PropTypes.func,
  price: PropTypes.string
};

export default compose(
  connect(null, {
    checkFormatMp3,
    fetchDownloadToken,
    toastInfo
  }),
  withDownload
);
