import { faArrowDown, faArrowUp, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { shallowEqual, useSelector } from 'react-redux';
import AudioDropzone from './audioDropzone';
import Button from 'components/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Input from 'components/input';
import ProgressBar from 'components/progressBar';
import PropTypes from 'prop-types';
import React from 'react';
import TextSpinner from 'components/textSpinner';
import classNames from 'classnames';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import styles from './track.module.css';

const Track = props => {
  const {
    cancelDeleteTrack,
    dragActive,
    errors = {},
    index,
    isDragOrigin,
    handleChange,
    handleDeleteTrack,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleMoveTrack,
    track: { _id: trackId, trackTitle, status }
  } = props;

  const { activeRelease } = useSelector(state => state.releases, shallowEqual);
  const { audioUploadProgress, trackIdsForDeletion } = useSelector(state => state.tracks, shallowEqual);
  const releaseId = activeRelease._id;
  const trackListLength = activeRelease.trackList.length;
  const hasError = status === 'error' || errors[`trackList.${index}.audio`];
  const isEncoding = status === 'encoding';
  const isPending = status === 'pending';
  const isStored = status === 'stored';
  const isTranscoding = status === 'transcoding';
  const isUploading = status === 'uploading';

  return (
    <li
      className={classNames(styles.root, {
        [styles.dragActive]: dragActive,
        [styles.dragOrigin]: isDragOrigin,
        [styles.encoding]: isEncoding,
        [styles.error]: hasError,
        [styles.incomplete]: !isPending && !isStored,
        [styles.pending]: isPending,
        [styles.stored]: isStored,
        [styles.transcoding]: isTranscoding,
        [styles.uploading]: isUploading
      })}
      draggable="true"
      onDragStart={() => handleDragStart(index)}
      onDragEnter={() => handleDragEnter(index)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={() => handleDrop(index)}
      onDragEnd={handleDragEnd}
      onTouchStart={() => {
        return;
      }}
    >
      <div className={styles.fields}>
        <div className={styles.grabber}>⠿</div>
        <label className={styles.label} htmlFor={`trackTitle.${index}`}>
          {index + 1}
        </label>
        <Input
          className={styles.input}
          onDrop={() => false}
          name="trackTitle"
          onChange={e => handleChange(e, trackId)}
          placeholder={`Track ${index + 1} Title`}
          required
          type="text"
          value={trackTitle || ''}
        />
        <AudioDropzone trackId={trackId} disablePreview />
      </div>
      <div className={styles.wrapper}>
        {hasError || errors[`trackList.${index}.trackTitle`] ? (
          <span className={styles.statusError}>
            <FontAwesomeIcon icon={faExclamationTriangle} className={styles.iconStatus} />
            {errors[`trackList.${index}.trackTitle`] ||
              'Audio processing error. Please re-upload or delete this track.'}
          </span>
        ) : null}
        {!isStored && !isPending ? (
          <span className={styles.status}>
            <TextSpinner
              isActive={isUploading || isEncoding || isTranscoding}
              className={styles.spinner}
              type={isUploading ? 'lines' : isEncoding ? 'nemp3' : 'braille'}
              speed={0.01}
            />
            {isUploading ? 'Uploading…' : isEncoding ? 'Encoding…' : isTranscoding ? 'Transcoding…' : null}
          </span>
        ) : null}
        {index < trackListLength - 1 ? (
          <Button
            className={styles.button}
            icon={faArrowDown}
            iconClassName={styles.icon}
            onClick={() => handleMoveTrack(index, index + 1, releaseId)}
            size="small"
            title="Move Down"
            type="button"
          />
        ) : null}
        {index > 0 ? (
          <Button
            className={styles.button}
            icon={faArrowUp}
            iconClassName={styles.icon}
            onClick={() => handleMoveTrack(index, index - 1, releaseId)}
            size="small"
            title="Move Up"
            type="button"
          />
        ) : null}
        <Button
          className={classNames(styles.delete, { [styles.deleteActive]: trackIdsForDeletion[trackId] })}
          icon={faTrashAlt}
          iconClassName={styles.iconDelete}
          onBlur={() => cancelDeleteTrack(trackId)}
          onKeyUp={({ key }) => (key === 'Escape') & cancelDeleteTrack(trackId)}
          onClick={() => handleDeleteTrack(trackId, trackTitle)}
          size="small"
          title="Delete Track"
          type="button"
        >
          {trackIdsForDeletion[trackId] ? 'Confirm!' : 'Delete'}
        </Button>
      </div>
      <ProgressBar className={styles.bar} percentComplete={audioUploadProgress[trackId]} willDisplay={isUploading} />
    </li>
  );
};

Track.propTypes = {
  cancelDeleteTrack: PropTypes.func,
  dragActive: PropTypes.bool,
  error: PropTypes.bool,
  errors: PropTypes.object,
  index: PropTypes.number,
  isDragOrigin: PropTypes.bool,
  handleChange: PropTypes.func,
  handleDeleteTrack: PropTypes.func,
  handleDragEnd: PropTypes.func,
  handleDragEnter: PropTypes.func,
  handleDragLeave: PropTypes.func,
  handleDragOver: PropTypes.func,
  handleDragStart: PropTypes.func,
  handleDrop: PropTypes.func,
  handleMoveTrack: PropTypes.func,
  onDropAudio: PropTypes.func,
  track: PropTypes.object
};

export default Track;
