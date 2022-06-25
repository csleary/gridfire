import { Wrap, WrapItem, useColorModeValue } from "@chakra-ui/react";
import { cancelUpload, uploadAudio } from "state/tracks";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastInfo } from "state/toast";
import ProgressIndicator from "./progressIndicator";
import PropTypes from "prop-types";
import Icon from "components/icon";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import mime from "mime";
import { updateTrackStatus } from "state/releases";
import { useDropzone } from "react-dropzone";

const acceptedFileTypes = [".aif", ".aiff", ".flac", ".wav"].reduce(
  (prev, ext) => ({ ...prev, [mime.getType(ext)]: [...(prev[mime.getType(ext)] || []), ext] }),
  {}
);

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

  const isEncoding = status === "encoding" || (encodingProgressFLAC[trackId] > 0 && !storingProgressFLAC);
  const isStored = status === "stored";
  const isTranscoding =
    status === "transcoding" || (transcodingStartedAAC[trackId] && !transcodingCompleteMP3[trackId]);
  const isUploading = audioUploadProgress[trackId] > 0 && audioUploadProgress[trackId] < 100;

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
    accept: acceptedFileTypes,
    disabled: isEncoding || isTranscoding,
    multiple: false,
    noDragEventsBubbling: true,
    noKeyboard: false,
    onDrop: onDropAudio
  });

  return (
    <Wrap
      backgroundColor={useColorModeValue("gray.50", "gray.900")}
      borderColor={useColorModeValue("gray.400", isDragReject ? "red" : "gray.600")}
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
        backgroundColor: useColorModeValue("white", "black"),
        borderColor: useColorModeValue("green.400", "purple.300"),
        cursor: "pointer"
      }}
      mr={4}
      {...getRootProps({ onClick: handleClick })}
    >
      <input {...getInputProps()} />
      <WrapItem>
        <ProgressIndicator
          color="blue.200"
          labelColor="blue.200"
          isStored={isStored}
          progress={audioUploadProgress[trackId]}
          stageHasStarted={audioUploadProgress[trackId] > 0}
          stageName="upload"
          tooltipText="Audio file upload progress."
          trackId={trackId}
        >
          <Icon icon={faUpload} />
        </ProgressIndicator>
      </WrapItem>
      <WrapItem>
        <ProgressIndicator
          color="purple.200"
          labelColor={useColorModeValue("purple.300", "purple.200")}
          isStored={isStored}
          progress={encodingProgressFLAC[trackId]}
          stageHasStarted={encodingProgressFLAC[trackId] > 0}
          stageName="flac"
          tooltipText="Lossless FLAC encoding progress."
          trackId={trackId}
        />
      </WrapItem>
      <WrapItem>
        <ProgressIndicator
          color="green.200"
          labelColor={useColorModeValue("green.300", "green.200")}
          isStored={isStored}
          progress={storingProgressFLAC[trackId]}
          stageHasStarted={storingProgressFLAC[trackId] > 0}
          stageName="ipfs"
          tooltipText="IPFS storing status. Note: this is via a local node. It will take longer to propagate across nodes."
          trackId={trackId}
        />
      </WrapItem>
      <WrapItem>
        <ProgressIndicator
          color={useColorModeValue("yellow.300", "yellow.200")}
          labelColor={useColorModeValue("yellow.500", "yellow.300")}
          isStored={isStored}
          progress={transcodingCompleteAAC[trackId] ? 100 : 0}
          stageHasStarted={transcodingStartedAAC[trackId]}
          stageName="aac"
          tooltipText="AAC streaming audio encoding progress."
          trackId={trackId}
        >
          AAC
        </ProgressIndicator>
      </WrapItem>
      <WrapItem>
        <ProgressIndicator
          color={useColorModeValue("orange.400", "orange.200")}
          isStored={isStored}
          progress={transcodingCompleteMP3[trackId] ? 100 : 0}
          stageHasStarted={transcodingStartedMP3[trackId]}
          stageName="mp3"
          tooltipText="MP3 download encoding progress."
          trackId={trackId}
        >
          MP3
        </ProgressIndicator>
      </WrapItem>
    </Wrap>
  );
};

AudioDropzone.propTypes = {
  trackId: PropTypes.string
};

export default AudioDropzone;
