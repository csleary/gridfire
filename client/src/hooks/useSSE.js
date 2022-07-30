import {
  setEncodingProgressFLAC,
  setPipelineError,
  setStoringProgressFLAC,
  setTranscodingStartedAAC,
  setTranscodingCompleteAAC,
  setTranscodingStartedMP3,
  setTranscodingCompleteMP3
} from "state/tracks";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastInfo, toastSuccess, toastWarning } from "state/toast";
import { useEffect, useRef } from "react";
import axios from "axios";
import { fetchUser } from "state/user";
import { fetchDaiBalance } from "state/web3";
import { setArtworkUploading } from "state/artwork";
import { updateTrackStatus } from "state/releases";

const PING_INTERVAL = 1000 * 30;

const useSSE = () => {
  const dispatch = useDispatch();
  const pingInterval = useRef();
  const sourceRef = useRef();
  const { account, userId } = useSelector(state => state.user, shallowEqual);

  useEffect(() => {
    const uuid = window.crypto.randomUUID();

    const cleanup = () => {
      axios.delete(`/api/sse/${userId}/${uuid}`);
      clearInterval(pingInterval.current);
    };

    const onNotify = event => {
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

    const onArtworkUploaded = () => {
      dispatch(setArtworkUploading(false));
      dispatch(toastSuccess({ message: "Artwork uploaded!", title: "Done!" }));
    };

    const onEncodingProgressFLAC = event => {
      const { progress, trackId } = JSON.parse(event.data);
      dispatch(setEncodingProgressFLAC({ progress, trackId }));
    };

    const onPurchaseEvent = event => {
      const { artistName, releaseTitle } = JSON.parse(event.data);
      dispatch(fetchDaiBalance(account));
      dispatch(fetchUser());

      dispatch(
        toastSuccess({
          message: `${releaseTitle} by ${artistName} has been added to your collection.`,
          title: "Purchased!"
        })
      );
    };

    const onSaleEvent = event => {
      const { artistName, artistShare, buyerAddress, releaseTitle } = JSON.parse(event.data);
      dispatch(fetchDaiBalance(account));

      dispatch(
        toastSuccess({
          message: `${releaseTitle} by ${artistName} was just bought by ${buyerAddress.slice(
            0,
            6
          )}…${buyerAddress.slice(-4)}. ◈ ${artistShare} has just been added to your account!`,
          title: "Sold!"
        })
      );
    };

    const onStoringProgressFLAC = event => {
      const { progress, trackId } = JSON.parse(event.data);
      dispatch(setStoringProgressFLAC({ progress, trackId }));
    };

    const onTranscodingStartedAAC = event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingStartedAAC({ trackId }));
    };

    const onTranscodingCompleteAAC = event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingCompleteAAC({ trackId }));
    };

    const onTranscodingStartedMP3 = event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingStartedMP3({ trackId }));
    };

    const onTranscodingCompleteMP3 = event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingCompleteMP3({ trackId }));
    };

    const onPipelineError = event => {
      const { message, stage, trackId } = JSON.parse(event.data);
      dispatch(setPipelineError({ message, stage, trackId }));
    };

    const onTrackStatus = event => {
      const { releaseId, status, trackId } = JSON.parse(event.data);
      dispatch(updateTrackStatus({ releaseId, status, trackId }));
    };

    const onWorkerMessage = event => {
      const { message, title } = JSON.parse(event.data);
      dispatch(toastInfo({ message, title }));
    };

    if (userId && !sourceRef.current) {
      sourceRef.current = new EventSource(`/api/sse/${userId}/${uuid}`);
      pingInterval.current = setInterval(() => axios.get(`/api/sse/${userId}/${uuid}/ping`), PING_INTERVAL);
      const source = sourceRef.current;
      source.onopen = () => console.log("[SSE] Connection to server opened.");
      source.onmessage = event => console.log(event.data);
      source.onerror = error => console.log(`[SSE] Error: ${JSON.stringify(error, null, 2)}`);
      source.addEventListener("artworkUploaded", onArtworkUploaded);
      source.addEventListener("encodingProgressFLAC", onEncodingProgressFLAC);
      source.addEventListener("notify", onNotify);
      source.addEventListener("pipelineError", onPipelineError);
      source.addEventListener("purchaseEvent", onPurchaseEvent);
      source.addEventListener("saleEvent", onSaleEvent);
      source.addEventListener("storingProgressFLAC", onStoringProgressFLAC);
      source.addEventListener("trackStatus", onTrackStatus);
      source.addEventListener("transcodingStartedAAC", onTranscodingStartedAAC);
      source.addEventListener("transcodingCompleteAAC", onTranscodingCompleteAAC);
      source.addEventListener("transcodingStartedMP3", onTranscodingStartedMP3);
      source.addEventListener("transcodingCompleteMP3", onTranscodingCompleteMP3);
      source.addEventListener("workerMessage", onWorkerMessage);
      window.addEventListener("beforeunload", cleanup);
    } else if (!userId && pingInterval.current) {
      clearInterval(pingInterval.current);
    }

    return () => {
      if (sourceRef.current) {
        const source = sourceRef.current;
        source.removeEventListener("artworkUploaded", onArtworkUploaded);
        source.removeEventListener("encodingProgressFLAC", onEncodingProgressFLAC);
        source.removeEventListener("notify", onNotify);
        source.removeEventListener("pipelineError", onPipelineError);
        source.removeEventListener("purchaseEvent", onPurchaseEvent);
        source.removeEventListener("saleEvent", onSaleEvent);
        source.removeEventListener("storingProgressFLAC", onStoringProgressFLAC);
        source.removeEventListener("trackStatus", onTrackStatus);
        source.removeEventListener("transcodingStartedAAC", onTranscodingStartedAAC);
        source.removeEventListener("transcodingCompleteAAC", onTranscodingCompleteAAC);
        source.removeEventListener("transcodingStartedMP3", onTranscodingStartedMP3);
        source.removeEventListener("transcodingCompleteMP3", onTranscodingCompleteMP3);
        source.removeEventListener("workerMessage", onWorkerMessage);
        sourceRef.current = null;
        window.removeEventListener("beforeunload", cleanup);
      }
    };
  }, [account, dispatch, userId]);
};

export default useSSE;
