import React, { Fragment } from 'react';
import Dropzone from 'react-dropzone';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';

const renderDropzoneLabel = (
  hasAudio,
  isTranscoding,
  isUploading,
  audioUploadProgress
) => {
  if (isUploading) {
    return (
      <Fragment>
        <FontAwesome name="cog" spin className="mr-2" />
        {audioUploadProgress.toString(10).padStart(2, '0')}%
      </Fragment>
    );
  } else if (hasAudio || isTranscoding) {
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

const RenderTrackField = props => {
  const {
    audioClassNames,
    audioUploadProgress,
    hasAudio,
    index,
    input,
    isTranscoding,
    isUploading,
    label,
    meta: { touched, error },
    name,
    trackId,
    type
  } = props;
  const inputClasses = classNames('form-control', {
    invalid: touched && error
  });
  const dropzoneClasses = classNames('dropzone-audio', audioClassNames);

  return (
    <Fragment>
      <div className="d-flex align-items-center">
        <label htmlFor={name}>{label}</label>
        <input
          className={inputClasses}
          id={name}
          name="trackTitle"
          placeholder={`Track ${label} Title`}
          required
          type={type}
          {...input}
        />
        <Dropzone
          accept=".wav, .aif, .aiff"
          activeClassName="dropzone-audio-active"
          className={dropzoneClasses}
          disabled={isUploading}
          disablePreview
          multiple={false}
          onDrop={(accepted, rejected) =>
            props.onDropAudio(accepted, rejected, index, trackId)
          }
        >
          {renderDropzoneLabel(
            hasAudio,
            isTranscoding,
            isUploading,
            audioUploadProgress
          )}
        </Dropzone>
      </div>
      {error && <div className="invalid-feedback">{touched && error}</div>}
    </Fragment>
  );
};

export default RenderTrackField;
