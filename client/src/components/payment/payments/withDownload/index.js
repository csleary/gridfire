import React, { useRef, useState } from 'react';
import { checkFormatMp3, fetchDownloadToken, toastInfo } from 'actions';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';

const withDownload = WrappedComponent => props => {
  const { artistName, format, releaseId, releaseTitle } = props;
  const dispatch = useDispatch();
  const downloadButtonRef = useRef();
  const [formatExists, setFormatExists] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState();
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);

  const handleDownload = async () => {
    const downloadToken = await dispatch(fetchDownloadToken(releaseId));
    if (!downloadToken) return;
    setIsPreparingDownload(true);

    dispatch(
      toastInfo(
        `Fetching download: ${artistName} - '${releaseTitle}' (${format.toUpperCase()})`
      )
    );

    switch (format) {
      case 'mp3':
        await dispatch(checkFormatMp3(downloadToken));
        setFormatExists(true);
        setIsPreparingDownload(false);
        setDownloadUrl(`/api/download/${downloadToken}`);
        break;
      default:
        setIsPreparingDownload(false);
        setDownloadUrl(`/api/download/${downloadToken}/flac`);
    }

    downloadButtonRef.current.click();
  };

  return (
    <>
      <WrappedComponent
        formatExists={formatExists}
        handleDownload={handleDownload}
        isPreparingDownload={isPreparingDownload}
        releaseTitle={releaseTitle}
        {...props}
      />
      <a
        download
        href={downloadUrl}
        ref={downloadButtonRef}
        style={{ display: 'none' }}
      >
        Download
      </a>
    </>
  );
};

withDownload.propTypes = {
  artistName: PropTypes.string,
  format: PropTypes.string,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string,
  price: PropTypes.string
};

export default withDownload;
