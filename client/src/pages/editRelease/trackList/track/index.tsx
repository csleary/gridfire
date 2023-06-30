import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Checkbox,
  Flex,
  FormLabel,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  VStack,
  Wrap,
  WrapItem,
  useColorModeValue
} from "@chakra-ui/react";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { ChangeEventHandler, DragEventHandler, memo, useCallback } from "react";
import { deleteTrack, setTrackIdsForDeletion } from "state/tracks";
import { selectTrackById, selectTrackListSize, trackNudge, trackUpdate } from "state/editor";
import { useDispatch, useSelector } from "hooks";
import AudioDropzone from "./audioDropzone";
import { EntityId } from "@reduxjs/toolkit";
import { HamburgerIcon } from "@chakra-ui/icons";
import Icon from "components/icon";
import { ReleaseTrack } from "types";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { formatPrice } from "utils";

interface Props {
  dragOriginIsInactive: boolean;
  handleDragEnd: DragEventHandler;
  handleDragEnter: DragEventHandler;
  handleDragLeave: DragEventHandler;
  handleDragOver: DragEventHandler;
  handleDragStart: DragEventHandler;
  handleDrop: DragEventHandler;
  index: number;
  isActiveDragOver: boolean;
  isDragging: boolean;
  isDragOrigin: boolean;
  trackId: EntityId;
}

