import { MessageType, NotificationType } from "@gridfire/shared/types";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

import { useDispatch, useSelector } from "@/hooks";
import { setArtworkUploading } from "@/state/artwork";
import { updateTrackStatus } from "@/state/editor";
import { endpoints } from "@/state/logs";
import { toastError, toastInfo, toastSuccess, toastWarning } from "@/state/toast";
import {
  setEncodingProgressFLAC,
  setPipelineError,
  setStoringProgressFLAC,
  setTranscodingCompleteAAC,
  setTranscodingCompleteMP3,
  setTranscodingStartedAAC,
  setTranscodingStartedMP3
} from "@/state/tracks";
import { fetchUser } from "@/state/user";
import { fetchDaiBalance, setMintedEditionIds } from "@/state/web3";

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
      const { message, type } = JSON.parse(event.data);

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

  const onApprovalEvent: SSEHandler = useCallback(
    () => dispatch(endpoints.getApprovals.initiate(account, { forceRefetch: true })),
    [account, dispatch]
  );

  const onClaimEvent: SSEHandler = useCallback(
    () => dispatch(endpoints.getClaims.initiate(undefined, { forceRefetch: true })),
    [dispatch]
  );

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
      dispatch(updateTrackStatus({ changes: { status }, id: trackId }));
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
      source.removeEventListener(MessageType.ArtworkUploaded, onArtworkUploaded);
      source.removeEventListener(NotificationType.Approval, onApprovalEvent);
      source.removeEventListener(NotificationType.Claim, onClaimEvent);
      source.removeEventListener(MessageType.EncodingProgressFLAC, onEncodingProgressFLAC);
      source.removeEventListener(NotificationType.Mint, onEditionMinted);
      source.removeEventListener(MessageType.Notify, onNotify);
      source.removeEventListener(MessageType.PipelineError, onPipelineError);
      source.removeEventListener(MessageType.Pong, onPong);
      source.removeEventListener(NotificationType.PurchaseEdition, onPurchaseEditionEvent);
      source.removeEventListener(NotificationType.Purchase, onPurchaseEvent);
      source.removeEventListener(NotificationType.Sale, onSaleEvent);
      source.removeEventListener(MessageType.StoringProgressFLAC, onStoringProgressFLAC);
      source.removeEventListener(MessageType.TrackStatus, onTrackStatus);
      source.removeEventListener(MessageType.TranscodingCompleteAAC, onTranscodingCompleteAAC);
      source.removeEventListener(MessageType.TranscodingCompleteMP3, onTranscodingCompleteMP3);
      source.removeEventListener(MessageType.TranscodingStartedAAC, onTranscodingStartedAAC);
      source.removeEventListener(MessageType.TranscodingStartedMP3, onTranscodingStartedMP3);
      source.removeEventListener(MessageType.WorkerMessage, onWorkerMessage);
      window.removeEventListener("beforeunload", cleanup);
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, [
    onApprovalEvent,
    onArtworkUploaded,
    onClaimEvent,
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
      console.error("[SSE] Ping error:", error);
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
    source.onopen = () => console.log("[SSE] Connected.");
    source.onmessage = (event: MessageEvent) => console.info(event.data);

    source.onerror = (error: unknown) => {
      console.error("[SSE] Error:", error);
      setShouldReconnect(true);
    };

    source.addEventListener(MessageType.ArtworkUploaded, onArtworkUploaded);
    source.addEventListener(NotificationType.Approval, onApprovalEvent);
    source.addEventListener(NotificationType.Claim, onClaimEvent);
    source.addEventListener(MessageType.EncodingProgressFLAC, onEncodingProgressFLAC);
    source.addEventListener(NotificationType.Mint, onEditionMinted);
    source.addEventListener(MessageType.Notify, onNotify);
    source.addEventListener(MessageType.PipelineError, onPipelineError);
    source.addEventListener(MessageType.Pong, onPong);
    source.addEventListener(NotificationType.PurchaseEdition, onPurchaseEditionEvent);
    source.addEventListener(NotificationType.Purchase, onPurchaseEvent);
    source.addEventListener(NotificationType.Sale, onSaleEvent);
    source.addEventListener(MessageType.StoringProgressFLAC, onStoringProgressFLAC);
    source.addEventListener(MessageType.TrackStatus, onTrackStatus);
    source.addEventListener(MessageType.TranscodingCompleteAAC, onTranscodingCompleteAAC);
    source.addEventListener(MessageType.TranscodingCompleteMP3, onTranscodingCompleteMP3);
    source.addEventListener(MessageType.TranscodingStartedAAC, onTranscodingStartedAAC);
    source.addEventListener(MessageType.TranscodingStartedMP3, onTranscodingStartedMP3);
    source.addEventListener(MessageType.WorkerMessage, onWorkerMessage);
    window.addEventListener("beforeunload", cleanup);
  }, [
    cleanup,
    onApprovalEvent,
    onArtworkUploaded,
    onClaimEvent,
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

  const reconnect = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 5_000));
      console.warn("[SSE] Reconnecting…");
      connectionIdRef.current = window.crypto.randomUUID();
      createConnection();
      setShouldReconnect(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("[SSE] Reconnect error:", error.message);
      }
    }
  }, [createConnection]);

  useEffect(() => {
    if (!userId) return;
    if (!shouldReconnect) return;
    cleanup();
    reconnect();
  }, [cleanup, reconnect, shouldReconnect, userId]);
};

export default useSSE;
