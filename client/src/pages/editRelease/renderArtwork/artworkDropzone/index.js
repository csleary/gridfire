import { faThumbsUp, faTimesCircle } from '@fortawesome/free-regular-svg-icons';
import { shallowEqual, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ProgressBar from '../../progressBar';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import styles from './artworkDropzone.module.css';
import { useDropzone } from 'react-dropzone';

const RenderStatus = ({ children }) => <p className="status">{children}</p>;

const Status = ({ acceptedFiles, artworkUploading, artworkUploadProgress, isDragActive, isDragReject }) => {
  if (artworkUploading) {
    return (
      <>
        <FontAwesomeIcon icon={faUpload} className="mr-2" />
        Uploading &lsquo;{acceptedFiles[0]?.path}&rsquo;: {artworkUploadProgress}%
      </>
    );
  }

  if (isDragReject) {
    return (
      <>
        <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
        Sorry, we don&lsquo;t accept that file type. Please ensure it is a png or jpg image file.
      </>
    );
  }

  if (isDragActive) {
    return (
      <>
        <FontAwesomeIcon icon={faThumbsUp} className="mr-2" />
        Drop to upload!
      </>
    );
  }

  return (
    <>
      <FontAwesomeIcon icon={faUpload} className="mr-2" />
      Drop artwork here, or click to select. Must be under 10MB in size and have a minimum dimension of 1000px (will be
      resized and cropped square).
    </>
  );
};

const ArtworkDropzone = props => {
  const { onDrop } = props;
  const { artworkUploading, artworkUploadProgress } = useSelector(state => state.artwork, shallowEqual);

  const { acceptedFiles, getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: 'image/png, image/jpeg',
    disabled: artworkUploading,
    maxSize: 1024 * 1024 * 20,
    multiple: false,
    noDragEventsBubbling: true,
    noKeyboard: true,
    onDrop
  });

  const dropzoneClassNames = classNames(styles.dropzone, {
    [styles.uploading]: artworkUploading,
    [styles.active]: isDragActive && !isDragReject,
    [styles.disabled]: artworkUploading,
    [styles.rejected]: isDragReject
  });

  return (
    <div
      {...getRootProps({
        className: dropzoneClassNames
      })}
    >
      <input {...getInputProps()} />
      <RenderStatus
        acceptedFiles={acceptedFiles}
        artworkUploading={artworkUploading}
        artworkUploadProgress={artworkUploadProgress}
        isDragActive={isDragActive}
        isDragReject={isDragReject}
      >
        <Status />
      </RenderStatus>
      <ProgressBar percentComplete={artworkUploadProgress} willDisplay={artworkUploading} />
    </div>
  );
};

ArtworkDropzone.propTypes = {
  artworkUploading: PropTypes.bool,
  children: PropTypes.node,
  onDrop: PropTypes.func,
  percentComplete: PropTypes.number
};

RenderStatus.propTypes = {
  children: PropTypes.node
};

Status.propTypes = {
  acceptedFiles: PropTypes.array,
  artworkUploading: PropTypes.bool,
  artworkUploadProgress: PropTypes.number,
  isDragActive: PropTypes.bool,
  isDragReject: PropTypes.bool,
  onDrop: PropTypes.func,
  percentComplete: PropTypes.number
};

export default ArtworkDropzone;
