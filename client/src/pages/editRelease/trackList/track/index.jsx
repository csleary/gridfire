import {
  Alert,
  AlertIcon,
  Button,
  Center,
  Flex,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuList,
  MenuItem,
  Spacer,
  VStack,
  useColorModeValue,
  FormLabel
} from "@chakra-ui/react";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { DragHandleIcon, HamburgerIcon } from "@chakra-ui/icons";
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
      outline={
        dragOverActive && !isDragOrigin ? "var(--chakra-colors-purple-300) dashed 2px" : "transparent dashed 2px"
      }
      sx={{ transition: "outline 250ms", "> *": { ...(dragOverActive ? { pointerEvents: "none" } : {}) } }}
    >
      <VStack spacing={2} alignItems="center" justifyContent="space-between" mr={4}>
        <Center as="label" color="gray.500" fontWeight="500" htmlFor={`trackTitle.${index}`} fontSize="1.5rem">
          {index + 1}
        </Center>
        <IconButton
          icon={<DragHandleIcon />}
          cursor="grab"
          size="md"
          variant="ghost"
          _active={{ cursor: "grabbing" }}
          _grabbed={{ cursor: "grabbing" }}
        />
      </VStack>
      <Flex alignItems="center" alignSelf="flex-start" flex="1 0 auto">
        <FormLabel color="gray.400" whiteSpace="nowrap">
          Title
        </FormLabel>
        <Input
          size="lg"
          isRequired
          name="trackTitle"
          onChange={e => handleChange(e, trackId)}
          onDrop={() => false}
          placeholder={`Track ${index + 1} Title`}
          value={trackTitle || ""}
          flex="1 1 auto"
          mr={4}
        />
      </Flex>
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
