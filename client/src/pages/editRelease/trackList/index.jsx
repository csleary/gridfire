import { Button, Flex, Heading, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import { deleteTrack, setTrackIdsForDeletion } from "state/tracks";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useCallback, useState } from "react";
import Icon from "components/icon";
import PropTypes from "prop-types";
import Track from "./track";
import { addTrack } from "state/releases";
import { createObjectId } from "utils";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "utils";

const TrackList = ({ errors = {}, handleChange, setValues, trackList }) => {
  const dispatch = useDispatch();
  const { trackIdsForDeletion } = useSelector(state => state.tracks, shallowEqual);
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

  const handleChangePrice = useCallback(
    trackId =>
      ({ target: { name, value } }) => {
        const numbersOnly = value.replace(/[^0-9.]/g, "");
        handleChange({ target: { name, value: numbersOnly } }, trackId);
      },
    [handleChange]
  );

  const handleBlur = useCallback(
    trackId =>
      ({ target: { name, value } }) => {
        handleChange({ target: { name, value: formatPrice(value) } }, trackId);
      },
    [handleChange]
  );

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
        {trackList.map(({ _id: trackId, isBonus, isEditionOnly, price, status, trackTitle }, index) => {
          return (
            <Track
              cancelDeleteTrack={cancelDeleteTrack}
              dragOriginIsInactive={dragOriginIsInactive}
              errorTrackTitle={errors[`${trackId}.trackTitle`]}
              handleBlur={handleBlur(trackId)}
              handleChange={handleChange}
              handleChangePrice={handleChangePrice(trackId)}
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
              isBonus={isBonus}
              isEditionOnly={isEditionOnly}
              isDragging={dragOriginId != null}
              isDragOrigin={dragOriginId === trackId}
              key={trackId}
              price={price}
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
