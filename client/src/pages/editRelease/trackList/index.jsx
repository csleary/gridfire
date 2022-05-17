import { Button, Flex } from "@chakra-ui/react";
import { deleteTrack, setTrackIdsForDeletion } from "state/tracks";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import Track from "./track";
import { addTrack } from "state/releases";
import { createObjectId } from "utils";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useState } from "react";
import Icon from "components/icon";

const TrackList = ({ errors = {}, handleChange, setValues, trackList }) => {
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

  const cancelDeleteTrack = useCallback(
    trackId => {
      dispatch(setTrackIdsForDeletion({ trackId, isDeleting: false }));
    },
    [dispatch]
  );

  const handleDeleteTrack = useCallback(
    (trackId, trackTitle) => {
      if (trackIdsForDeletion[trackId]) {
        setValues(prev => ({ ...prev, trackList: prev.trackList.filter(({ _id }) => _id !== trackId) }));
      }

      dispatch(deleteTrack(releaseId, trackId, trackTitle));
    },
    [dispatch, releaseId, setValues, trackIdsForDeletion]
  );

  const handleDragStart = useCallback(index => setDragOrigin(index), []);
  const handleDragEnter = useCallback(index => setDragActive(index), []);
  const handleDragOver = useCallback(() => false, []);
  const handleDragLeave = useCallback(() => setDragActive(), []);
  const handleDragEnd = useCallback(() => {
    setDragOrigin(null);
    setDragActive(null);
  }, []);

  const handleMoveTrack = useCallback(
    (indexFrom, indexTo) => {
      const nextTrackList = [...trackList];
      nextTrackList.splice(indexTo, 0, ...nextTrackList.splice(indexFrom, 1));
      setValues(prev => ({ ...prev, trackList: nextTrackList }));
    },
    [setValues, trackList]
  );

  const handleDrop = useCallback(
    async indexTo => {
      const indexFrom = dragOrigin;
      if (indexFrom === indexTo) return;
      handleMoveTrack(indexFrom, indexTo);
    },
    [dragOrigin, handleMoveTrack]
  );

  return (
    <>
      <Flex flexDirection="column">
        {trackList.map((track, index) => {
          const { _id: trackId, trackTitle, status } = track;

          return (
            <Track
              cancelDeleteTrack={cancelDeleteTrack}
              dragOverActive={dragActive === index}
              errorAudio={errors[`trackList.${index}.audio`]}
              errorTrackTitle={errors[`trackList.${index}.trackTitle`]}
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
              trackId={trackId}
              trackListLength={trackList.length}
              trackMarkedForDeletion={trackIdsForDeletion[trackId]}
              trackTitle={trackTitle}
              status={status}
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
  TrackList: PropTypes.array
};

export default TrackList;
