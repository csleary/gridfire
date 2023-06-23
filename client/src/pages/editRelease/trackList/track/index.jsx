import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Checkbox,
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
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { memo, useCallback, useEffect, useState } from "react";
import AudioDropzone from "./audioDropzone";
import { HamburgerIcon } from "@chakra-ui/icons";
import Icon from "components/icon";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { formatPrice } from "utils";

const Track = ({
  cancelDeleteTrack,
  dragOriginIsInactive,
  errorTrackTitle,
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
  trackId,
  trackListLength,
  trackMarkedForDeletion,
  savedState,
  setTrackErrors,
  updateState
}) => {
  const checkboxColour = useColorModeValue("yellow", "purple");
  const [values, setValues] = useState({});
  const { isBonus, isEditionOnly, price, status, trackTitle } = values;

  useEffect(() => {
    setValues(savedState);
  }, [savedState]);

  const updateTrack = useCallback(
    track => {
      updateState(prev => ({
        ...prev,
        trackList: prev.trackList.map(t => (t._id === trackId ? track : t))
      }));
    },
    [trackId, updateState]
  );

  const handleChange = useCallback(
    e => {
      const { name, value, type, checked } = e.currentTarget;
      setTrackErrors(({ [`${trackId}.${name}`]: key, ...rest }) => rest);

      if (name === "price") {
        setValues(prev => ({ ...prev, [name]: value.replace(/[^0-9.]/g, "") }));
      } else {
        setValues(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
      }
    },
    [setTrackErrors, trackId]
  );

  const handleBlur = useCallback(
    e => {
      const { checked, name, type, value } = e.currentTarget;

      if (name === "price") {
        const price = formatPrice(value);
        setValues(prev => ({ ...prev, price }));
        updateTrack({ ...values, price });
        return;
      }

      updateTrack({ ...values, [name]: type === "checkbox" ? checked : value });
    },
    [updateTrack, values]
  );

  const dragOverStyle = isActiveDragOver
    ? "var(--chakra-colors-purple-300) dashed 2px"
    : isDragging
    ? "var(--chakra-colors-gray-500) dashed 2px"
    : "transparent dashed 2px";

  const preventDrag = event => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <Flex
      bg={useColorModeValue("white", "gray.800")}
      borderWidth="1px"
      draggable={true}
      id={trackId}
      marginBottom={6}
      padding={4}
      rounded="md"
      boxShadow="lg"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      opacity={isDragOrigin ? 0.33 : 1}
      onTouchStart={() => {}}
      outline={dragOverStyle}
      overflow="visible"
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
              isInvalid={errorTrackTitle}
              isRequired
              id={`${trackId}.trackTitle`}
              name="trackTitle"
              onBlur={handleBlur}
              onChange={handleChange}
              onDragStart={preventDrag}
              onDrop={() => false}
              placeholder={`Track ${index + 1} title`}
              size="lg"
              value={trackTitle || ""}
              flex="1 1 auto"
            />
          </WrapItem>
          <WrapItem alignItems="center" flex="0 1 10rem">
            <FormLabel color="gray.400" htmlFor={`${trackId}.price`} whiteSpace="nowrap" mb={0}>
              Price
            </FormLabel>
            <Input
              draggable={true}
              id={`${trackId}.price`}
              name="price"
              onBlur={handleBlur}
              onChange={handleChange}
              onDragStart={preventDrag}
              onDrop={() => false}
              placeholder="e.g. 1.50"
              size="lg"
              value={price ?? 1.5}
              flex="1 1 auto"
              inputMode="numeric"
            />
          </WrapItem>
        </Wrap>
        <Wrap spacing={4}>
          {errorTrackTitle ? (
            <WrapItem>
              <Alert status="error">
                <AlertIcon />
                <AlertTitle mr={2}>Error!</AlertTitle>
                <AlertDescription>{errorTrackTitle}</AlertDescription>
              </Alert>
            </WrapItem>
          ) : null}
          <WrapItem>
            <Checkbox
              colorScheme={checkboxColour}
              isChecked={isBonus}
              name="isBonus"
              onBlur={handleBlur}
              onChange={handleChange}
            >
              Download bonus
            </Checkbox>
          </WrapItem>
          <WrapItem>
            <Checkbox
              colorScheme={checkboxColour}
              isChecked={isEditionOnly}
              name="isEditionOnly"
              onBlur={handleBlur}
              onChange={handleChange}
            >
              Edition exclusive
            </Checkbox>
          </WrapItem>
        </Wrap>
      </VStack>
      <AudioDropzone
        disablePreview
        index={index}
        setTrackErrors={setTrackErrors}
        setValues={setValues}
        status={status}
        trackId={trackId}
        trackTitle={trackTitle}
        updateTrackTitle={trackTitle => updateTrack({ ...values, trackTitle })}
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

export default memo(Track);
