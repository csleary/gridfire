import React, { useEffect, useState } from 'react';
import { addTrack, deleteTrack, moveTrack } from 'features/tracks';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import RenderTrack from './renderTrack';
import { toastSuccess } from 'features/toast';
import { usePrevious } from 'functions';

function RenderTrackList(props) {
  const { change, fields: trackFields, onDropAudio } = props;
  const dispatch = useDispatch();
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const { audioUploadProgress } = useSelector(state => state.tracks, shallowEqual);
  const releaseId = release._id;
  const [dragOrigin, setDragOrigin] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [addingTrack, setAddingTrack] = useState(false);
  const prevAddingTrack = usePrevious(addingTrack);

  useEffect(() => {
    if (prevAddingTrack && !addingTrack) {
      const newIndex = release.trackList.length - 1;
      change(`trackList[${newIndex}]._id`, release.trackList[newIndex]._id);
    }
  }, [addingTrack, change, prevAddingTrack, release.trackList]);

  const handleAddTrack = async () => {
    setAddingTrack(true);
    await dispatch(addTrack(releaseId));
    setAddingTrack(false);
  };

  const handleConfirm = trackTitle =>
    new Promise(resolve => {
      const hasConfirmed = window.confirm(`Are you sure you want to delete \u2018${trackTitle}\u2019?`);
      resolve(hasConfirmed);
    });

  const handleDeleteTrack = async (remove, trackId, index, trackTitle) => {
    const hasConfirmed = await handleConfirm(trackTitle);
    if (!hasConfirmed) return;
    await dispatch(deleteTrack(releaseId, trackId));
    remove(index);
    dispatch(toastSuccess(`'${trackTitle}' deleted.`));
  };

  const handleDragStart = index => setDragOrigin(index);
  const handleDragEnd = () => {
    setDragOrigin(null);
    setDragActive(null);
  };
  const handleDragEnter = index => setDragActive(index);
  const handleDragOver = () => {};
  const handleDragLeave = () => {};

  const handleDrop = async (fieldsMove, indexTo) => {
    const indexFrom = dragOrigin;
    await moveTrack(releaseId, indexFrom, indexTo);
    fieldsMove(indexFrom, indexTo);
  };

  return (
    <>
      <ul className="list-group track-list">
        {trackFields.map((name, index, fields) => {
          const track = release.trackList[index];
          if (!track) return null;
          const { _id: trackId } = track;

          return (
            <RenderTrack
              audioUploadProgress={audioUploadProgress[trackId]}
              dragActive={dragActive}
              dragOrigin={dragOrigin}
              fields={fields}
              handleDeleteTrack={handleDeleteTrack}
              handleDragStart={handleDragStart}
              handleDragEnter={handleDragEnter}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleDragEnd={handleDragEnd}
              index={index}
              key={trackId}
              name={name}
              onDropAudio={onDropAudio}
              track={track}
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
  change: PropTypes.func,
  fields: PropTypes.object,
  onDropAudio: PropTypes.func
};

export default RenderTrackList;
