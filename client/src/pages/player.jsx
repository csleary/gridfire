import { Box, Flex, IconButton, Spacer, Text, useColorModeValue } from "@chakra-ui/react";
import { decryptArrayBuffer, encryptArrayBuffer, exportKeyToJWK, generateKey } from "utils";
import { faChevronDown, faCog, faPause, faPlay, faStop } from "@fortawesome/free-solid-svg-icons";
import { playerHide, playerPlay, playerPause, playerStop, playTrack } from "state/player";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "components/icon";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import shaka from "shaka-player";
// import shaka from "shaka-player/dist/shaka-player.compiled.debug.js";
import { toastWarning } from "state/toast";
import { useLocation } from "react-router-dom";
import { usePrevious } from "hooks/usePrevious";

const { REACT_APP_IPFS_GATEWAY } = process.env;

const Player = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const audioPlayerRef = useRef();
  const keyPairRef = useRef();
  const seekBarRef = useRef();
  const serverPublicKeyRef = useRef();
  const shakaRef = useRef();

  const { artistName, isPlaying, trackId, releaseId, showPlayer, trackTitle } = useSelector(
    state => state.player,
    shallowEqual
  );

  const { trackList } = useSelector(state => state.releases.activeRelease, shallowEqual);
  const [bufferRanges, setBufferRanges] = useState([]);
  const [elapsedTime, setElapsedTime] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [showRemaining, setShowRemaining] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [remainingTime, setRemainingTime] = useState("");
  const prevTrackId = usePrevious(trackId);
  const { mpd, mst } = trackList.find(({ _id }) => _id === trackId) || {};

  const wrapRequest = useCallback(async (type, request) => {
    if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
      const { publicKey } = keyPairRef.current;
      const exportJwk = exportKeyToJWK(publicKey);
      const encryptMessage = encryptArrayBuffer(serverPublicKeyRef.current, request.body);
      const [jwk, encryptedMessage] = await Promise.all([exportJwk, encryptMessage]);
      const formData = new FormData();
      formData.append("key", JSON.stringify(jwk));
      formData.append("message", new Blob([encryptedMessage]));
      request.responseType = "arraybuffer";
      request.body = formData;
    }
  }, []);

  const unwrapRequest = useCallback(async (type, response) => {
    if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
      const { privateKey } = keyPairRef.current;
      response.data = await decryptArrayBuffer(privateKey, response.data);
    }
  }, []);

  const onBuffering = () => {
    const { audio } = shakaRef.current.getBufferedInfo();
    setBufferRanges(audio);
  };

  const initPlayer = useCallback(() => {
    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
      return void dispatch(
        toastWarning({ message: "Audio playback is not supported by this browser.", title: "Warning" })
      );
    }

    shakaRef.current = new shaka.Player(audioPlayerRef.current);
    const licenseServer = "/api/track";
    shakaRef.current.configure({ drm: { servers: { "org.w3.clearkey": licenseServer } } });
    shakaRef.current.getNetworkingEngine().registerRequestFilter(wrapRequest);
    shakaRef.current.getNetworkingEngine().registerResponseFilter(unwrapRequest);
    const eventManager = new shaka.util.EventManager();
    eventManager.listen(shakaRef.current, `buffering`, onBuffering);
  }, [dispatch, unwrapRequest, wrapRequest]);

  useEffect(() => {
    generateKey().then(keyPair => (keyPairRef.current = keyPair));

    axios
      .get("/api/track")
      .then(res => (serverPublicKeyRef.current = res.data))
      .then(initPlayer)
      .catch(console.error);
  }, [initPlayer]);

  const onTimeUpdate = useCallback(() => {
    const { currentTime, duration } = audioPlayerRef.current;
    const mins = Math.floor(currentTime / 60);
    const secs = Math.floor(currentTime % 60);
    const remaining = Math.floor(duration - (currentTime || 0));
    const remainingMins = Math.floor(remaining / 60);
    const remainingSecs = (remaining % 60).toString(10).padStart(2, "0");
    setElapsedTime(`${mins}:${secs.toString(10).padStart(2, "0")}`);
    setRemainingTime(`-${remainingMins}:${remainingSecs}`);
    setProgressPercent(currentTime / duration);
    const { audio } = shakaRef.current.getBufferedInfo();
    setBufferRanges(audio);
  }, []);

  const handleStop = useCallback(() => {
    audioPlayerRef.current.pause();
    audioPlayerRef.current.currentTime = 0;
    dispatch(playerStop());
  }, [dispatch]);

  const onError = useCallback(
    error => {
      console.error(error);
      setIsReady(false);
      dispatch(playerStop());
    },
    [dispatch]
  );

  const onEnded = useCallback(() => {
    axios.post(`/api/track/${trackId}/6`);
    const trackIndex = trackList.findIndex(({ _id }) => _id === trackId);

    if (trackList[trackIndex + 1]) {
      const { _id: nextTrackId, trackTitle } = trackList[trackIndex + 1];
      const cuedTrack = { releaseId, trackId: nextTrackId, artistName, trackTitle };
      return void dispatch(playTrack(cuedTrack));
    }

    handleStop();
  }, [artistName, dispatch, handleStop, trackId, releaseId, trackList]);

  const onPlay = useCallback(() => void dispatch(playerPlay()), [dispatch]);
  const onPlaying = () => setIsReady(true);
  const onWaiting = () => setIsReady(false);

  useEffect(() => {
    audioPlayerRef.current.addEventListener("play", onPlay);
    audioPlayerRef.current.addEventListener("playing", onPlaying);
    audioPlayerRef.current.addEventListener("waiting", onWaiting);
    audioPlayerRef.current.addEventListener("timeupdate", onTimeUpdate);
    audioPlayerRef.current.addEventListener("ended", onEnded);
    audioPlayerRef.current.addEventListener("onerror", onError);

    return () => {
      if (!audioPlayerRef.current) return;
      audioPlayerRef.current.removeEventListener("play", onPlay);
      audioPlayerRef.current.removeEventListener("playing", onPlaying);
      audioPlayerRef.current.removeEventListener("waiting", onWaiting);
      audioPlayerRef.current.removeEventListener("timeupdate", onTimeUpdate);
      audioPlayerRef.current.removeEventListener("ended", onEnded);
      audioPlayerRef.current.removeEventListener("onerror", onError);
    };
  }, [onEnded, onError, onPlay, onTimeUpdate]);

  const handlePlay = useCallback(() => {
    const playPromise = audioPlayerRef.current.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (isPlaying) {
            audioPlayerRef.current.pause();
            return void dispatch(playerPause());
          }
        })
        .catch(onError);
    }
  }, [dispatch, isPlaying, onError]);

  const onFetchSegment = useCallback(
    type => {
      const { LICENSE, SEGMENT } = shaka.net.NetworkingEngine.RequestType;
      if (type === LICENSE || type === SEGMENT) {
        axios.post(`/api/track/${trackId}/${type}`);
      }
    },
    [trackId]
  );

  useEffect(() => {
    if (trackId && trackId !== prevTrackId) {
      shaka.Player.probeSupport().then(supportInfo => {
        if (supportInfo.manifest.mpd) {
          const mimeType = "application/dash+xml";
          shakaRef.current.load(`${REACT_APP_IPFS_GATEWAY}/${mpd}`, null, mimeType).then(handlePlay).catch(onError);
        } else if (supportInfo.manifest.m3u8) {
          const mimeType = "application/vnd.apple.mpegurl";
          shakaRef.current.load(`${REACT_APP_IPFS_GATEWAY}/${mst}`, null, mimeType).then(handlePlay).catch(onError);
        }
      });

      shakaRef.current.getNetworkingEngine().registerResponseFilter(onFetchSegment);
    }
  }, [handlePlay, mpd, mst, onError, onFetchSegment, prevTrackId, trackId]);

  useEffect(() => {
    if (shakaRef.current) {
      shakaRef.current.getNetworkingEngine().registerResponseFilter(onFetchSegment);
    }

    return () => {
      if (shakaRef.current) {
        shakaRef.current.getNetworkingEngine().unregisterResponseFilter(onFetchSegment);
      }
    };
  }, [onFetchSegment]);

  const handleSeek = ({ clientX }) => {
    const width = seekBarRef.current.clientWidth;
    const seekPercent = clientX / width;
    audioPlayerRef.current.currentTime = audioPlayerRef.current.duration * seekPercent;
  };

  const handleHidePlayer = () => {
    handleStop();
    dispatch(playerHide());
  };

  return (
    <Box
      role="group"
      background="gray.800"
      bottom="0"
      color="gray.300"
      fontSize="2rem"
      left="0"
      position="fixed"
      right="0"
      transform={showPlayer ? "translateY(0)" : "translateY(100%)"}
      transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
      visibility={showPlayer ? "visible" : "hidden"}
      zIndex="1030"
    >
      <audio id="player" ref={el => (audioPlayerRef.current = el)} />
      <Box
        onClick={handleSeek}
        ref={seekBarRef}
        role="button"
        tabIndex="-1"
        background="gray.300"
        height="4px"
        position="relative"
        transition="0.125s cubic-bezier(0.2, 0.8, 0.4, 1)"
        width="100%"
        _groupHover={{ background: "gray.200", cursor: "pointer", height: "8px", marginTop: "6px" }}
      >
        {bufferRanges.map(({ start, end }) => {
          const { duration } = audioPlayerRef.current;
          const left = (start / duration) * 100;
          const width = ((end - start) / duration) * 100;

          return (
            <Box
              key={start}
              background="gray.600"
              height="100%"
              left={`${left || 0}%`}
              position="absolute"
              transition="width 0.125s cubic-bezier(0.2, 0.8, 0.4, 1)"
              width={`${width || 0}%`}
            />
          );
        })}
        <Box
          background={useColorModeValue("yellow.400", "purple.400")}
          height="100%"
          position="absolute"
          transition="0.125s cubic-bezier(0.2, 0.8, 0.4, 1)"
          width={`${progressPercent * 100}%`}
        />
      </Box>
      <Flex alignItems="center" flex="1" justifyContent="center" height="3.25rem">
        <Flex flex="1 1 50%" justifyContent="flex-end">
          <IconButton
            icon={<Icon icon={!isReady ? faCog : isPlaying ? faPause : faPlay} fixedWidth spin={!isReady} />}
            onClick={handlePlay}
            variant="ghost"
            fontSize="2rem"
            mr={2}
            _hover={{ "&:active": { background: "none" }, color: "gray.100" }}
          />
          <IconButton
            icon={<Icon icon={faStop} fixedWidth />}
            onClick={handleStop}
            fontSize="2rem"
            mr={2}
            variant="ghost"
            _hover={{ "&:active": { background: "none" }, color: "gray.100" }}
          />
        </Flex>
        <Box
          role="button"
          onClick={() => setShowRemaining(prev => !prev)}
          tabIndex="-1"
          display="inline-block"
          flex="0 1 8rem"
          padding="0 1rem"
          textAlign="right"
          transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
          userSelect="none"
          _hover={{ "&:active": { background: "none" }, color: "gray.100" }}
        >
          {showRemaining ? remainingTime : elapsedTime}
        </Box>
        <Flex
          alignItems="center"
          flex="1 1 50%"
          overflow="hidden"
          pl={[1, 4]}
          textAlign="left"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {!isReady ? (
            <Text>Loading&hellip;</Text>
          ) : pathname === `/release/${releaseId}` ? (
            <Text>
              {artistName} &bull; <Text as="em">{trackTitle}</Text>
            </Text>
          ) : (
            <Text as={RouterLink} to={`/release/${releaseId}`}>
              {artistName} &bull; <Text as="em">{trackTitle}</Text>
            </Text>
          )}
        </Flex>
        <Spacer />
        <IconButton
          icon={<Icon icon={faChevronDown} />}
          mx={[1, 4]}
          onClick={handleHidePlayer}
          title="Hide player (will stop audio)"
          variant="ghost"
          _hover={{ "&:active": { background: "none" }, color: "gray.100" }}
        />
      </Flex>
    </Box>
  );
};

export default Player;
