import React, { useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
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

  const trackClassNames = classNames('list-group-item', {
    [styles.pending]: pending,
    [styles.incomplete]: !pending && !isStored,
    [styles.uploading]: isUploading,
    [styles.encoding]: isEncoding,
    [styles.transcoding]: isTranscoding,
    [styles.stored]: isStored,
    'drag-active': dragActive,
    'drag-origin': isDragOrigin
  });

  const deleteButtonClassNames = classNames('btn btn-outline-danger btn-sm ml-auto', { 'delete-active': isDeleting });

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
      <div className="d-flex mt-3">
        {isUploading ? (
          <span className="mr-2 yellow">
            <FontAwesome name="cog" spin className="mr-2" />
            <strong>Uploading…</strong>
          </span>
        ) : null}
        {isTranscoding ? (
          <span className="mr-2 cyan">
            <FontAwesome name="cog" spin className="mr-2" />
            <strong>Transcoding…</strong>
          </span>
        ) : null}
        {isEncoding ? (
          <span className="mr-2 cyan">
            <FontAwesome name="file-archive-o" className="mr-2" />
            <strong>Encoding…</strong>
          </span>
        ) : null}
        {index < fields.length - 1 ? (
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={isMoving}
            onClick={() => handleMoveTrack(fields.swap, releaseId, index, 1)}
            title="Move Down"
            type="button"
          >
            <FontAwesome name="arrow-down" className="mr-2" />
            Down
          </button>
        ) : null}
        {index > 0 ? (
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={isMoving}
            onClick={() => handleMoveTrack(fields.swap, releaseId, index, -1)}
            title="Move Up"
            type="button"
          >
            <FontAwesome name="arrow-up" className="mr-2" />
            Up
          </button>
        ) : null}
        <button
          className={deleteButtonClassNames}
          disabled={isDeleting}
          onClick={() => handleDeleteTrack(fields.remove, trackId, index, trackTitle)}
          title="Delete Track"
          type="button"
        >
          {isDeleting ? (
            <FontAwesome name="circle-o-notch" spin className="mr-2" />
          ) : (
            <FontAwesome name="trash" className="mr-2" />
          )}
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
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
