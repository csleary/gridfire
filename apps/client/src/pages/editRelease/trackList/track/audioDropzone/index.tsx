import { Box, Wrap, WrapItem, useColorModeValue } from "@chakra-ui/react";
import { MouseEventHandler, memo } from "react";
import { cancelUpload, uploadAudio } from "state/tracks";
import { faServer, faUpload } from "@fortawesome/free-solid-svg-icons";
import { toastError, toastInfo } from "state/toast";
import { trackSetError, trackUpdate } from "state/editor";
import { useDispatch, useSelector } from "hooks";
import { EntityId } from "@reduxjs/toolkit";
import Icon from "components/icon";
import ProgressIndicator from "./progressIndicator";
import mime from "mime";
import { updateTrackStatus } from "state/editor";
import { useDropzone } from "react-dropzone";

interface AcceptedFileTypes {
  [key: string]: string[];
}

const acceptedFileTypes = [".aif", ".aiff", ".flac", ".wav"].reduce((prev, ext) => {
  const type = mime.getType(ext);
  if (!type) return prev;
  return { ...prev, [type]: [...(prev[type] || []), ext] };
}, {} as AcceptedFileTypes);

interface Props {
  index: number;
  status: string;
  trackId: EntityId;
  trackTitle: string;
}

const AudioDropzone = ({ index, status, trackId, trackTitle }: Props) => {
  const dispatch = useDispatch();
  const audioUploadProgress = useSelector(state => state.tracks.audioUploadProgress[trackId]);
  const encodingProgressFLAC = useSelector(state => state.tracks.encodingProgressFLAC[trackId]);
  const releaseId = useSelector(state => state.editor.release._id);
  const storingProgressFLAC = useSelector(state => state.tracks.storingProgressFLAC[trackId]);
  const transcodingCompleteAAC = useSelector(state => state.tracks.transcodingCompleteAAC[trackId]);
  const transcodingCompleteMP3 = useSelector(state => state.tracks.transcodingCompleteMP3[trackId]);
  const transcodingStartedAAC = useSelector(state => state.tracks.transcodingStartedAAC[trackId]);
  const transcodingStartedMP3 = useSelector(state => state.tracks.transcodingStartedMP3[trackId]);
  const isEncoding = status === "encoding" || (encodingProgressFLAC > 0 && !storingProgressFLAC);
  const isStored = status === "stored";
  const isTranscoding = status === "transcoding" || (transcodingStartedAAC && !transcodingCompleteMP3);
  const isUploading = audioUploadProgress > 0 && audioUploadProgress < 100;

  const handleClick: MouseEventHandler = e => {
    if (isUploading) {
      dispatch(cancelUpload(trackId));
      dispatch(updateTrackStatus({ id: trackId, changes: { status: "pending" } }));
      e.stopPropagation();
    }
  };

  const onDrop = (accepted: any, rejected: any) => {
    if (rejected?.length) {
      return dispatch(
        toastError({
          message: "This does not seem to be an audio file. Please select a wav or aiff audio file.",
          title: "File type error"
        })
      );
    }

    const [audioFile] = accepted;
    const { name } = audioFile;

    if (!trackTitle && name) {
      dispatch(trackSetError({ trackId, name, value: "" }));
      dispatch(trackUpdate({ id: trackId, changes: { trackTitle: name } }));
    }

    const trackName = trackTitle ? `'${trackTitle}'` : `track ${index + 1}`;
    dispatch(toastInfo({ message: `Uploading file '${name}' for ${trackName}.`, title: "Uploading" }));

    dispatch(uploadAudio({ releaseId, trackId, trackName, audioFile })).catch((error: any) =>
      dispatch(toastError({ message: `Upload failed! ${error.message}`, title: "Error" }))
    );
  };

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    accept: acceptedFileTypes,
    disabled: isEncoding || isTranscoding,
    multiple: false,
    noDragEventsBubbling: true,
    noKeyboard: false,
    onDrop
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
      mr={4}
      padding={4}
      rounded="lg"
      spacing={4}
      transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
      _hover={{
        backgroundColor: useColorModeValue("white", "black"),
        borderColor: useColorModeValue("green.400", "purple.300"),
        cursor: "pointer"
      }}
      {...getRootProps({ onClick: handleClick })}
    >
      <input name="trackTitle" {...getInputProps()} />
      <WrapItem>
        <ProgressIndicator
          color="purple.200"
          isStored={isStored}
          labelColor={useColorModeValue("purple.300", "purple.200")}
          progress={audioUploadProgress}
          stageHasStarted={audioUploadProgress > 0}
          stageName="upload"
          tooltipText="Audio file upload progress."
          trackId={trackId}
        >
          <Icon icon={faUpload} />
        </ProgressIndicator>
      </WrapItem>
      <WrapItem>
        <ProgressIndicator
          color="blue.200"
          isStored={isStored}
          labelColor="blue.200"
          progress={encodingProgressFLAC}
          stageHasStarted={encodingProgressFLAC > 0}
          stageName="flac"
          tooltipText="Lossless FLAC encoding progress."
          trackId={trackId}
        />
      </WrapItem>
      <WrapItem>
        <ProgressIndicator
          color="green.200"
          isStored={isStored}
          labelColor={useColorModeValue("green.300", "green.200")}
          progress={storingProgressFLAC}
          stageHasStarted={storingProgressFLAC > 0}
          stageName="storage"
          tooltipText="Storage status."
          trackId={trackId}
        >
          <Icon icon={faServer} />
        </ProgressIndicator>
      </WrapItem>
      <WrapItem>
        <ProgressIndicator
          color={useColorModeValue("yellow.300", "yellow.200")}
          isStored={isStored}
          labelColor={useColorModeValue("yellow.500", "yellow.300")}
          progress={transcodingCompleteAAC ? 100 : 0}
          stageHasStarted={transcodingStartedAAC}
          stageName="aac"
          tooltipText="AAC streaming audio encoding progress."
          trackId={trackId}
        >
          <Box as="span">AAC</Box>
        </ProgressIndicator>
      </WrapItem>
      <WrapItem>
        <ProgressIndicator
          color={useColorModeValue("orange.400", "orange.200")}
          isStored={isStored}
          progress={transcodingCompleteMP3 ? 100 : 0}
          stageHasStarted={transcodingStartedMP3}
          stageName="mp3"
          tooltipText="MP3 download encoding progress."
          trackId={trackId}
        >
          <Box as="span">MP3</Box>
        </ProgressIndicator>
      </WrapItem>
    </Wrap>
  );
};

export default memo(AudioDropzone);
