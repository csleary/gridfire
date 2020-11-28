import React, { useState } from 'react';
import { faArrowDown, faArrowUp, faCog, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { faFileArchive, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from 'components/button';
import { Field } from 'redux-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ProgressBar from 'pages/editRelease/progressBar';
import PropTypes from 'prop-types';
import RenderTrackInput from 'pages/editRelease/renderTrackInput';
import classNames from 'classnames';
import { moveTrack } from 'features/tracks';
import styles from './renderTrack.module.css';

const RenderTrack = props => {
  const {
    audioUploadProgress,
    dragActive,
    index,
    isDragOrigin,
    fields,
    handleDeleteTrack,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    name,
    track: { _id: trackId, trackTitle = `Track ${index + 1}`, status }
  } = props;

  const dispatch = useDispatch();
  const [isMoving, setMoving] = useState();
  const hasError = status === 'error';
  const isDeleting = useSelector(state => state.tracks.isDeleting.some(id => id === trackId), shallowEqual);
  const isEncoding = status === 'encoding';
  const isPending = status === 'pending';
  const isStored = status === 'stored';
  const isTranscoding = status === 'transcoding';
  const isUploading = status === 'uploading';
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const releaseId = release._id;

  const trackClassNames = classNames(styles.track, {
    [styles.dragActive]: dragActive,
    [styles.dragOrigin]: isDragOrigin,
    [styles.encoding]: isEncoding,
    [styles.error]: hasError,
    [styles.incomplete]: !isPending && !isStored,
    [styles.pending]: isPending,
    [styles.stored]: isStored,
    [styles.transcoding]: isTranscoding,
    [styles.uploading]: isUploading
  });

  const deleteButtonClassNames = classNames(styles.delete, {
    [styles.deleteActive]: isDeleting
  });

  const handleMoveTrack = async (swap, id, trackIndex, direction) => {
    setMoving(trackId);
    swap(trackIndex, trackIndex + direction);
    await dispatch(moveTrack(id, trackIndex, trackIndex + direction));
    setMoving();
  };

  return (
    <li
      className={trackClassNames}
      draggable="true"
      onDragStart={() => handleDragStart(index)}
      onDragEnter={() => handleDragEnter(index)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={() => handleDrop(fields.move, index)}
      onDragEnd={handleDragEnd}
      onTouchStart={() => {}}
    >
      <Field component={RenderTrackInput} label={index + 1} name={`${name}.trackTitle`} trackId={trackId} type="text" />
      <div className={styles.wrapper}>
        {hasError ? (
          <span className={styles.statusError}>
            <FontAwesomeIcon icon={faExclamationTriangle} className={styles.iconStatus} />
            An error occurred processing audio for this track. Please either re-upload or delete this track.
          </span>
        ) : null}
        {isUploading ? (
          <span className={styles.status}>
            <FontAwesomeIcon icon={faCog} spin className={styles.iconStatus} />
            Uploading…
          </span>
        ) : null}
        {isTranscoding ? (
          <span className={styles.status}>
            <FontAwesomeIcon icon={faCog} spin className={styles.iconStatus} />
            Transcoding…
          </span>
        ) : null}
        {isEncoding ? (
          <span className={styles.status}>
            <FontAwesomeIcon icon={faFileArchive} className={styles.iconStatus} />
            Encoding…
          </span>
        ) : null}
        {index < fields.length - 1 ? (
          <Button
            className={styles.button}
            disabled={Boolean(isMoving)}
            icon={faArrowDown}
            iconClassName={styles.icon}
            onClick={() => handleMoveTrack(fields.swap, releaseId, index, 1)}
            size="small"
            title="Move Down"
            type="button"
          >
            Down
          </Button>
        ) : null}
        {index > 0 ? (
          <Button
            className={styles.button}
            disabled={Boolean(isMoving)}
            icon={faArrowUp}
            iconClassName={styles.icon}
            onClick={() => handleMoveTrack(fields.swap, releaseId, index, -1)}
            size="small"
            title="Move Up"
            type="button"
          >
            Up
          </Button>
        ) : null}
        <Button
          className={deleteButtonClassNames}
          disabled={isDeleting}
          icon={isDeleting ? faCog : faTrashAlt}
          iconClassName={styles.deleteIcon}
          onClick={() => handleDeleteTrack(fields.remove, trackId, index, trackTitle)}
          size="small"
          title="Delete Track"
          type="button"
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
      <ProgressBar percentComplete={audioUploadProgress} willDisplay={isUploading} />
    </li>
  );
};

RenderTrack.propTypes = {
  audioUploadProgress: PropTypes.number,
  dragActive: PropTypes.bool,
  index: PropTypes.number,
  isDragOrigin: PropTypes.bool,
  fields: PropTypes.object,
  handleDeleteTrack: PropTypes.func,
  handleDragEnd: PropTypes.func,
  handleDragEnter: PropTypes.func,
  handleDragLeave: PropTypes.func,
  handleDragOver: PropTypes.func,
  handleDragStart: PropTypes.func,
  handleDrop: PropTypes.func,
  name: PropTypes.string,
  onDropAudio: PropTypes.func,
  track: PropTypes.object
};

export default RenderTrack;
