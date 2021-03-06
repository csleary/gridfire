import React, { useState } from 'react';
import { addTrack, setTrackIdsForDeletion, deleteTrack, moveTrack } from 'features/tracks';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from 'components/button';
import PropTypes from 'prop-types';
import Track from './track';
import { createObjectId } from 'utils';
import styles from './trackList.module.css';
import { toastSuccess } from 'features/toast';

function TrackList({ errors = [], handleChange, setValues, values }) {
  const dispatch = useDispatch();
  const { activeRelease } = useSelector(state => state.releases, shallowEqual);
  const { trackIdsForDeletion } = useSelector(state => state.tracks, shallowEqual);
  const { _id: releaseId } = activeRelease;
  const [dragOrigin, setDragOrigin] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleAddTrack = async () => {
    const newTrack = {
      _id: createObjectId(),
      dateCreated: Date.now(),
      status: 'pending',
      trackTitle: ''
    };

    setValues(prev => ({ ...prev, trackList: [...prev.trackList, newTrack] }));
    dispatch(addTrack(releaseId, newTrack));
  };

  const cancelDeleteTrack = trackId => {
    dispatch(setTrackIdsForDeletion({ trackId, isDeleting: false }));
  };

  const handleDeleteTrack = (trackId, trackTitle) => {
    if (trackIdsForDeletion[trackId]) {
      setValues(prev => ({ ...prev, trackList: prev.trackList.filter(({ _id }) => _id !== trackId) }));
    }

    dispatch(deleteTrack(releaseId, trackId, trackTitle));
  };

  const handleDragStart = index => setDragOrigin(index);

  const handleDragEnd = () => {
    setDragOrigin(null);
    setDragActive(null);
  };

  const handleDragEnter = index => setDragActive(index);
  const handleDragOver = () => {};
  const handleDragLeave = () => {};

  const handleMoveTrack = (indexFrom, indexTo, id = releaseId) => {
    const { trackList } = values;
    const nextTrackList = [...trackList];
    nextTrackList.splice(indexTo, 0, nextTrackList.splice(indexFrom, 1)[0]);
    setValues(prev => ({ ...prev, trackList: nextTrackList }));
    dispatch(moveTrack(id, indexFrom, indexTo)).then(() => dispatch(toastSuccess('Tracklist saved.')));
  };

  const handleDrop = async indexTo => {
    const indexFrom = dragOrigin;
    handleMoveTrack(indexFrom, indexTo);
  };

  return (
    <>
      <ul className={styles.tracks}>
        {values.trackList.map((track, index) => {
          const { _id: trackId } = track;

          return (
            <Track
              errors={errors}
              cancelDeleteTrack={cancelDeleteTrack}
              dragActive={dragActive === index}
              handleChange={handleChange}
              handleDeleteTrack={handleDeleteTrack}
              handleDragStart={handleDragStart}
              handleDragEnter={handleDragEnter}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleDragEnd={handleDragEnd}
              handleMoveTrack={handleMoveTrack}
              index={index}
              isDragOrigin={dragOrigin === index}
              key={trackId}
              setValues={setValues}
              track={track}
            />
          );
        })}
      </ul>
      <Button icon={faPlusCircle} onClick={handleAddTrack} title="Add Track" size="small" type="button">
        Add Track
      </Button>
    </>
  );
}

TrackList.propTypes = {
  handleChange: PropTypes.func,
  setValues: PropTypes.func,
  values: PropTypes.object
};

export default TrackList;
