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
  useColorModeValue,
  VStack,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { faArrowDown, faArrowUp, faBars, faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons";
import { ChangeEventHandler, DragEventHandler, lazy, memo, useCallback } from "react";

import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { selectTrackById, selectTrackListSize, trackNudge, trackUpdate } from "@/state/editor";
import { deleteTrack, reEncodeTrack, setTrackIdsForDeletion } from "@/state/tracks";
import { formatPrice } from "@/utils";
const AudioDropzone = lazy(() => import("./audioDropzone"));

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
  trackId: string;
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
  const { isBonus, isEditionOnly, price, status = "", trackTitle = "" } = track || {};

  const cancelDeleteTrack = (trackId: string) => {
    dispatch(setTrackIdsForDeletion({ isDeleting: false, trackId }));
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    e => {
      const { checked, name, type, value } = e.currentTarget;

      if (name === "price") {
        dispatch(trackUpdate({ changes: { [name]: value.replace(/[^0-9.]/g, "") }, id: trackId }));
        return;
      }

      dispatch(trackUpdate({ changes: { [name]: type === "checkbox" ? checked : value }, id: trackId }));
    },
    [dispatch, trackId]
  );

  const handleBlur: ChangeEventHandler<HTMLInputElement> = useCallback(
    e => {
      const { name, value } = e.currentTarget;

      if (name === "price") {
        const price = formatPrice(value);
        dispatch(trackUpdate({ changes: { price }, id: trackId }));
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
        id={trackId}
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
          "> *": { ...(isActiveDragOver || (dragOriginIsInactive && isDragOrigin) ? { pointerEvents: "none" } : {}) },
          transition: "outline 150ms"
        }}
      >
        <VStack alignItems="flex-start" flex="1 1 auto" justifyContent="space-between" mr={4} spacing={2}>
          <Wrap spacing={8} width="100%">
            <WrapItem alignItems="center" as="label" color="gray.500" fontSize="1.5rem" fontWeight="500">
              {index + 1}
            </WrapItem>
            <WrapItem alignItems="center" flex="1 1 auto">
              <FormLabel color="gray.400" htmlFor={`${trackId}.trackTitle`} mb={0} whiteSpace="nowrap">
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
              <FormLabel color="gray.400" htmlFor={`${trackId}.price`} mb={0} whiteSpace="nowrap">
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
        <VStack alignItems="center" justifyContent="space-between" spacing={2}>
          <Menu onClose={() => isDeleting && cancelDeleteTrack(trackId)}>
            <MenuButton aria-label="Options" as={IconButton} icon={<Icon fixedWidth icon={faBars} />} variant="ghost" />
            <MenuList>
              <MenuItem
                icon={<Icon icon={faArrowUp} />}
                isDisabled={!index}
                onClick={() => dispatch(trackNudge({ direction: "up", trackId }))}
              >
                Move track up
              </MenuItem>
              <MenuItem
                icon={<Icon icon={faArrowDown} />}
                isDisabled={index + 1 === numTracks}
                onClick={() => dispatch(trackNudge({ direction: "down", trackId }))}
              >
                Move track down
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={<Icon icon={faMagicWandSparkles} />}
                isDisabled={status !== "stored"}
                onClick={() => dispatch(reEncodeTrack(trackId))}
              >
                Re-encode
              </MenuItem>
              <MenuItem
                _focus={{ color: isDeleting ? "blackAlpha.800" : undefined }}
                bgColor={isDeleting ? "red.300" : undefined}
                closeOnSelect={isDeleting ? true : false}
                color={isDeleting ? "var(--menu-bg)" : "red.300"}
                fontWeight={isDeleting ? "500" : undefined}
                icon={<Icon icon={faTrashAlt} />}
                onClick={() => dispatch(deleteTrack(trackId))}
                onKeyUp={({ key }) => key === "Escape" && cancelDeleteTrack(trackId)}
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
