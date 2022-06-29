import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import { deleteTrack, setTrackIdsForDeletion } from "state/tracks";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useCallback, useState } from "react";
import Icon from "components/icon";
import PropTypes from "prop-types";
import Track from "./track";
import { addTrack } from "state/releases";
import { createObjectId } from "utils";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";

const TrackList = ({ errors = {}, handleChange, setValues, trackList }) => {
  const dispatch = useDispatch();
  const { activeRelease } = useSelector(state => state.releases, shallowEqual);
  const { trackIdsForDeletion } = useSelector(state => state.tracks, shallowEqual);
  const { _id: releaseId } = activeRelease;
  const [dragOriginId, setDragOriginId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOriginIsInactive, setDragOriginIsInactive] = useState(false);

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

      dispatch(deleteTrack(trackId, trackTitle));
    },
    [dispatch, setValues, trackIdsForDeletion]
  );

  const handleDragStart = useCallback(
    (trackId, ref) => e => {
      e.dataTransfer.dropEffect = "none";
      e.dataTransfer.effectAllowed = "move";
      setDragOriginId(trackId);
    },
    []
  );

  const handleDragEnter = useCallback(
    e => {
      if (dragOriginId == null) {
        return void (e.dataTransfer.dropEffect = "none");
      }
      e.dataTransfer.dropEffect = "move";
      setDragOverId(e.target.id);
    },
    [dragOriginId]
  );

  const handleDragOver = useCallback(() => false, []);

  const handleDragLeave = useCallback(
    e => {
      if (e.target.id === dragOriginId) {
        setDragOriginIsInactive(true);
      }

      e.dataTransfer.dropEffect = "none";
      setDragOverId(null);
    },
    [dragOriginId]
  );

  const handleDragEnd = useCallback(() => {
    setDragOriginId(null);
    setDragOriginIsInactive(false);
    setDragOverId(null);
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
    async e => {
      const indexFrom = trackList.findIndex(({ _id }) => _id === dragOriginId);
      const indexTo = trackList.findIndex(({ _id }) => _id === e.target.id);
      if (indexFrom === indexTo) return;
      handleMoveTrack(indexFrom, indexTo);
    },
    [dragOriginId, handleMoveTrack, trackList]
  );

  return (
    <>
      <Heading as="h3">Track List</Heading>
      <Text mb={4}>
        Upload formats supported: flac, aiff, wav.
        <br />
        Click or drop a file into the dashed box to upload.
        <br />
        Drag and drop to rearrange tracks.
        <br />
      </Text>
      <Flex flexDirection="column">
        {trackList.map((track, index) => {
          const { _id: trackId, trackTitle, status } = track;

          return (
            <Track
              cancelDeleteTrack={cancelDeleteTrack}
              dragOriginIsInactive={dragOriginIsInactive}
              errorTrackTitle={errors[`${trackId}.trackTitle`]}
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
              isActiveDragOver={dragOverId === trackId && dragOverId !== dragOriginId}
              isDragging={dragOriginId != null}
              isDragOrigin={dragOriginId === trackId}
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
