import React from 'react';
import classNames from 'classnames';
import { useDropzone } from 'react-dropzone';
import AudioDropzoneLabel from './AudioDropzoneLabel';

const AudioDropzone = props => {
  const {
    audioUploadProgress,
    hasAudio,
    isEncoding,
    isTranscoding,
    isUploading,
    onDrop
  } = props;

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject
  } = useDropzone({
    accept:
      'audio/wav, audio/wave, audio/x-wave, audio/vnd.wave, audio/aiff, audio/x-aiff',
    disabled: isUploading || isTranscoding || isEncoding,
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
    <div {...getRootProps({ className: dropzoneClassNames })}>
      <input {...getInputProps()} />
      <AudioDropzoneLabel
        hasAudio={hasAudio}
        isDragActive={isDragActive}
        isDragReject={isDragReject}
        isEncoding={isEncoding}
        isTranscoding={isTranscoding}
        isUploading={isUploading}
        audioUploadProgress={audioUploadProgress}
      />
    </div>
  );
};

export default AudioDropzone;
