import { Box, Flex, Progress, Text } from "@chakra-ui/react";
import { cancelUpload, uploadAudio } from "features/tracks";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastInfo } from "features/toast";
import PropTypes from "prop-types";
import TextSpinner from "components/textSpinner";
import { updateTrackStatus } from "features/releases";
import { useDropzone } from "react-dropzone";
import { useState } from "react";
import Icon from "components/icon";
import { faPlusCircle, faSyncAlt, faTimes } from "@fortawesome/free-solid-svg-icons";
import { faThumbsUp, faTimesCircle } from "@fortawesome/free-regular-svg-icons";

const AudioDropzone = ({ handleChange, index, status, trackId, trackTitle }) => {
  const dispatch = useDispatch();
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);

  const { audioUploadProgress, encodingProgressFLAC, storingProgressFLAC, transcodingProgressAAC } = useSelector(
    state => state.tracks,
    shallowEqual
  );

  const [hoverActive, setHoverActive] = useState(false);
  const releaseId = release._id;
  const isEncoding = status === "encoding";
  const isPending = status === "pending";
  const isStored = status === "stored";
  const isTranscoding = status === "transcoding";
  const isUploading = status === "uploading";

  const handleClick = e => {
    if (isUploading) {
      dispatch(cancelUpload(trackId));
      dispatch(updateTrackStatus({ releaseId, trackId, status: "pending" }));
      e.stopPropagation();
    }
  };

  const onDropAudio = (accepted, rejected) => {
    if (rejected?.length) {
      return dispatch(
        toastError({
          message: "This does not seem to be an audio file. Please select a wav or aiff audio file.",
          title: "File type error"
        })
      );
    }

    const audioFile = accepted[0];
    if (!trackTitle) handleChange({ target: { name: "trackTitle", value: audioFile.name } }, trackId);
    const trackName = trackTitle ? `\u2018${trackTitle}\u2019` : `track ${parseInt(index, 10) + 1}`;

    dispatch(
      toastInfo({ message: `Uploading file \u2018${audioFile.name}\u2019 for ${trackName}.`, title: "Uploading" })
    );

    dispatch(uploadAudio({ releaseId, trackId, trackName, audioFile, mimeType: audioFile.type })).catch(error =>
      dispatch(toastError({ message: `Upload failed! ${error.message}`, title: "Error" }))
    );
  };

  const { getRootProps, getInputProps, isDragAccept, isDragActive, isDragReject } = useDropzone({
    accept: [
      "audio/aiff",
      "audio/x-aiff",
      "audio/flac",
      "audio/x-flac",
      "audio/wav",
      "audio/wave",
      "audio/vnd.wave",
      "audio/x-wave"
    ],
    disabled: isTranscoding || isEncoding,
    multiple: false,
    noDragEventsBubbling: true,
    noKeyboard: true,
    onDrop: onDropAudio
  });

  return (
    <Flex
      onMouseOver={() => setHoverActive(true)}
      onMouseOut={() => setHoverActive(false)}
      alignItems="center"
      borderColor="gray.300"
      borderStyle="dashed"
      borderWidth="2px"
      color="gray.500"
      flexDirection="column"
      fontWeight="500"
      justifyContent="center"
      flex="0 1 32rem"
      overflow="hidden"
      position="relative"
      rounded="lg"
      shadow="inner"
      transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
      _hover={{ cursor: "pointer" }}
      sx={{
        ...(isDragReject
          ? { backgroundColor: "red.50", borderColor: "red.500", color: "red.500" }
          : isDragAccept || isStored
          ? { backgroundColor: "green.50", borderColor: "green.500", color: "green.500" }
          : isUploading || isEncoding || isTranscoding
          ? { backgroundColor: "blue.50", borderColor: "blue.500", color: "blue.500" }
          : {})
      }}
      {...getRootProps({ onClick: handleClick })}
    >
      <input {...getInputProps()} />
      {isEncoding || isTranscoding ? null : isDragReject ? (
        <Text>
          <Icon icon={faTimesCircle} fixedWidth mr={2} />
          File not accepted!
        </Text>
      ) : isDragActive && !isUploading ? (
        <Text>
          <Icon icon={faThumbsUp} fixedWidth mr={2} />
          Drop it!
        </Text>
      ) : hoverActive && isUploading ? (
        <Text>
          <Icon icon={faTimes} fixedWidth mr={2} />
          Cancel
        </Text>
      ) : isStored ? (
        <Text>
          <Icon icon={faSyncAlt} fixedWidth mr={2} />
          Replace Audio
        </Text>
      ) : !isUploading ? (
        <Text>
          <Icon icon={faPlusCircle} fixedWidth mr={2} />
          Upload Audio
        </Text>
      ) : null}
      {!isStored && !isPending ? (
        <Box as="span">
          <TextSpinner
            isActive={isUploading || isEncoding || isTranscoding}
            type={isUploading ? "lines" : isEncoding ? "nemp3" : "braille"}
            speed={0.01}
          />
          {isUploading
            ? audioUploadProgress[trackId]
              ? `Uploading: ${audioUploadProgress[trackId]?.toString(10).padStart(2, "0")}%`
              : "Uploading…"
            : isEncoding
            ? storingProgressFLAC[trackId]?.message ?? encodingProgressFLAC[trackId]?.message ?? "Encoding…"
            : isTranscoding
            ? transcodingProgressAAC[trackId]?.message ?? "Transcoding…"
            : null}
        </Box>
      ) : null}
      <Progress
        isIndeterminate={isEncoding || isTranscoding}
        value={audioUploadProgress[trackId]}
        bottom={0}
        left={0}
        right={0}
        position="absolute"
        variant={
          isDragReject ? "dragReject" : isDragAccept || isStored ? "dragAccept" : isUploading ? "uploading" : false
        }
      />
    </Flex>
  );
};

AudioDropzone.propTypes = {
  trackId: PropTypes.string
};

export default AudioDropzone;
