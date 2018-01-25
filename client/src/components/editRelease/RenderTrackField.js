import React from 'react';
import Dropzone from 'react-dropzone';
import FontAwesome from 'react-fontawesome';

const renderDropzoneIcon = (release, uploadingAudio, index, trackId) => {
  if (uploadingAudio[trackId] && uploadingAudio[trackId] < 100) {
    return <FontAwesome name="cog" spin className="icon-left" />;
  } else if (release.trackList[index] && release.trackList[index].hasAudio) {
    return <FontAwesome name="refresh" className="icon-left" />;
  }
  return <FontAwesome name="plus-circle" className="icon-left" />;
};

const renderDropzoneLabel = (release, uploadingAudio, index, trackId) => {
  if (uploadingAudio[trackId] < 100 && uploadingAudio[trackId] > 0) {
    return `${uploadingAudio[trackId].toString(10).padStart(2, '0')}%`;
  } else if (release.trackList[index] && release.trackList[index].hasAudio) {
    return 'Replace Audio';
  }
  return 'Add Audio';
};

const RenderTrackField = props => {
  const {
    hasAudio,
    index,
    input,
    label,
    meta: { touched, error },
    name,
    release,
    trackId,
    type,
    uploadingAudio
  } = props;
  const className = `form-control ${touched && error ? 'invalid' : ''}`;
  return (
    <div>
      <div className="d-flex align-items-center">
        <label htmlFor={name}>{label}</label>
        <input
          className={className}
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
          className={`dropzone-audio ${hasAudio(
            release,
            index,
            uploadingAudio
          )}`}
          disablePreview
          multiple={false}
          onDrop={(accepted, rejected) =>
            props.onDropAudio(accepted, rejected, index, trackId)
          }
        >
          {renderDropzoneIcon(release, uploadingAudio, index, trackId)}
          {renderDropzoneLabel(release, uploadingAudio, index, trackId)}
        </Dropzone>
      </div>
      {error && <div className="invalid-feedback">{touched && error}</div>}
    </div>
  );
};

export default RenderTrackField;
