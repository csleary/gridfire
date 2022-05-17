import { Alert, AlertIcon, Button, Flex, HStack, IconButton, Input, Spacer, useColorModeValue } from "@chakra-ui/react";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import AudioDropzone from "./audioDropzone";
import Icon from "components/icon";
import PropTypes from "prop-types";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { memo } from "react";

const Track = props => {
  const {
    cancelDeleteTrack,
    dragOverActive,
    errorAudio,
    errorTrackTitle,
    index,
    isDragOrigin,
    handleChange,
    handleDeleteTrack,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleMoveTrack,
    trackId,
    trackTitle,
    trackListLength,
    trackMarkedForDeletion,
    status
  } = props;

  const hasError = status === "error" || errorAudio;

  return (
    <Flex
      bg={useColorModeValue("white", "gray.800")}
      borderWidth="1px"
      marginBottom={6}
      padding={4}
      rounded="md"
      boxShadow="lg"
      draggable="true"
      onDragStart={() => handleDragStart(index)}
      onDragEnter={() => handleDragEnter(index)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={() => handleDrop(index)}
      onDragEnd={handleDragEnd}
      opacity={isDragOrigin ? 0.33 : 1}
      onTouchStart={() => {
        return;
      }}
      outline={dragOverActive && !isDragOrigin ? "var(--chakra-colors-blue-500) dashed 2px" : "none"}
      sx={{ "> *": { ...(dragOverActive ? { pointerEvents: "none" } : {}) } }}
    >
      <Flex flexDirection="column" flex="1 1 auto" mr={4}>
        <Flex marginBottom={4}>
          <Flex
            as="label"
            color="gray.500"
            fontWeight="500"
            htmlFor={`trackTitle.${index}`}
            alignItems="center"
            fontSize="1.5rem"
            ml={2}
            mr={4}
          >
            {index + 1}
          </Flex>
          <Input
            isRequired
            name="trackTitle"
            onChange={e => handleChange(e, trackId)}
            onDrop={() => false}
            placeholder={`Track ${index + 1} Title`}
            value={trackTitle || ""}
            flex="1 1 auto"
          />
        </Flex>
        <HStack spacing={4}>
          <Flex
            alignItems="center"
            color="gray.500"
            cursor="grab"
            paddingX={2}
            rounded="sm"
            _grabbed={{ cursor: "grabbing" }}
            _hover={{ backgroundColor: "gray.200" }}
          >
            ⠿
          </Flex>
          {index < trackListLength - 1 ? (
            <IconButton
              icon={<Icon icon={faArrowDown} />}
              onClick={() => handleMoveTrack(index, index + 1)}
              size="sm"
              title="Move Down"
              variant="ghost"
            />
          ) : null}
          {index > 0 ? (
            <IconButton
              icon={<Icon icon={faArrowUp} />}
              onClick={() => handleMoveTrack(index, index - 1)}
              size="sm"
              title="Move Up"
              variant={"ghost"}
            />
          ) : null}
          {hasError || errorTrackTitle ? (
            <Alert status="error">
              <AlertIcon />
              {hasError || "Audio processing error. Please re-upload or delete this track."}
            </Alert>
          ) : null}
          <Spacer />
          <Button
            colorScheme="red"
            leftIcon={<Icon icon={faTrashAlt} />}
            onBlur={() => cancelDeleteTrack(trackId)}
            onKeyUp={({ key }) => (key === "Escape") & cancelDeleteTrack(trackId)}
            onClick={() => handleDeleteTrack(trackId, trackTitle)}
            size="sm"
            title="Delete Track"
            ml="auto"
            variant={trackMarkedForDeletion ? "solid" : "ghost"}
          >
            {trackMarkedForDeletion ? "Confirm!" : "Delete"}
          </Button>
        </HStack>
      </Flex>
      <AudioDropzone
        disablePreview
        handleChange={handleChange}
        index={index}
        trackId={trackId}
        trackTitle={trackTitle}
        status={status}
      />
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
