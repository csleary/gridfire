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
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { fetchUser } from "state/user";
import { setArtworkUploading } from "state/artwork";
import { updateTrackStatus } from "state/editor";

type SSEHandler = (event: MessageEvent) => void;

const PING_INTERVAL = 1000 * 15;

const useSSE = () => {
  const dispatch = useDispatch();
  const pingInterval = useRef<ReturnType<typeof setInterval>>(null);
  const keepAlive = useRef<ReturnType<typeof setTimeout>>(null);
  const sourceRef = useRef<EventSource>(null);
  const account = useSelector(state => state.user.account);
  const userId = useSelector(state => state.user.userId);
  const [shouldReconnect, setShouldReconnect] = useState(false);
  const connectionIdRef = useRef(window.crypto.randomUUID());

  const onNotify: SSEHandler = useCallback(
    event => {
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
    },
    [dispatch]
  );

  const onArtworkUploaded = useCallback(() => {
    dispatch(setArtworkUploading(false));
    dispatch(toastSuccess({ message: "Artwork uploaded!", title: "Done!" }));
  }, [dispatch]);

  const onEncodingProgressFLAC: SSEHandler = useCallback(
    event => {
      const { progress, trackId } = JSON.parse(event.data);
      dispatch(setEncodingProgressFLAC({ progress, trackId }));
    },
    [dispatch]
  );

  const onEditionMinted: SSEHandler = useCallback(
    event => {
      const { editionId } = JSON.parse(event.data);
      dispatch(setMintedEditionIds(editionId));
    },
    [dispatch]
  );

  const onPong: SSEHandler = useCallback(() => {
    if (keepAlive.current) {
      clearTimeout(keepAlive.current);
    }

    keepAlive.current = setTimeout(() => {
      setShouldReconnect(true);
    }, PING_INTERVAL * 2);
  }, []);

  const onPurchaseEvent: SSEHandler = useCallback(
    event => {
      const { artistName, releaseTitle } = JSON.parse(event.data);
      dispatch(fetchDaiBalance(account));
      dispatch(fetchUser());

      dispatch(
        toastSuccess({
          message: `${releaseTitle} by ${artistName} has been added to your collection.`,
          title: "Purchased!"
        })
      );
    },
    [account, dispatch]
  );

  const onPurchaseEditionEvent: SSEHandler = useCallback(
    event => {
      const { artistName, releaseTitle } = JSON.parse(event.data);
      dispatch(fetchDaiBalance(account));
      dispatch(fetchUser());

      dispatch(
        toastSuccess({
          message: `Gridfire Edition '${releaseTitle}' by ${artistName} has been added to your wallet.`,
          title: "Purchased!"
        })
      );
    },
    [account, dispatch]
  );

  const onSaleEvent: SSEHandler = useCallback(
    event => {
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
    },
    [account, dispatch]
  );

  const onStoringProgressFLAC: SSEHandler = useCallback(
    event => {
      const { progress, trackId } = JSON.parse(event.data);
      dispatch(setStoringProgressFLAC({ progress, trackId }));
    },
    [dispatch]
  );

  const onTranscodingStartedAAC: SSEHandler = useCallback(
    event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingStartedAAC({ trackId }));
    },
    [dispatch]
  );

  const onTranscodingCompleteAAC: SSEHandler = useCallback(
    event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingCompleteAAC({ trackId }));
    },
    [dispatch]
  );

  const onTranscodingStartedMP3: SSEHandler = useCallback(
    event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingStartedMP3({ trackId }));
    },
    [dispatch]
  );

  const onTranscodingCompleteMP3: SSEHandler = useCallback(
    event => {
      const { trackId } = JSON.parse(event.data);
      dispatch(setTranscodingCompleteMP3({ trackId }));
    },
    [dispatch]
  );

  const onPipelineError: SSEHandler = useCallback(
    event => {
      const { message, stage, trackId } = JSON.parse(event.data);
      dispatch(setPipelineError({ message, stage, trackId }));
    },
    [dispatch]
  );

  const onTrackStatus: SSEHandler = useCallback(
    event => {
      const { status, trackId } = JSON.parse(event.data);
      dispatch(updateTrackStatus({ id: trackId, changes: { status } }));
    },
    [dispatch]
  );

  const onWorkerMessage: SSEHandler = useCallback(
    event => {
      const { message, title } = JSON.parse(event.data);
      dispatch(toastInfo({ message, title }));
    },
    [dispatch]
  );

  const cleanup = useCallback(() => {
    if (keepAlive.current) {
      clearTimeout(keepAlive.current);
      keepAlive.current = null;
    }

    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }

    if (sourceRef.current) {
      const source = sourceRef.current;
      source.removeEventListener("artworkUploaded", onArtworkUploaded);
      source.removeEventListener("encodingProgressFLAC", onEncodingProgressFLAC);
      source.removeEventListener("mintedEvent", onEditionMinted);
      source.removeEventListener("notify", onNotify);
      source.removeEventListener("pipelineError", onPipelineError);
      source.removeEventListener("pong", onPong);
      source.removeEventListener("purchaseEditionEvent", onPurchaseEditionEvent);
      source.removeEventListener("purchaseEvent", onPurchaseEvent);
      source.removeEventListener("saleEvent", onSaleEvent);
      source.removeEventListener("storingProgressFLAC", onStoringProgressFLAC);
      source.removeEventListener("trackStatus", onTrackStatus);
      source.removeEventListener("transcodingCompleteAAC", onTranscodingCompleteAAC);
      source.removeEventListener("transcodingCompleteMP3", onTranscodingCompleteMP3);
      source.removeEventListener("transcodingStartedAAC", onTranscodingStartedAAC);
      source.removeEventListener("transcodingStartedMP3", onTranscodingStartedMP3);
      source.removeEventListener("workerMessage", onWorkerMessage);
      window.removeEventListener("beforeunload", cleanup);
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, [
    onArtworkUploaded,
    onEditionMinted,
    onEncodingProgressFLAC,
    onNotify,
    onPipelineError,
    onPong,
    onPurchaseEditionEvent,
    onPurchaseEvent,
    onSaleEvent,
    onStoringProgressFLAC,
    onTrackStatus,
    onTranscodingCompleteAAC,
    onTranscodingCompleteMP3,
    onTranscodingStartedAAC,
    onTranscodingStartedMP3,
    onWorkerMessage
  ]);

  const pingConnection = useCallback(async () => {
    try {
      const connectionId = connectionIdRef.current;
      await axios.get(`/api/sse/${userId}/${connectionId}/ping`);
    } catch (error) {
      setShouldReconnect(true);
    }
  }, [connectionIdRef, userId]);

  const createConnection = useCallback(() => {
    if (sourceRef.current) return;
    const connectionId = connectionIdRef.current;
    sourceRef.current = new EventSource(`/api/sse/${userId}/${connectionId}`);

    keepAlive.current = setTimeout(() => {
      setShouldReconnect(true);
    }, PING_INTERVAL * 2);

    pingInterval.current = setInterval(pingConnection, PING_INTERVAL);
    const source = sourceRef.current;
    source.onopen = () => console.log("[SSE] Connection to server opened.");
    source.onmessage = (event: MessageEvent) => console.info(event.data);
    source.onerror = (error: any) => {
      console.error("[SSE] Error:", error);
      setShouldReconnect(true);
    };
    source.addEventListener("artworkUploaded", onArtworkUploaded);
    source.addEventListener("encodingProgressFLAC", onEncodingProgressFLAC);
    source.addEventListener("mintedEvent", onEditionMinted);
    source.addEventListener("notify", onNotify);
    source.addEventListener("pipelineError", onPipelineError);
    source.addEventListener("pong", onPong);
    source.addEventListener("purchaseEditionEvent", onPurchaseEditionEvent);
    source.addEventListener("purchaseEvent", onPurchaseEvent);
    source.addEventListener("saleEvent", onSaleEvent);
    source.addEventListener("storingProgressFLAC", onStoringProgressFLAC);
    source.addEventListener("trackStatus", onTrackStatus);
    source.addEventListener("transcodingCompleteAAC", onTranscodingCompleteAAC);
    source.addEventListener("transcodingCompleteMP3", onTranscodingCompleteMP3);
    source.addEventListener("transcodingStartedAAC", onTranscodingStartedAAC);
    source.addEventListener("transcodingStartedMP3", onTranscodingStartedMP3);
    source.addEventListener("workerMessage", onWorkerMessage);
    window.addEventListener("beforeunload", cleanup);
  }, [
    cleanup,
    onArtworkUploaded,
    onEditionMinted,
    onEncodingProgressFLAC,
    onNotify,
    onPipelineError,
    onPong,
    onPurchaseEditionEvent,
    onPurchaseEvent,
    onSaleEvent,
    onStoringProgressFLAC,
    onTrackStatus,
    onTranscodingCompleteAAC,
    onTranscodingCompleteMP3,
    onTranscodingStartedAAC,
    onTranscodingStartedMP3,
    onWorkerMessage,
    pingConnection,
    userId
  ]);

  useEffect(() => {
    if (!userId) return;
    console.info("[SSE] Initialising connection…");
    createConnection();
    return cleanup;
  }, [cleanup, createConnection, userId]);

  useEffect(() => {
    if (!userId) return;
    if (!shouldReconnect) return;
    console.warn("[SSE] Reconnecting…");
    cleanup();
    setShouldReconnect(false);
    console.info("[SSE] Initialising connection…");
    connectionIdRef.current = window.crypto.randomUUID();
    createConnection();
  }, [cleanup, createConnection, shouldReconnect, userId]);
};

export default useSSE;
