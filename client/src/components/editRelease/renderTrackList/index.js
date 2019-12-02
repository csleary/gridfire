import React, { useEffect, useState } from 'react';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import RenderTrack from './renderTrack';
import { usePrevious } from 'functions';

function RenderTrackList(props) {
  const {
    addTrack,
    audioUploadProgress,
    change,
    deleteTrack,
    fields,
    isDeleting,
    isTranscoding,
    moveTrack,
    onDropAudio,
    release,
    release: { trackList },
    toastSuccess
  } = props;

  const [dragOrigin, setDragOrigin] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [addingTrack, setAddingTrack] = useState(false);

  const prevAddingTrack = usePrevious(addingTrack);

  const handleDeleteTrack = (remove, trackId) => {
    const matchId = el => el._id === trackId;
    const trackTitle = trackList[trackList.findIndex(matchId)].trackTitle;

    handleConfirm(trackTitle, hasConfirmed => {
      if (!hasConfirmed) return;

      deleteTrack(release._id, trackId, () => {
        const index = trackList.findIndex(matchId);
        remove(index);
        const trackTitle = trackList[trackList.findIndex(matchId)].trackTitle;

        toastSuccess(
          `${(trackTitle && `'${trackTitle}'`) ||
            `Track ${index + 1}`} deleted.`
        );
      });
    });
  };

  const handleConfirm = (title, callback) => {
    const confirmation = window.confirm(
      `Are you sure you want to delete ${(title && `'${title}'`) ||
        'this track'}?`
    );
    callback(confirmation);
  };

  const handleAddTrack = () => {
    setAddingTrack(true);
    addTrack(release._id, () => {
      setAddingTrack(false);
    });
  };

  useEffect(() => {
    if (prevAddingTrack && !addingTrack) {
      const newIndex = release.trackList.length - 1;
      change(`trackList[${newIndex}]._id`, release.trackList[newIndex]._id);
    }
  }, [addingTrack, change, prevAddingTrack, release.trackList]);

  const handleDragStart = index => {
    setDragOrigin(index);
  };

  const handleDragEnter = index => {
    setDragActive(index);
  };

  const handleDragOver = () => {};

  const handleDragLeave = () => {};

  const handleDrop = (fieldsMove, indexTo) => {
    const releaseId = release._id;
    const indexFrom = dragOrigin;
    moveTrack(releaseId, indexFrom, indexTo, () => {
      fieldsMove(indexFrom, indexTo);
    });
  };

  const handleDragEnd = () => {
    setDragOrigin(null);
    setDragActive(false);
  };

  const uploadProgress = index => {
    const track = release.trackList[index];
    const trackId = track && track._id;
    const filtered = audioUploadProgress.filter(el => trackId in el);
    if (filtered.length) return filtered[0][trackId];
  };

  return (
    <>
      <ul className="list-group track-list">
        {fields.map((name, index) => {
          const track = release.trackList[index];
          if (!track) return null;
          const trackId = track._id;

          return (
            <RenderTrack
              audioUploadProgress={uploadProgress(index)}
              dragActive={dragActive}
              dragOrigin={dragOrigin}
              fields={fields}
              handleConfirm={handleConfirm}
              handleDeleteTrack={handleDeleteTrack}
              handleDragStart={handleDragStart}
              handleDragEnter={handleDragEnter}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleDragEnd={handleDragEnd}
              index={index}
              isDeleting={isDeleting.some(id => id === trackId)}
              isTranscoding={isTranscoding.some(id => id === trackId)}
              key={trackId}
              moveTrack={moveTrack}
              name={name}
              onDropAudio={onDropAudio}
              release={release}
              toastSuccess={toastSuccess}
              trackId={trackId}
            />
          );
        })}
      </ul>
      <button
        className="btn btn-outline-primary btn-sm add-track mt-3 py-2 px-3"
        disabled={addingTrack}
        onClick={handleAddTrack}
        title="Add Track"
        type="button"
      >
        {addingTrack ? (
          <FontAwesome name="circle-o-notch" spin className="mr-2" />
        ) : (
          <FontAwesome name="plus-circle" className="mr-2" />
        )}
        {addingTrack ? 'Adding Track…' : 'Add Track'}
      </button>
    </>
  );
}

RenderTrackList.propTypes = {
  audioUploadProgress: PropTypes.array,
  addTrack: PropTypes.func,
  change: PropTypes.func,
  deleteTrack: PropTypes.func,
  fields: PropTypes.object,
  isDeleting: PropTypes.array,
  isTranscoding: PropTypes.array,
  moveTrack: PropTypes.func,
  onDropAudio: PropTypes.func,
  release: PropTypes.object,
  toastSuccess: PropTypes.func
};

export default RenderTrackList;
