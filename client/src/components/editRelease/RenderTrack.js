import React from 'react';
import FontAwesome from 'react-fontawesome';
import { Field } from 'redux-form';
import classNames from 'classnames';
import RenderTrackField from './RenderTrackField';
import ProgressBar from './ProgressBar';

let draggable;

const handleMoveTrack = (moveTrack, swap, id, index, direction) => {
  moveTrack(id, index, index + direction, () => {
    swap(index, index + direction);
  });
};

const handleConfirm = (title, callback) => {
  const confirmation = window.confirm(
    `Are you sure you want to delete ${title || 'this track'}?`
  );
  if (confirmation) callback();
};

const handleDragStart = (event, indexFrom) => {
  event.target.style.opacity = '0.4';
  event.dataTransfer.setData('text/plain', indexFrom);
};

const handleDragEnter = event => {
  draggable = event.target;
};

const handleDragOver = event => {
  if (event.target === draggable) {
    event.target.style.borderColor = 'yellow';
  }
};

const handleDragLeave = event => {
  if (event.target === draggable) {
    event.target.style.borderColor = '';
    draggable = undefined;
  }
};

const handleDrop = (event, moveTrack, moveField, releaseId, indexTo) => {
  console.log(event.target);
  event.dataTransfer.dropEffect = 'move';
  const indexFrom = parseInt(event.dataTransfer.getData('text'), 10);
  moveTrack(releaseId, indexFrom, indexTo, () => {
    moveField(indexFrom, indexTo);
  });
  const list = document.querySelectorAll('li.list-group-item');
  list[indexTo].style.borderColor = '';
};

const handleDragEnd = event => {
  event.currentTarget.style.opacity = '';
};

const RenderTrack = props => {
  const { fields, moveTrack, release, audioUploading } = props;
  const { trackList } = release;
  const id = release._id;

  return (
    <div>
      <ul className="list-group track-list">
        {fields.map((track, index) => {
          const trackId = trackList[index] && trackList[index]._id;
          const hasAudio =
            (release.trackList[index] && release.trackList[index].hasAudio) ||
            audioUploading[trackId] === 100;
          const isaudioUploading = audioUploading[trackId] < 100;
          const audioStatus = classNames({
            'audio-true': hasAudio,
            'audio-uploading': isaudioUploading,
            'audio-false': !hasAudio && !isaudioUploading
          });
          const classTrack = classNames('list-group-item', audioStatus);

          return (
            <li
              className={classTrack}
              draggable="true"
              key={`${track}._id`}
              onDragStart={event => handleDragStart(event, index)}
              onDragEnter={event => handleDragEnter(event)}
              onDragOver={event => handleDragOver(event)}
              onDragLeave={event => handleDragLeave(event)}
              onDrop={event =>
                handleDrop(event, moveTrack, fields.move, id, index)
              }
              onDragEnd={event => handleDragEnd(event)}
              onTouchStart={() => {}}
            >
              <Field
                component={RenderTrackField}
                trackId={trackId}
                hasAudio={hasAudio}
                audioStatus={audioStatus}
                index={index}
                label={index + 1}
                name={`${track}.trackTitle`}
                release={props.release}
                type="text"
                onDropAudio={props.onDropAudio}
                audioUploading={audioUploading[trackId]}
              />
              <div className="d-flex mt-3">
                {index < fields.length - 1 && (
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() =>
                      handleMoveTrack(moveTrack, fields.swap, id, index, 1)
                    }
                    title="Move Down"
                    type="button"
                  >
                    <FontAwesome name="arrow-down" className="icon-left" />
                    Down
                  </button>
                )}
                {index > 0 && (
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() =>
                      handleMoveTrack(moveTrack, fields.swap, id, index, -1)
                    }
                    title="Move Up"
                    type="button"
                  >
                    <FontAwesome name="arrow-up" className="icon-left" />
                    Up
                  </button>
                )}
                <button
                  className="btn btn-outline-danger btn-sm ml-auto"
                  onClick={() =>
                    handleConfirm(
                      props.release.trackList[index].trackTitle,
                      () => {
                        props
                          .deleteTrack(
                            props.release._id,
                            props.release.trackList[index]._id
                          )
                          .then(fields.remove(index));
                      }
                    )
                  }
                  title="Delete Track"
                  type="button"
                >
                  <FontAwesome name="trash" className="icon-left" />
                  Delete
                </button>
              </div>
              <ProgressBar
                percentComplete={audioUploading[trackId]}
                willDisplay={
                  audioUploading[trackId] && audioUploading[trackId] < 100
                }
              />
            </li>
          );
        })}
      </ul>
      <button
        className="btn btn-outline-primary btn-sm add-track"
        onClick={() => {
          props.addTrack(props.release._id).then(fields.push());
        }}
        title="Add Track"
        type="button"
      >
        <FontAwesome name="plus-circle" className="icon-left" />
        Add
      </button>
    </div>
  );
};

export default RenderTrack;
