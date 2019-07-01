import React, { Fragment } from 'react';
import classNames from 'classnames';
import AudioDropzone from './AudioDropzone';

const RenderTrackField = props => {
  const {
    audioClassNames,
    audioUploadProgress,
    hasAudio,
    index,
    input,
    isEncoding,
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
        <AudioDropzone
          audioClassNames={audioClassNames}
          hasAudio={hasAudio}
          isEncoding={isEncoding}
          isTranscoding={isTranscoding}
          isUploading={isUploading}
          audioUploadProgress={audioUploadProgress}
          disablePreview
          onDrop={(accepted, rejected) =>
            props.onDropAudio(accepted, rejected, index, trackId)
          }
        />
      </div>
      {error && <div className="invalid-feedback">{touched && error}</div>}
    </Fragment>
  );
};

export default RenderTrackField;
