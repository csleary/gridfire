import React, { useState } from 'react';
import { cancelUpload, uploadAudio } from 'features/tracks';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toastError, toastInfo } from 'features/toast';
import PropTypes from 'prop-types';
import Status from './status';
import classNames from 'classnames';
import styles from './audioDropzone.module.css';
import { updateTrackStatus } from 'features/releases';
import { useDropzone } from 'react-dropzone';

const AudioDropzone = ({ trackId }) => {
  const dispatch = useDispatch();
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const { audioUploadProgress } = useSelector(state => state.tracks, shallowEqual);
  const [hoverActive, setHoverActive] = useState(false);
  const releaseId = release._id;
  const currentTrack = release.trackList.find(track => track._id === trackId);
  const trackIndex = release.trackList.findIndex(track => track._id === trackId);
  const { status, trackTitle } = currentTrack || {};
  const isStored = status === 'stored';
  const isUploading = status === 'uploading';
  const isEncoding = status === 'encoding';
  const isTranscoding = status === 'transcoding';

  const handleClick = e => {
    if (isUploading) {
      dispatch(cancelUpload(trackId));
      dispatch(updateTrackStatus({ releaseId, trackId, status: 'pending' }));
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
    dispatch(uploadAudio({ releaseId, trackId, trackName, audioFile, mimeType: audioFile.type })).catch(error =>
      dispatch(toastError(`Upload failed! ${error.message}`))
    );
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: [
      'audio/aiff',
      'audio/x-aiff',
      'audio/flac',
      'audio/x-flac',
      'audio/wav',
      'audio/wave',
      'audio/vnd.wave',
      'audio/x-wave'
    ],
    disabled: isTranscoding || isEncoding,
    multiple: false,
    noDragEventsBubbling: true,
    noKeyboard: true,
    onDrop: onDropAudio
  });

  return (
    <div
      onMouseOver={() => setHoverActive(true)}
      onMouseOut={() => setHoverActive(false)}
      {...getRootProps({
        className: classNames(styles.root, {
          [styles.active]: isDragActive && !isDragReject,
          [styles.cancel]: isUploading && hoverActive,
          [styles.uploading]: isUploading || isTranscoding || isEncoding,
          [styles.disabled]: isTranscoding || isEncoding,
          [styles.complete]: isStored && !isUploading && !isTranscoding && !isEncoding,
          [styles.rejected]: isDragReject
        }),
        onClick: handleClick
      })}
    >
      <input {...getInputProps()} />
      <Status
        audioUploadProgress={audioUploadProgress[trackId]}
        hoverActive={hoverActive}
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
