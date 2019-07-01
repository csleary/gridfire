import React, { Fragment } from 'react';
import FontAwesome from 'react-fontawesome';

const AudioDropzoneLabel = props => {
  const {
    hasAudio,
    isDragActive,
    isDragReject,
    isEncoding,
    isTranscoding,
    isUploading,
    audioUploadProgress
  } = props;

  if (isDragReject && !isUploading) {
    return (
      <Fragment>
        <FontAwesome name="times-circle" className="mr-2" />
        File not accepted!
      </Fragment>
    );
  }

  if (isDragActive && !isUploading) {
    return (
      <Fragment>
        <FontAwesome name="thumbs-o-up" className="mr-2" />
        Drop it in!
      </Fragment>
    );
  }

  if (isUploading) {
    return (
      <Fragment>
        <FontAwesome name="cog" spin className="mr-2" />
        {audioUploadProgress.toString(10).padStart(2, '0')}%
      </Fragment>
    );
  }

  if (isEncoding) {
    return (
      <Fragment>
        <FontAwesome name="cog" spin className="mr-2" />
        Encoding
      </Fragment>
    );
  }

  if (isTranscoding) {
    return (
      <Fragment>
        <FontAwesome name="cog" spin className="mr-2" />
        Transcoding
      </Fragment>
    );
  }

  if (hasAudio) {
    return (
      <Fragment>
        <FontAwesome name="refresh" className="mr-2" />
        Replace Audio
      </Fragment>
    );
  }

  return (
    <Fragment>
      <FontAwesome name="plus-circle" className="mr-2" />
      Add Audio
    </Fragment>
  );
};

export default AudioDropzoneLabel;
