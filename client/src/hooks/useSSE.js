import {
  setEncodingComplete,
  setEncodingProgressFLAC,
  setStoringProgressFLAC,
  setTranscodingComplete,
  setTranscodingProgressAAC,
  setUploadProgress
} from "features/tracks";
import { setFormatExists, updateTrackStatus } from "features/releases";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastInfo, toastSuccess, toastWarning } from "features/toast";
import { batch } from "react-redux";
import { setArtworkUploading } from "features/artwork";
import { useEffect, useRef } from "react";
import axios from "axios";

const useSSE = () => {
  const dispatch = useDispatch();
  const sourceRef = useRef();
  const { userId } = useSelector(state => state.user, shallowEqual);

  useEffect(() => {
    const uuid = window.crypto.randomUUID();
    const cleanup = () => axios.delete(`/api/sse/${userId}/${uuid}`);

    const handleArtworkUploaded = () => {
      batch(() => {
        dispatch(setArtworkUploading(false));
        dispatch(toastSuccess({ message: "Artwork uploaded.", title: "Done!" }));
      });
    };

    const handleEncodingProgressFLAC = event => {
      const { message, trackId } = JSON.parse(event.data);
      dispatch(setEncodingProgressFLAC({ message, trackId }));
    };
    const handleEncodingCompleteFLAC = event => {
      const { trackId } = JSON.parse(event.data);
      batch(() => {
        dispatch(setEncodingComplete({ trackId }));
        dispatch(setUploadProgress({ trackId, percent: 0 }));
      });
    };

    const handleNotify = event => {
      const { type, message } = JSON.parse(event.data);

      switch (type) {
        case "error":
          return dispatch(toastError({ message }));
        case "info":
          return dispatch(toastInfo({ message }));
        case "success":
          return dispatch(toastSuccess({ message }));
        case "warning":
          return dispatch(toastWarning({ message }));
        default:
          return dispatch(toastInfo({ message }));
      }
    };

    const handleStoringProgressFLAC = event => {
      const { message, trackId } = JSON.parse(event.data);
      dispatch(setStoringProgressFLAC({ message, trackId }));
    };

    const handleTranscodingProgressAAC = event => {
      const { message, trackId } = JSON.parse(event.data);
      dispatch(setTranscodingProgressAAC({ message, trackId }));
    };

    const handleTranscodingCompleteAAC = event => {
      const { trackId, trackName } = JSON.parse(event.data);
      batch(() => {
        dispatch(
          toastSuccess({
            message: `Transcoding complete. ${trackName} added!`,
            title: "Transcode Streaming Audio"
          })
        );
        dispatch(setTranscodingComplete({ trackId }));
      });
    };

    const handleTranscodingCompleteMP3 = ({ releaseId, format, exists }) => {
      dispatch(setFormatExists({ releaseId, format, exists }));
    };

    const handleUpdateTrackStatus = event => {
      const { releaseId, trackId, status } = JSON.parse(event.data);
      dispatch(updateTrackStatus({ releaseId, trackId, status }));
    };

    const handleWorkerMessage = event => {
      const { message, title } = JSON.parse(event.data);
      dispatch(toastInfo({ message, title }));
    };

    if (userId && !sourceRef.current) {
      sourceRef.current = new EventSource(`/api/sse/${userId}/${uuid}`);
      const source = sourceRef.current;
      source.onopen = () => console.log("[SSE] Connection to server opened.");
      source.onmessage = event => console.log(event.data);
      source.onerror = error => console.log(`[SSE] Error: ${JSON.stringify(error, null, 2)}`);
      source.addEventListener("artworkUploaded", handleArtworkUploaded);
      source.addEventListener("encodingProgressFLAC", handleEncodingProgressFLAC);
      source.addEventListener("encodingCompleteFLAC", handleEncodingCompleteFLAC);
      source.addEventListener("notify", handleNotify);
      source.addEventListener("storingProgressFLAC", handleStoringProgressFLAC);
      source.addEventListener("transcodingProgressAAC", handleTranscodingProgressAAC);
      source.addEventListener("transcodingCompleteAAC", handleTranscodingCompleteAAC);
      source.addEventListener("transcodingCompleteMP3", handleTranscodingCompleteMP3);
      source.addEventListener("updateTrackStatus", handleUpdateTrackStatus);
      source.addEventListener("workerMessage", handleWorkerMessage);
      window.addEventListener("beforeunload", cleanup);
    }

    return () => {
      if (sourceRef.current) {
        const source = sourceRef.current;
        source.removeEventListener("artworkUploaded", handleArtworkUploaded);
        source.removeEventListener("encodingProgressFLAC", handleEncodingProgressFLAC);
        source.removeEventListener("encodingCompleteFLAC", handleEncodingCompleteFLAC);
        source.removeEventListener("notify", handleNotify);
        source.removeEventListener("storingProgressFLAC", handleStoringProgressFLAC);
        source.removeEventListener("transcodingProgressAAC", handleTranscodingProgressAAC);
        source.removeEventListener("transcodingCompleteAAC", handleTranscodingCompleteAAC);
        source.removeEventListener("transcodingCompleteMP3", handleTranscodingCompleteMP3);
        source.removeEventListener("updateTrackStatus", handleUpdateTrackStatus);
        source.removeEventListener("workerMessage", handleWorkerMessage);
        sourceRef.current = null;
        window.removeEventListener("beforeunload", cleanup);
      }
    };
  }, [dispatch, userId]);
};

export default useSSE;
