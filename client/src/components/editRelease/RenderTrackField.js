import AudioDropzone from './AudioDropzone';
import React from 'react';
import classNames from 'classnames';

const RenderTrackField = props => {
  const {
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
    <>
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
    </>
  );
};

export default RenderTrackField;
