import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { selectTrackIds, trackAdd, trackMove } from "@/state/editor";
import { Button, Flex, Heading, ListItem, Text, UnorderedList } from "@chakra-ui/react";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { DragEvent, DragEventHandler, lazy, useCallback, useState } from "react";
import { shallowEqual } from "react-redux";
const Track = lazy(() => import("./track"));

const isFileDrag = (e: DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

const TrackList = () => {
  const dispatch = useDispatch();
  const trackIds = useSelector(selectTrackIds, shallowEqual);
  const [dragOriginId, setDragOriginId] = useState("");
  const [dragOverId, setDragOverId] = useState("");
  const [dragOriginIsInactive, setDragOriginIsInactive] = useState(false);

  const handleDragStart: DragEventHandler<HTMLElement> = useCallback(e => {
    const { id: trackId } = e.currentTarget;
    e.dataTransfer.dropEffect = "move";
    e.dataTransfer.effectAllowed = "move";
    setDragOriginId(trackId);
  }, []);

  const handleDragEnter: DragEventHandler<HTMLElement> = useCallback(
    e => {
      if (isFileDrag(e)) return;

      if (dragOriginId == null) {
        return void (e.dataTransfer.dropEffect = "none");
      }

      e.dataTransfer.dropEffect = "move";
      setDragOverId(e.currentTarget.id);
    },
    [dragOriginId]
  );

  const handleDragOver: DragEventHandler<HTMLElement> = useCallback(e => {
    if (isFileDrag(e)) return;
    e.preventDefault();
  }, []);

  const handleDragLeave: DragEventHandler<HTMLElement> = useCallback(
    e => {
      if (e.currentTarget.id === dragOriginId) {
        setDragOriginIsInactive(true);
      }

      e.dataTransfer.dropEffect = "none";
      setDragOverId("");
    },
    [dragOriginId]
  );

  const handleDragEnd = () => {
    setDragOriginId("");
    setDragOriginIsInactive(false);
    setDragOverId("");
  };

  const handleDrop: DragEventHandler<HTMLElement> = useCallback(
    async e => {
      const { id: trackId } = e.currentTarget;
      if (dragOriginId === trackId) return;
      dispatch(trackMove({ idFrom: dragOriginId, idTo: trackId }));
    },
    [dispatch, dragOriginId]
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
      <Heading as="h3">Tracklist</Heading>
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
        {trackIds.map((trackId, index) => (
          <Track
            key={trackId}
            dragOriginIsInactive={dragOriginIsInactive}
            index={index}
            isActiveDragOver={dragOverId === trackId && dragOverId !== dragOriginId}
            isDragging={dragOriginId !== ""}
            isDragOrigin={dragOriginId === trackId}
            trackId={trackId}
            {...dragHandlers}
          />
        ))}
      </Flex>
      <Button leftIcon={<Icon icon={faPlusCircle} />} onClick={() => void dispatch(trackAdd())} title="Add Track">
        Add Track
      </Button>
    </>
  );
};

export default TrackList;
