import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Center,
  Flex,
  FormLabel,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuList,
  MenuItem,
  VStack,
  Wrap,
  WrapItem,
  useColorModeValue
} from "@chakra-ui/react";
import { DragHandleIcon, HamburgerIcon } from "@chakra-ui/icons";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import AudioDropzone from "./audioDropzone";
import Icon from "components/icon";
import PropTypes from "prop-types";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { memo, useRef } from "react";

const Track = ({
  cancelDeleteTrack,
  dragOriginIsInactive,
  errorTrackTitle,
  formatPrice,
  handleChange,
  handleChangePrice,
  handleDeleteTrack,
  handleDragStart,
  handleDragEnter,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  handleMoveTrack,
  index,
  isActiveDragOver,
  isDragging,
  isDragOrigin,
  price,
  trackId,
  trackTitle,
  trackListLength,
  trackMarkedForDeletion,
  status
}) => {
  const trackRef = useRef();

  const dragOverStyle = isActiveDragOver
    ? "var(--chakra-colors-purple-300) dashed 2px"
    : isDragging
    ? "var(--chakra-colors-gray-500) dashed 2px"
    : "transparent dashed 2px";

  return (
    <Flex
      bg={useColorModeValue("white", "gray.800")}
      borderWidth="1px"
      id={trackId}
      marginBottom={6}
      padding={4}
      rounded="md"
      boxShadow="lg"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      opacity={isDragOrigin ? 0.33 : 1}
      onTouchStart={() => {}}
      outline={dragOverStyle}
      ref={el => (trackRef.current = el)}
      sx={{
        transition: "outline 150ms",
        "> *": { ...(isActiveDragOver || (dragOriginIsInactive && isDragOrigin) ? { pointerEvents: "none" } : {}) }
      }}
    >
      <VStack spacing={2} alignItems="center" justifyContent="space-between" mr={4}>
        <Center as="label" color="gray.500" fontWeight="500" htmlFor={`trackTitle.${index}`} fontSize="1.5rem">
          {index + 1}
        </Center>
        <IconButton
          icon={<DragHandleIcon />}
          cursor="grab"
          draggable="true"
          onDragStart={handleDragStart(trackId, trackRef)}
          size="md"
          variant="ghost"
          _active={{ cursor: "grabbing" }}
          _grabbed={{ cursor: "grabbing" }}
        />
      </VStack>
      <VStack spacing={2} flex="1 1 auto" mr={4}>
        <Wrap spacing={8} width="100%">
          <WrapItem alignItems="center" flex="1 1 auto">
            <FormLabel color="gray.400" whiteSpace="nowrap" mb={0}>
              Title
            </FormLabel>
            <Input
              size="lg"
              isInvalid={errorTrackTitle}
              isRequired
              name="trackTitle"
              onChange={e => handleChange(e, trackId)}
              onDrop={() => false}
              placeholder={`Track ${index + 1} title`}
              value={trackTitle || ""}
              flex="1 1 auto"
            />
          </WrapItem>
          <WrapItem alignItems="center" flex="0 1 10rem">
            <FormLabel color="gray.400" whiteSpace="nowrap" mb={0}>
              Price
            </FormLabel>
            <Input
              size="lg"
              name="price"
              onBlur={formatPrice}
              onChange={handleChangePrice}
              onDrop={() => false}
              placeholder="e.g. 1.50"
              value={price ?? 1.5}
              flex="1 1 auto"
              inputMode="numeric"
            />
          </WrapItem>
        </Wrap>
        {errorTrackTitle ? (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle mr={2}>Error!</AlertTitle>
            <AlertDescription>{errorTrackTitle}</AlertDescription>
          </Alert>
        ) : null}
      </VStack>
      <AudioDropzone
        disablePreview
        handleChange={handleChange}
        index={index}
        trackId={trackId}
        trackTitle={trackTitle}
        status={status}
      />
      <VStack spacing={2} alignItems="center" justifyContent="space-between">
        <Menu onClose={() => trackMarkedForDeletion && cancelDeleteTrack(trackId)}>
          <MenuButton as={IconButton} aria-label="Options" icon={<HamburgerIcon />} variant="ghost" />
          <MenuList>
            <MenuItem
              isDisabled={!index}
              icon={<Icon icon={faArrowUp} />}
              onClick={() => handleMoveTrack(index, index - 1)}
            >
              Move track up
            </MenuItem>
            <MenuItem
              isDisabled={index + 1 === trackListLength}
              icon={<Icon icon={faArrowDown} />}
              onClick={() => handleMoveTrack(index, index + 1)}
            >
              Move track down
            </MenuItem>
            <MenuDivider />
            <MenuItem
              color={"red.300"}
              closeOnSelect={trackMarkedForDeletion ? true : false}
              icon={<Icon icon={faTrashAlt} />}
              onClick={() => handleDeleteTrack(trackId, trackTitle)}
              onKeyUp={({ key }) => (key === "Escape") & cancelDeleteTrack(trackId)}
            >
              {trackMarkedForDeletion ? "Are you sure?" : "Delete"}
            </MenuItem>
          </MenuList>
        </Menu>
      </VStack>
    </Flex>
  );
};

Track.propTypes = {
  cancelDeleteTrack: PropTypes.func,
  dragOverActive: PropTypes.bool,
  errorAudio: PropTypes.string,
  errorTrackTitle: PropTypes.string,
  index: PropTypes.number,
  isDragOrigin: PropTypes.bool,
  handleChange: PropTypes.func,
  handleDeleteTrack: PropTypes.func,
  handleDragEnd: PropTypes.func,
  handleDragEnter: PropTypes.func,
  handleDragLeave: PropTypes.func,
  handleDragOver: PropTypes.func,
  handleDragStart: PropTypes.func,
  handleDrop: PropTypes.func,
  handleMoveTrack: PropTypes.func,
  onDropAudio: PropTypes.func,
  trackId: PropTypes.string,
  trackTitle: PropTypes.string,
  trackListLength: PropTypes.number,
  trackMarkedForDeletion: PropTypes.bool,
  status: PropTypes.string
};

export default memo(Track);
