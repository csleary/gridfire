import { fetchDaiBalance, setMintedEditionIds } from "state/web3";
import {
  setEncodingProgressFLAC,
  setPipelineError,
  setStoringProgressFLAC,
  setTranscodingStartedAAC,
  setTranscodingCompleteAAC,
  setTranscodingStartedMP3,
  setTranscodingCompleteMP3
} from "state/tracks";
import { useDispatch, useSelector } from "hooks";
import { toastError, toastInfo, toastSuccess, toastWarning } from "state/toast";
import { useEffect, useRef } from "react";
import axios from "axios";
import { fetchUser } from "state/user";
import { setArtworkUploading } from "state/artwork";
import { updateTrackStatus } from "state/editor";

type SSEHandler = (event: MessageEvent) => void;

const PING_INTERVAL = 1000 * 30;

const useSSE = () => {
  const dispatch = useDispatch();
  const pingInterval = useRef<ReturnType<typeof setInterval>>(null);
  const sourceRef = useRef<EventSource>(null);
  const account = useSelector(state => state.user.account);
  const userId = useSelector(state => state.user.userId);

  useEffect(() => {
    const uuid = window.crypto.randomUUID();

    const cleanup = () => {
      axios.delete(`/api/sse/${userId}/${uuid}`);

      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
    };

    const onNotify: SSEHandler = event => {
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

    const onEncodingProgressFLAC: SSEHandler = event => {
      const { progress, trackId } = JSON.parse(event.data);
      dispatch(setEncodingProgressFLAC({ progress, trackId }));
    };

    const onEditionMinted: SSEHandler = event => {
      const { editionId } = JSON.parse(event.data);
      dispatch(setMintedEditionIds(editionId));
    };

    const onPurchaseEvent: SSEHandler = event => {
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

    const onPurchaseEditionEvent: SSEHandler = event => {
      const { artistName, releaseTitle } = JSON.parse(event.data);
      dispatch(fetchDaiBalance(account));
      dispatch(fetchUser());

      dispatch(
        toastSuccess({
          message: `Gridfire Edition \u2018${releaseTitle}\u2019 by ${artistName} has been added to your wallet.`,
          title: "Purchased!"
        })
      );
    };

    const onSaleEvent: SSEHandler = event => {
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

    const onStoringProgressFLAC: SSEHandler = event => {
      const { progress, trackId } = JSON.parse(event.data);
      dispatch(setStoringProgressFLAC({ progress, trackId }));
    };

    const onTranscodingStartedAAC: SSEHandler = event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingStartedAAC({ trackId }));
    };

    const onTranscodingCompleteAAC: SSEHandler = event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingCompleteAAC({ trackId }));
    };

    const onTranscodingStartedMP3: SSEHandler = event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingStartedMP3({ trackId }));
    };

    const onTranscodingCompleteMP3: SSEHandler = event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingCompleteMP3({ trackId }));
    };

    const onPipelineError: SSEHandler = event => {
      const { message, stage, trackId } = JSON.parse(event.data);
      dispatch(setPipelineError({ message, stage, trackId }));
    };

    const onTrackStatus: SSEHandler = event => {
      const { status, trackId } = JSON.parse(event.data);
      dispatch(updateTrackStatus({ id: trackId, changes: { status } }));
    };

    const onWorkerMessage: SSEHandler = event => {
      const { message, title } = JSON.parse(event.data);
      dispatch(toastInfo({ message, title }));
    };

    if (userId && !sourceRef.current) {
      sourceRef.current = new EventSource(`/api/sse/${userId}/${uuid}`);
      pingInterval.current = setInterval(() => axios.get(`/api/sse/${userId}/${uuid}/ping`), PING_INTERVAL);
      const source = sourceRef.current;
      source.onopen = () => console.log("[SSE] Connection to server opened.");
      source.onmessage = (event: MessageEvent) => console.log(event.data);
      source.onerror = (error: any) => console.log(`[SSE] Error: ${JSON.stringify(error, null, 2)}`);
      source.addEventListener("artworkUploaded", onArtworkUploaded);
      source.addEventListener("encodingProgressFLAC", onEncodingProgressFLAC);
      source.addEventListener("mintedEvent", onEditionMinted);
      source.addEventListener("notify", onNotify);
      source.addEventListener("pipelineError", onPipelineError);
      source.addEventListener("purchaseEvent", onPurchaseEvent);
      source.addEventListener("purchaseEditionEvent", onPurchaseEditionEvent);
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
        source.removeEventListener("mintedEvent", onEditionMinted);
        source.removeEventListener("notify", onNotify);
        source.removeEventListener("pipelineError", onPipelineError);
        source.removeEventListener("purchaseEvent", onPurchaseEvent);
        source.removeEventListener("purchaseEditionEvent", onPurchaseEditionEvent);
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
