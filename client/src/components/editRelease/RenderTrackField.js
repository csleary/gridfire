import React from 'react';
import Dropzone from 'react-dropzone';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';

const renderDropzoneIcon = (hasAudio, uploadingAudio) => {
  if (uploadingAudio && uploadingAudio < 100) {
    return <FontAwesome name="cog" spin className="icon-left" />;
  } else if (hasAudio) {
    return <FontAwesome name="refresh" className="icon-left" />;
  }
  return <FontAwesome name="plus-circle" className="icon-left" />;
};

const renderDropzoneLabel = (hasAudio, uploadingAudio) => {
  if (uploadingAudio < 100 && uploadingAudio > 0) {
    return `${uploadingAudio.toString(10).padStart(2, '0')}%`;
  } else if (hasAudio) {
    return 'Replace Audio';
  }
  return 'Add Audio';
};

const RenderTrackField = props => {
  const {
    audioStatus,
    hasAudio,
    index,
    input,
    label,
    meta: { touched, error },
    name,
    trackId,
    type,
    uploadingAudio
  } = props;
  const classInvalid = classNames('form-control', {
    invalid: touched && error
  });
  const classDropzone = classNames('dropzone-audio', audioStatus);

  return (
    <div>
      <div className="d-flex align-items-center">
        <label htmlFor={name}>{label}</label>
        <input
          className={classInvalid}
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
          className={classDropzone}
          disablePreview
          multiple={false}
          onDrop={(accepted, rejected) =>
            props.onDropAudio(accepted, rejected, index, trackId)
          }
        >
          {renderDropzoneIcon(hasAudio, uploadingAudio)}
          {renderDropzoneLabel(hasAudio, uploadingAudio)}
        </Dropzone>
      </div>
      {error && <div className="invalid-feedback">{touched && error}</div>}
    </div>
  );
};

export default RenderTrackField;
