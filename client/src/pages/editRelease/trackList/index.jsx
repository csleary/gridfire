import { Button, Flex, Heading, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import { deleteTrack, setTrackIdsForDeletion } from "state/tracks";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { memo, useCallback, useState } from "react";
import Icon from "components/icon";
import Track from "./track";
import { addTrack } from "state/releases";
import { createObjectId } from "utils";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";

const TrackList = ({ errors = {}, savedState, setTrackErrors, updateState }) => {
  const dispatch = useDispatch();
  const { trackIdsForDeletion } = useSelector(state => state.tracks, shallowEqual);
  const [dragOriginId, setDragOriginId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOriginIsInactive, setDragOriginIsInactive] = useState(false);

  const handleAddTrack = useCallback(async () => {
    const newTrack = {
      _id: createObjectId(),
      status: "pending",
      trackTitle: ""
    };

    updateState(prev => ({ ...prev, trackList: [...prev.trackList, newTrack] }));
    dispatch(addTrack(newTrack));
  }, [dispatch, updateState]);

  const cancelDeleteTrack = useCallback(
    trackId => {
      dispatch(setTrackIdsForDeletion({ trackId, isDeleting: false }));
    },
    [dispatch]
  );

  const handleDeleteTrack = useCallback(
    (trackId, trackTitle) => {
      if (trackIdsForDeletion[trackId]) {
        updateState(prev => ({ ...prev, trackList: prev.trackList.filter(({ _id }) => _id !== trackId) }));
      }

      dispatch(deleteTrack(trackId, trackTitle));
    },
    [dispatch, trackIdsForDeletion, updateState]
  );

  const handleDragStart = useCallback(e => {
    const { id: trackId } = e.currentTarget;
    e.dataTransfer.dropEffect = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    setDragOriginId(trackId);
  }, []);

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
      const nextTrackList = [...savedState];
      nextTrackList.splice(indexTo, 0, ...nextTrackList.splice(indexFrom, 1));
      updateState(prev => ({ ...prev, trackList: nextTrackList }));
    },
    [savedState, updateState]
  );

  const handleDrop = useCallback(
    async e => {
      const { id: trackId } = e.currentTarget;
      const indexFrom = savedState.findIndex(({ _id }) => _id === dragOriginId);
      const indexTo = savedState.findIndex(({ _id }) => _id === trackId);
      if (indexFrom === indexTo) return;
      handleMoveTrack(indexFrom, indexTo);
    },
    [dragOriginId, handleMoveTrack, savedState]
  );

  const dragHandlers = {
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  };

  return (
    <>
      <Heading as="h3">Track List</Heading>
      <Text mb={2}>Tips:</Text>
      <UnorderedList>
        <ListItem>
          <Text>Click or drop a file into the dashed box to upload. Supported formats: flac, aiff, wav.</Text>
        </ListItem>
      </UnorderedList>
      <UnorderedList>
        <ListItem>
          <Text>Download bonus: these tracks will only available for download, and will not be streamable.</Text>
        </ListItem>
      </UnorderedList>
      <UnorderedList>
        <ListItem>
          <Text>
            Edition exclusive: these tracks will be selectable in the pool of Edition-only tracks, and will no longer be
            available in standard purchases. These will be streamable unless you also mark these as download bonuses.
          </Text>
        </ListItem>
      </UnorderedList>
      <UnorderedList>
        <ListItem>
          <Text mb={12}>Drag and drop to rearrange tracks.</Text>
        </ListItem>
      </UnorderedList>
      <Flex flexDirection="column">
        {savedState.map((track, index) => {
          const { _id: trackId } = track;

          return (
            <Track
              key={trackId}
              cancelDeleteTrack={cancelDeleteTrack}
              dragOriginIsInactive={dragOriginIsInactive}
              errorTrackTitle={errors[`${trackId}.trackTitle`]}
              handleDeleteTrack={handleDeleteTrack}
              handleMoveTrack={handleMoveTrack}
              index={index}
              isActiveDragOver={dragOverId === trackId && dragOverId !== dragOriginId}
              isDragging={dragOriginId != null}
              isDragOrigin={dragOriginId === trackId}
              savedState={track}
              setTrackErrors={setTrackErrors}
              trackId={trackId}
              trackListLength={savedState.length}
              trackMarkedForDeletion={trackIdsForDeletion[trackId]}
              updateState={updateState}
              {...dragHandlers}
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

export default memo(TrackList);
