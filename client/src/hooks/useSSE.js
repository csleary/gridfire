import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { usePrevious } from "@chakra-ui/react";
import {
  setEncodingComplete,
  setEncodingProgressFLAC,
  setStoringProgressFLAC,
  setTranscodingComplete,
  setTranscodingProgressAAC,
  setUploadProgress
} from "features/tracks";
import { setFormatExists, updateTrackStatus } from "features/releases";
import { toastError, toastInfo, toastSuccess, toastWarning } from "features/toast";
import { batch } from "react-redux";
import { setArtworkUploading } from "features/artwork";

const useSSE = () => {
  const dispatch = useDispatch();
  const sse = useRef();
  const { userId } = useSelector(state => state.user, shallowEqual);
  const prevUserId = usePrevious(userId);

  useEffect(() => {
    if (userId && userId !== prevUserId) {
      if (sse.current) return;
      sse.current = new EventSource(`/api/sse/${userId}`);

      sse.current.onmessage = event => {
        console.log(event.data);
      };

      sse.current.addEventListener("artworkUploaded", () => {
        batch(() => {
          dispatch(setArtworkUploading(false));
          dispatch(toastSuccess("Artwork uploaded."));
        });
      });

      sse.current.addEventListener("encodingProgressFLAC", event => {
        const { message, trackId } = JSON.parse(event.data);
        dispatch(setEncodingProgressFLAC({ message, trackId }));
      });

      sse.current.addEventListener("encodingCompleteFLAC", event => {
        const { trackId } = JSON.parse(event.data);
        batch(() => {
          dispatch(setEncodingComplete({ trackId }));
          dispatch(setUploadProgress({ trackId, percent: 0 }));
        });
      });

      sse.current.addEventListener("notify", event => {
        const { type, message } = JSON.parse(event.data);

        switch (type) {
          case "error":
            return dispatch(toastError(message));
          case "info":
            return dispatch(toastInfo(message));
          case "success":
            return dispatch(toastSuccess(message));
          case "warning":
            return dispatch(toastWarning(message));
          default:
            return dispatch(toastInfo(message));
        }
      });

      sse.current.addEventListener("storingProgressFLAC", event => {
        const { message, trackId } = JSON.parse(event.data);
        dispatch(setStoringProgressFLAC({ message, trackId }));
      });

      sse.current.addEventListener("transcodingProgressAAC", event => {
        const { message, trackId } = JSON.parse(event.data);
        dispatch(setTranscodingProgressAAC({ message, trackId }));
      });

      sse.current.addEventListener("transcodingCompleteAAC", event => {
        const { trackId, trackName } = JSON.parse(event.data);
        batch(() => {
          dispatch(toastSuccess(`Transcoding complete. ${trackName} added!`, "Transcode Streaming Audio"));
          dispatch(setTranscodingComplete({ trackId }));
        });
      });

      sse.current.addEventListener("transcodingCompleteMP3", ({ releaseId, format, exists }) => {
        dispatch(setFormatExists({ releaseId, format, exists }));
      });

      sse.current.addEventListener("updateTrackStatus", event => {
        const { releaseId, trackId, status } = JSON.parse(event.data);
        dispatch(updateTrackStatus({ releaseId, trackId, status }));
      });

      sse.current.addEventListener("workerMessage", event => {
        const { message } = JSON.parse(event.data);
        dispatch(toastInfo(message, "Processing Audio"));
      });
    }
  }, [dispatch, prevUserId, userId]);
};

export default useSSE;
