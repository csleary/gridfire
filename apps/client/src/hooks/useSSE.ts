import { MessageType, NotificationType } from "@gridfire/shared/types";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { fetchDaiBalance, setLastCheckedBlock, setMintedEditionIds } from "@/state/web3";

type SSEHandler = (event: MessageEvent) => void;
const PING_INTERVAL = 1000 * 15;

const useSSE = () => {
  const dispatch = useDispatch();
  const connectionIdRef = useRef(window.crypto.randomUUID());
  const pingInterval = useRef<ReturnType<typeof setInterval>>(null);
  const keepAlive = useRef<ReturnType<typeof setTimeout>>(null);
  const sourceRef = useRef<EventSource>(null);
  const account = useSelector(state => state.user.account);
  const userId = useSelector(state => state.user.userId);
  const [shouldReconnect, setShouldReconnect] = useState(false);
  let identifier = userId;

  if (!identifier) {
    // Fallback to localStorage if userId is not available.
    identifier = window.localStorage.getItem("eventsUserId") || "";
  }

  if (!identifier) {
    // Generate and save a new identifier if none exists.
    identifier = window.crypto.randomUUID();
    window.localStorage.setItem("eventsUserId", identifier);
  }

  const url = `/api/sse/${identifier}/${connectionIdRef.current}`;

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

  const onCheckedBlock: SSEHandler = useCallback(
    event => {
      const { date, fromBlock, toBlock } = JSON.parse(event.data);
      dispatch(setLastCheckedBlock({ date, fromBlock, toBlock }));
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

  const globalEventHandlers = useMemo(
    () =>
      new Map([
        [MessageType.BlockRangeChecked, onCheckedBlock],
        [MessageType.Pong, onPong]
      ]),
    [onCheckedBlock, onPong]
  );

  const userEventHandlers = useMemo(
    () =>
      new Map<MessageType | NotificationType, SSEHandler>([
        [MessageType.ArtworkUploaded, onArtworkUploaded],
        [MessageType.EncodingProgressFLAC, onEncodingProgressFLAC],
        [MessageType.Notify, onNotify],
        [MessageType.PipelineError, onPipelineError],
        [MessageType.Pong, onPong],
        [MessageType.StoringProgressFLAC, onStoringProgressFLAC],
        [MessageType.TrackStatus, onTrackStatus],
        [MessageType.TranscodingCompleteAAC, onTranscodingCompleteAAC],
        [MessageType.TranscodingCompleteMP3, onTranscodingCompleteMP3],
        [MessageType.TranscodingStartedAAC, onTranscodingStartedAAC],
        [MessageType.TranscodingStartedMP3, onTranscodingStartedMP3],
        [MessageType.WorkerMessage, onWorkerMessage],
        [NotificationType.Approval, onApprovalEvent],
        [NotificationType.Claim, onClaimEvent],
        [NotificationType.Mint, onEditionMinted],
        [NotificationType.Purchase, onPurchaseEvent],
        [NotificationType.PurchaseEdition, onPurchaseEditionEvent],
        [NotificationType.Sale, onSaleEvent]
      ]),
    [
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
    ]
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

      globalEventHandlers.forEach((handler, type) => {
        source.removeEventListener(type, handler);
      });

      if (userId) {
        userEventHandlers.forEach((handler, type) => {
          source.removeEventListener(type, handler);
        });
      }

      window.removeEventListener("beforeunload", cleanup);
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, [globalEventHandlers, userEventHandlers, userId]);

  const pingConnection = useCallback(async () => {
    try {
      await axios.get(`${url}/ping`);
    } catch (error) {
      console.error("[SSE] Ping error:", error);
      setShouldReconnect(true);
    }
  }, [url]);

  const createConnection = useCallback(() => {
    if (sourceRef.current) return;
    sourceRef.current = new EventSource(url);

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

    globalEventHandlers.forEach((handler, type) => {
      source.addEventListener(type, handler);
    });

    if (userId) {
      userEventHandlers.forEach((handler, type) => {
        source.addEventListener(type, handler);
      });
    }

    window.addEventListener("beforeunload", cleanup);
  }, [cleanup, globalEventHandlers, pingConnection, url, userEventHandlers, userId]);

  useEffect(() => {
    console.info("[SSE] Initialising connection…");
    createConnection();
    return cleanup;
  }, [cleanup, createConnection]);

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
    if (!shouldReconnect) return;
    cleanup();
    reconnect();
  }, [cleanup, reconnect, shouldReconnect, userId]);
};

export default useSSE;
