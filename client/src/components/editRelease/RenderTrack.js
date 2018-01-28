import React from 'react';
import FontAwesome from 'react-fontawesome';
import { Field } from 'redux-form';
import classNames from 'classnames';
import RenderTrackField from './RenderTrackField';
import ProgressBar from './ProgressBar';

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

const RenderTrack = props => {
  const { fields, moveTrack, release, uploadingAudio } = props;
  const { trackList } = release;
  const id = release._id;

  return (
    <div>
      <ul className="list-group track-list">
        {fields.map((track, index) => {
          const trackId = trackList[index] && trackList[index]._id;
          const hasAudio =
            (release.trackList[index] && release.trackList[index].hasAudio) ||
            uploadingAudio[trackId] === 100;
          const isUploadingAudio = uploadingAudio[trackId] < 100;
          const audioStatus = classNames({
            'audio-true': hasAudio,
            'audio-uploading': isUploadingAudio,
            'audio-false': !hasAudio && !isUploadingAudio
          });
          const classTrack = classNames('list-group-item', audioStatus);

          return (
            <li className={classTrack} key={`${track}._id`}>
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
                uploadingAudio={uploadingAudio[trackId]}
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
                percentComplete={uploadingAudio[trackId]}
                willDisplay={
                  uploadingAudio[trackId] && uploadingAudio[trackId] < 100
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
