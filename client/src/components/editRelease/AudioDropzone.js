import AudioDropzoneLabel from './AudioDropzoneLabel';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { useDropzone } from 'react-dropzone';

const AudioDropzone = props => {
  const {
    audioUploadProgress,
    hasAudio,
    isEncoding,
    isTranscoding,
    isUploading,
    onDrop
  } = props;

  const handleClick = e => {
    if (isUploading) {
      e.stopPropagation();
    }
    console.log('click');
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject
  } = useDropzone({
    accept:
      'audio/wav, audio/wave, audio/x-wave, audio/vnd.wave, audio/aiff, audio/x-aiff',
    disabled: isTranscoding || isEncoding,
    multiple: false,
    noDragEventsBubbling: true,
    noKeyboard: true,
    onDrop
  });

  const dropzoneClassNames = classNames('dropzone-audio', {
    active: isDragActive && !isDragReject,
    uploading: isUploading || isTranscoding || isEncoding,
    disabled: isUploading || isTranscoding || isEncoding,
    complete: hasAudio && !isUploading && !isTranscoding && !isEncoding,
    rejected: isDragReject
  });

  return (
    <div
      {...getRootProps({
        className: dropzoneClassNames,
        onClick: handleClick
      })}
    >
      <input {...getInputProps()} />
      <AudioDropzoneLabel
        audioUploadProgress={audioUploadProgress}
        hasAudio={hasAudio}
        isDragActive={isDragActive}
        isDragReject={isDragReject}
        isEncoding={isEncoding}
        isTranscoding={isTranscoding}
        isUploading={isUploading}
      />
    </div>
  );
};

AudioDropzone.propTypes = {
  audioUploadProgress: PropTypes.number,
  hasAudio: PropTypes.bool,
  isEncoding: PropTypes.bool,
  isTranscoding: PropTypes.bool,
  isUploading: PropTypes.bool,
  onDrop: PropTypes.func
};

export default AudioDropzone;
