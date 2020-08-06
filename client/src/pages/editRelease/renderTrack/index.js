import React, { useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from 'components/button';
import { Field } from 'redux-form';
import FontAwesome from 'react-fontawesome';
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
  const isDeleting = useSelector(state => state.tracks.isDeleting.some(id => id === trackId), shallowEqual);
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const releaseId = release._id;
  const pending = status === 'pending';
  const isStored = status === 'stored';
  const isUploading = status === 'uploading';
  const isEncoding = status === 'encoding';
  const isTranscoding = status === 'transcoding';

  const trackClassNames = classNames(styles.track, {
    [styles.pending]: pending,
    [styles.incomplete]: !pending && !isStored,
    [styles.uploading]: isUploading,
    [styles.encoding]: isEncoding,
    [styles.transcoding]: isTranscoding,
    [styles.stored]: isStored,
    [styles.dragActive]: dragActive,
    [styles.dragOrigin]: isDragOrigin
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
        {isUploading ? (
          <span className={styles.status}>
            <FontAwesome name="cog" spin className={styles.iconStatus} />
            Uploading…
          </span>
        ) : null}
        {isTranscoding ? (
          <span className={styles.status}>
            <FontAwesome name="cog" spin className={styles.iconStatus} />
            Transcoding…
          </span>
        ) : null}
        {isEncoding ? (
          <span className={styles.status}>
            <FontAwesome name="file-archive-o" className={styles.iconStatus} />
            Encoding…
          </span>
        ) : null}
        {index < fields.length - 1 ? (
          <Button
            className={styles.button}
            disabled={Boolean(isMoving)}
            icon="arrow-down"
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
            icon="arrow-up"
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
          icon={isDeleting ? 'circle-o-notch' : 'trash'}
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
