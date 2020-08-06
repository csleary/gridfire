import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toastError, toastInfo } from 'features/toast';
import AudioDropzoneLabel from 'pages/editRelease/audioDropzoneLabel';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import { uploadAudio } from 'features/tracks';
import { useDropzone } from 'react-dropzone';
import styles from './audioDropzone.module.css';

const AudioDropzone = ({ trackId }) => {
  const dispatch = useDispatch();
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const { audioUploadProgress } = useSelector(state => state.tracks, shallowEqual);
  const releaseId = release._id;
  const currentTrack = release.trackList.find(track => track._id === trackId);
  const trackIndex = release.trackList.findIndex(track => track._id === trackId);
  const { status, trackTitle } = currentTrack;
  const isStored = status === 'stored';
  const isUploading = status === 'uploading';
  const isEncoding = status === 'encoding';
  const isTranscoding = status === 'transcoding';

  const handleClick = e => {
    if (isUploading) {
      e.stopPropagation();
    }
  };

  const onDropAudio = (accepted, rejected) => {
    if (rejected?.length) {
      return dispatch(toastError('This does not seem to be an audio file. Please select a wav or aiff audio file.'));
    }

    const audioFile = accepted[0];
    const trackName = trackTitle ? `\u2018${trackTitle}\u2019` : `track ${parseInt(trackIndex, 10) + 1}`;
    dispatch(toastInfo(`Uploading file \u2018${audioFile.name}\u2019 for ${trackName}.`));
    dispatch(uploadAudio({ releaseId, trackId, trackName, audioFile, type: audioFile.type })).catch(error =>
      dispatch(toastError(`Upload failed! ${error.message}`))
    );
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: 'audio/wav, audio/wave, audio/x-wave, audio/vnd.wave, audio/aiff, audio/x-aiff',
    disabled: isTranscoding || isEncoding,
    multiple: false,
    noDragEventsBubbling: true,
    noKeyboard: true,
    onDrop: onDropAudio
  });

  const dropzoneClassNames = classNames(styles.dropzone, {
    [styles.active]: isDragActive && !isDragReject,
    [styles.uploading]: isUploading || isTranscoding || isEncoding,
    [styles.disabled]: isUploading || isTranscoding || isEncoding,
    [styles.complete]: isStored && !isUploading && !isTranscoding && !isEncoding,
    [styles.rejected]: isDragReject
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
        audioUploadProgress={audioUploadProgress[trackId]}
        isStored={isStored}
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
  trackId: PropTypes.string
};

export default AudioDropzone;
