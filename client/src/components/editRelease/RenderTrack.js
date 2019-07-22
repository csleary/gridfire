import React, { useState } from 'react';
import { Field } from 'redux-form';
import FontAwesome from 'react-fontawesome';
import ProgressBar from './ProgressBar';
import RenderTrackField from './RenderTrackField';
import classNames from 'classnames';

const RenderTrack = props => {
  const {
    audioUploadProgress,
    index,
    isDeleting,
    isTranscoding,
    fields,
    name,
    release,
    trackId
  } = props;

  const [isMoving, setMoving] = useState();

  const releaseId = release._id;
  const hasAudio = release.trackList[index].hasAudio;
  const isUploading = audioUploadProgress > 0 && audioUploadProgress < 100;
  const isEncoding = audioUploadProgress === 100 && !isTranscoding;

  const audioClassNames = classNames({
    complete: hasAudio && !isTranscoding && !isUploading,
    processing: isUploading || isTranscoding,
    incomplete: !hasAudio
  });

  const trackClassNames = classNames('list-group-item', audioClassNames, {
    'drag-active': props.dragActive === index,
    'drag-origin': props.dragOrigin === index
  });

  const deleteButtonClassNames = classNames(
    'btn btn-outline-danger btn-sm ml-auto',
    {
      'delete-active': isDeleting
    }
  );

  const handleMoveTrack = (swap, id, trackIndex, direction) => {
    setMoving(trackId);
    props.moveTrack(id, trackIndex, trackIndex + direction, () => {
      swap(trackIndex, trackIndex + direction);
      setMoving();
    });
  };

  return (
    <li
      className={trackClassNames}
      draggable="true"
      onDragStart={() => props.handleDragStart(index)}
      onDragEnter={() => props.handleDragEnter(index)}
      onDragOver={props.handleDragOver}
      onDragLeave={props.handleDragLeave}
      onDrop={() => props.handleDrop(fields.move, index)}
      onDragEnd={props.handleDragEnd}
      onTouchStart={() => {}}
    >
      <Field
        audioUploadProgress={audioUploadProgress}
        component={RenderTrackField}
        hasAudio={hasAudio}
        index={index}
        isEncoding={isEncoding}
        isTranscoding={isTranscoding}
        isUploading={isUploading}
        label={index + 1}
        name={`${name}.trackTitle`}
        onDropAudio={props.onDropAudio}
        trackId={trackId}
        type="text"
      />
      <div className="d-flex mt-3">
        {isTranscoding && (
          <span className="mr-2 yellow">
            <FontAwesome name="cog" spin className="mr-2" />
            <strong>Transcoding…</strong>
          </span>
        )}
        {isEncoding && (
          <span className="mr-2 yellow">
            <FontAwesome name="file-archive-o" className="mr-2" />
            <strong>Encoding…</strong>
          </span>
        )}
        {index < fields.length - 1 && (
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
        )}
        {index > 0 && (
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
        )}
        <button
          className={deleteButtonClassNames}
          disabled={isDeleting}
          onClick={() => props.handleDeleteTrack(fields.remove, trackId)}
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
      <ProgressBar
        percentComplete={audioUploadProgress}
        willDisplay={isUploading}
      />
    </li>
  );
};

export default RenderTrack;
