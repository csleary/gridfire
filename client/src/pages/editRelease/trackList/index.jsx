import { Button, Flex } from "@chakra-ui/react";
import { deleteTrack, setTrackIdsForDeletion } from "features/tracks";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import Track from "./track";
import { addTrack } from "features/releases";
import { createObjectId } from "utils";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Icon from "components/icon";

const TrackList = ({ errors = {}, handleChange, setValues, values }) => {
  const dispatch = useDispatch();
  const { activeRelease } = useSelector(state => state.releases, shallowEqual);
  const { trackIdsForDeletion } = useSelector(state => state.tracks, shallowEqual);
  const { _id: releaseId } = activeRelease;
  const [dragOrigin, setDragOrigin] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleAddTrack = async () => {
    const newTrack = {
      _id: createObjectId(),
      releaseDate: new Date(Date.now()),
      status: "pending",
      trackTitle: ""
    };

    setValues(prev => ({ ...prev, trackList: [...prev.trackList, newTrack] }));
    dispatch(addTrack(newTrack));
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
  const handleDragEnter = index => setDragActive(index);
  const handleDragOver = () => false;
  const handleDragLeave = () => setDragActive();
  const handleDragEnd = () => {
    setDragOrigin(null);
    setDragActive(null);
  };

  const handleMoveTrack = (indexFrom, indexTo) => {
    const { trackList } = values;
    const nextTrackList = [...trackList];
    nextTrackList.splice(indexTo, 0, ...nextTrackList.splice(indexFrom, 1));
    setValues(prev => ({ ...prev, trackList: nextTrackList }));
  };

  const handleDrop = async indexTo => {
    const indexFrom = dragOrigin;
    if (indexFrom === indexTo) return;
    handleMoveTrack(indexFrom, indexTo);
  };

  return (
    <>
      <Flex flexDirection="column">
        {values.trackList.map((track, index) => {
          const { _id: trackId } = track;

          return (
            <Track
              errors={errors}
              cancelDeleteTrack={cancelDeleteTrack}
              dragOverActive={dragActive === index}
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
              trackList={values.trackList}
            />
          );
        })}
      </Flex>
      <Button leftIcon={<Icon icon={faPlusCircle} />} onClick={handleAddTrack} title="Add Track">
        Add Track
      </Button>
    </>
  );
};

TrackList.propTypes = {
  errors: PropTypes.object,
  handleChange: PropTypes.func,
  setValues: PropTypes.func,
  values: PropTypes.object
};

export default TrackList;
