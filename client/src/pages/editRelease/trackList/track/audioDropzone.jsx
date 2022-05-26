import { CircularProgress, CircularProgressLabel, Wrap, WrapItem, useColorModeValue } from "@chakra-ui/react";
import { cancelUpload, uploadAudio } from "state/tracks";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastInfo } from "state/toast";
import PropTypes from "prop-types";
import Icon from "components/icon";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import { updateTrackStatus } from "state/releases";
import { useDropzone } from "react-dropzone";

const AudioDropzone = ({ handleChange, index, status, trackId, trackTitle }) => {
  const dispatch = useDispatch();
  const { _id: releaseId } = useSelector(state => state.releases.activeRelease, shallowEqual);

  const {
    audioUploadProgress,
    encodingProgressFLAC,
    storingProgressFLAC,
    transcodingStartedAAC,
    transcodingCompleteAAC,
    transcodingStartedMP3,
    transcodingCompleteMP3
  } = useSelector(state => state.tracks, shallowEqual);

  const isEncoding = status === "encoding";
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

  const progressLabelAAC = useColorModeValue("yellow.400", "yellow.300");

  return (
    <Wrap
      backgroundColor={useColorModeValue("gray.50", "gray.900")}
      borderColor={useColorModeValue("gray.400", "gray.600")}
      borderStyle="dashed"
      borderWidth="2px"
      color="gray.500"
      flex="0 1 auto"
      fontWeight="500"
      justifyContent="center"
      padding={4}
      rounded="lg"
      spacing={4}
      transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
      _hover={{
        backgroundColor: useColorModeValue("white"),
        borderColor: useColorModeValue("green.400", "purple.300"),
        cursor: "pointer"
      }}
      mr={4}
      {...getRootProps({ onClick: handleClick })}
    >
      <input {...getInputProps()} />
      <WrapItem>
        <CircularProgress
          trackColor={useColorModeValue("gray.300", "gray.600")}
          color="blue.200"
          size="4rem"
          thickness=".75rem"
          value={isStored ? 100 : audioUploadProgress[trackId]}
        >
          <CircularProgressLabel
            color={isStored || audioUploadProgress[trackId] > 0 ? "blue.200" : "gray.600"}
            transition="color 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
          >
            {audioUploadProgress[trackId] || <Icon icon={faUpload} />}
          </CircularProgressLabel>
        </CircularProgress>
      </WrapItem>
      <WrapItem>
        <CircularProgress
          trackColor={useColorModeValue("gray.300", "gray.600")}
          color="purple.200"
          size="4rem"
          thickness=".75rem"
          value={isStored ? 100 : encodingProgressFLAC[trackId]}
        >
          <CircularProgressLabel
            color={isStored || encodingProgressFLAC[trackId] > 0 ? "purple.300" : "gray.600"}
            transition="color 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
          >
            {encodingProgressFLAC[trackId] || "FLAC"}
          </CircularProgressLabel>
        </CircularProgress>
      </WrapItem>
      <WrapItem>
        <CircularProgress
          trackColor={useColorModeValue("gray.300", "gray.600")}
          color="green.200"
          size="4rem"
          thickness=".75rem"
          value={isStored ? 100 : storingProgressFLAC[trackId]}
        >
          <CircularProgressLabel
            color={isStored || storingProgressFLAC[trackId] > 0 ? "green.300" : "gray.600"}
            transition="color 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
          >
            IPFS
          </CircularProgressLabel>
        </CircularProgress>
      </WrapItem>
      <WrapItem>
        <CircularProgress
          trackColor={useColorModeValue("gray.300", "gray.600")}
          color={useColorModeValue("yellow.300", "yellow.200")}
          size="4rem"
          thickness=".75rem"
          value={isStored || transcodingCompleteAAC[trackId] ? 100 : 0}
          isIndeterminate={transcodingStartedAAC[trackId] && !transcodingCompleteAAC[trackId]}
        >
          <CircularProgressLabel
            color={isStored || transcodingStartedAAC[trackId] ? progressLabelAAC : "gray.600"}
            transition="color 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
          >
            AAC
          </CircularProgressLabel>
        </CircularProgress>
      </WrapItem>
      <WrapItem>
        <CircularProgress
          trackColor={useColorModeValue("gray.300", "gray.600")}
          color="orange.200"
          size="4rem"
          thickness=".75rem"
          value={isStored || transcodingCompleteMP3[trackId] ? 100 : 0}
          isIndeterminate={transcodingStartedMP3[trackId] && !transcodingCompleteMP3[trackId]}
        >
          <CircularProgressLabel
            color={isStored || transcodingStartedMP3[trackId] ? "orange.300" : "gray.600"}
            transition="color 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
          >
            MP3
          </CircularProgressLabel>
        </CircularProgress>
      </WrapItem>
    </Wrap>
  );
};

AudioDropzone.propTypes = {
  trackId: PropTypes.string
};

export default AudioDropzone;
