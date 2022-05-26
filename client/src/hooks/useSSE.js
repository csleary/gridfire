import {
  setEncodingProgressFLAC,
  setStoringProgressFLAC,
  setTranscodingStartedAAC,
  setTranscodingCompleteAAC,
  setTranscodingStartedMP3,
  setTranscodingCompleteMP3
} from "state/tracks";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastInfo, toastSuccess, toastWarning } from "state/toast";
import { setArtworkUploading } from "state/artwork";
import { useEffect, useRef } from "react";
import { updateTrackStatus } from "state/releases";
import axios from "axios";

const useSSE = () => {
  const dispatch = useDispatch();
  const sourceRef = useRef();
  const { userId } = useSelector(state => state.user, shallowEqual);

  useEffect(() => {
    const uuid = window.crypto.randomUUID();
    const cleanup = () => axios.delete(`/api/sse/${userId}/${uuid}`);

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

    const handleArtworkUploaded = () => {
      dispatch(setArtworkUploading(false));
    };

    const handleEncodingProgressFLAC = event => {
      const { progress, trackId } = JSON.parse(event.data);
      dispatch(setEncodingProgressFLAC({ progress, trackId }));
    };

    const handleStoringProgressFLAC = event => {
      const { progress, trackId } = JSON.parse(event.data);
      dispatch(setStoringProgressFLAC({ progress, trackId }));
    };

    const handleTranscodingStartedAAC = event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingStartedAAC({ trackId }));
    };

    const handleTranscodingCompleteAAC = event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingCompleteAAC({ trackId }));
    };

    const handleTranscodingStartedMP3 = event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingStartedMP3({ trackId }));
    };

    const handleTranscodingCompleteMP3 = event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingCompleteMP3({ trackId }));
    };

    const handleUpdateTrackStatus = event => {
      const { releaseId, status, trackId } = JSON.parse(event.data);
      dispatch(updateTrackStatus({ releaseId, status, trackId }));
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
      source.addEventListener("notify", handleNotify);
      source.addEventListener("storingProgressFLAC", handleStoringProgressFLAC);
      source.addEventListener("transcodingStartedAAC", handleTranscodingStartedAAC);
      source.addEventListener("transcodingCompleteAAC", handleTranscodingCompleteAAC);
      source.addEventListener("transcodingStartedMP3", handleTranscodingStartedMP3);
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
        source.removeEventListener("notify", handleNotify);
        source.removeEventListener("storingProgressFLAC", handleStoringProgressFLAC);
        source.removeEventListener("transcodingStartedAAC", handleTranscodingStartedAAC);
        source.removeEventListener("transcodingCompleteAAC", handleTranscodingCompleteAAC);
        source.removeEventListener("transcodingStartedMP3", handleTranscodingStartedMP3);
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