const Track = ({
  dragOriginIsInactive,
  handleDragEnd,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDragStart,
  handleDrop,
  index,
  isActiveDragOver,
  isDragging,
  isDragOrigin,
  trackId
}: Props) => {
  const checkboxColour = useColorModeValue("yellow", "purple");
  const dispatch = useDispatch();
  const numTracks = useSelector(selectTrackListSize);
  const track = useSelector(trackList => selectTrackById(trackList, trackId));
  const isDeleting = useSelector(state => state.tracks.trackIdsForDeletion[trackId]);
  const trackTitleError: string = useSelector(state => state.editor.trackErrors[`${trackId}.trackTitle`]);
  const { isBonus, isEditionOnly, price, status, trackTitle } = track as ReleaseTrack;

  const cancelDeleteTrack = (trackId: EntityId) => {
    dispatch(setTrackIdsForDeletion({ trackId, isDeleting: false }));
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    e => {
      const { name, value, type, checked } = e.currentTarget;

      if (name === "price") {
        dispatch(trackUpdate({ id: trackId, changes: { [name]: value.replace(/[^0-9.]/g, "") } }));
        return;
      }

      dispatch(trackUpdate({ id: trackId, changes: { [name]: type === "checkbox" ? checked : value } }));
    },
    [dispatch, trackId]
  );

  const handleBlur: ChangeEventHandler<HTMLInputElement> = useCallback(
    e => {
      const { name, value } = e.currentTarget;

      if (name === "price") {
        const price = formatPrice(value);
        dispatch(trackUpdate({ id: trackId, changes: { price } }));
        return;
      }
    },
    [dispatch, trackId]
  );

  const dragOverStyle = isActiveDragOver
    ? "var(--chakra-colors-purple-300) dashed 2px"
    : isDragging
    ? "var(--chakra-colors-gray-500) dashed 2px"
    : "transparent dashed 2px";

  const preventDrag: DragEventHandler = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Box mb={6}>
      <Flex
        bg={useColorModeValue("white", "gray.800")}
        borderWidth="1px"
        boxShadow="lg"
        draggable={true}
        id={trackId as string}
        onDragEnd={handleDragEnd}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        onTouchStart={() => {}}
        opacity={isDragOrigin ? 0.33 : 1}
        outline={dragOverStyle}
        overflow="visible"
        padding={4}
        rounded="md"
        sx={{
          transition: "outline 150ms",
          "> *": { ...(isActiveDragOver || (dragOriginIsInactive && isDragOrigin) ? { pointerEvents: "none" } : {}) }
        }}
      >
        <VStack spacing={2} alignItems="flex-start" justifyContent="space-between" flex="1 1 auto" mr={4}>
          <Wrap spacing={8} width="100%">
            <WrapItem as="label" alignItems="center" color="gray.500" fontWeight="500" fontSize="1.5rem">
              {index + 1}
            </WrapItem>
            <WrapItem alignItems="center" flex="1 1 auto">
              <FormLabel color="gray.400" htmlFor={`${trackId}.trackTitle`} whiteSpace="nowrap" mb={0}>
                Title
              </FormLabel>
              <Input
                draggable={true}
                flex="1 1 auto"
                id={`${trackId}.trackTitle`}
                isInvalid={Boolean(trackTitleError)}
                isRequired
                name="trackTitle"
                onChange={handleChange}
                onDragStart={preventDrag}
                onDrop={() => false}
                placeholder={`Track ${index + 1} title`}
                size="lg"
                value={trackTitle}
              />
            </WrapItem>
            <WrapItem alignItems="center" flex="0 1 10rem">
              <FormLabel color="gray.400" htmlFor={`${trackId}.price`} whiteSpace="nowrap" mb={0}>
                Price
              </FormLabel>
              <Input
                draggable={true}
                flex="1 1 auto"
                id={`${trackId}.price`}
                inputMode="numeric"
                name="price"
                onBlur={handleBlur}
                onChange={handleChange}
                onDragStart={preventDrag}
                onDrop={() => false}
                placeholder="e.g. 1.50"
                size="lg"
                value={price}
              />
            </WrapItem>
          </Wrap>
          <Wrap spacing={4}>
            <WrapItem>
              <Checkbox colorScheme={checkboxColour} isChecked={isBonus} name="isBonus" onChange={handleChange}>
                Download bonus
              </Checkbox>
            </WrapItem>
            <WrapItem>
              <Checkbox
                colorScheme={checkboxColour}
                isChecked={isEditionOnly}
                name="isEditionOnly"
                onChange={handleChange}
              >
                Edition exclusive
              </Checkbox>
            </WrapItem>
          </Wrap>
        </VStack>
        <AudioDropzone index={index} status={status} trackId={trackId} trackTitle={trackTitle} />
        <VStack spacing={2} alignItems="center" justifyContent="space-between">
          <Menu onClose={() => isDeleting && cancelDeleteTrack(trackId)}>
            <MenuButton as={IconButton} aria-label="Options" icon={<HamburgerIcon />} variant="ghost" />
            <MenuList>
              <MenuItem
                icon={<Icon icon={faArrowUp} />}
                isDisabled={!index}
                onClick={() => dispatch(trackNudge({ trackId, direction: "up" }))}
              >
                Move track up
              </MenuItem>
              <MenuItem
                icon={<Icon icon={faArrowDown} />}
                isDisabled={index + 1 === numTracks}
                onClick={() => dispatch(trackNudge({ trackId, direction: "down" }))}
              >
                Move track down
              </MenuItem>
              <MenuDivider />
              <MenuItem
                closeOnSelect={isDeleting ? true : false}
                bgColor={isDeleting ? "red.300" : undefined}
                fontWeight={isDeleting ? "500" : undefined}
                color={isDeleting ? "var(--menu-bg)" : "red.300"}
                icon={<Icon icon={faTrashAlt} />}
                onClick={() => dispatch(deleteTrack(trackId))}
                onKeyUp={({ key }) => key === "Escape" && cancelDeleteTrack(trackId)}
                _focus={{ color: isDeleting ? "blackAlpha.800" : undefined }}
              >
                {isDeleting ? "Click to confirm!" : "Delete"}
              </MenuItem>
            </MenuList>
          </Menu>
        </VStack>
      </Flex>
      {trackTitleError ? (
        <WrapItem mt={2}>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle mr={2}>Error!</AlertTitle>
            <AlertDescription>{trackTitleError}</AlertDescription>
          </Alert>
        </WrapItem>
      ) : null}
    </Box>
  );
};

export default memo(Track);
