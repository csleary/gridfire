import { Box, Flex, IconButton, Spacer, Text, useColorModeValue } from "@chakra-ui/react";
import { faChevronDown, faCog, faPause, faPlay, faStop } from "@fortawesome/free-solid-svg-icons";
import { playerHide, playerPlay, playerPause, playerStop, playTrack } from "state/player";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "components/icon";
import { Link as RouterLink } from "react-router-dom";
import PlayLogger from "./playLogger";
import shaka from "shaka-player";
// import shaka from "shaka-player/dist/shaka-player.compiled.debug.js";
import { toastWarning } from "state/toast";
import { useLocation } from "react-router-dom";
import { usePrevious } from "hooks/usePrevious";
import { CLOUD_URL } from "index";

const { REACT_APP_IPFS_GATEWAY } = process.env;

const Player = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const audioPlayerRef = useRef();
  const playLoggerRef = useRef();
  const seekBarRef = useRef();
  const shakaRef = useRef();

  const { artistName, isPlaying, trackId, releaseId, showPlayer, trackTitle } = useSelector(
    state => state.player,
    shallowEqual
  );

  const { artwork = {}, releaseTitle, trackList } = useSelector(state => state.releases.activeRelease, shallowEqual);
  const [bufferRanges, setBufferRanges] = useState([]);
  const [elapsedTime, setElapsedTime] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [showRemaining, setShowRemaining] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [remainingTime, setRemainingTime] = useState("");
  const prevTrackId = usePrevious(trackId);
  const { cid: artworkCid } = artwork;
  const { mp4 } = trackList.find(({ _id }) => _id === trackId) || {};

  const onBuffering = () => {
    const { audio } = shakaRef.current.getBufferedInfo();
    setBufferRanges(audio);
  };

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  useEffect(() => {
    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
      return void dispatch(
        toastWarning({ message: "Audio playback is not supported by this browser.", title: "Warning" })
      );
    }

    shakaRef.current = new shaka.Player(audioPlayerRef.current);
    const eventManager = new shaka.util.EventManager();
    eventManager.listen(shakaRef.current, `buffering`, onBuffering);
  }, [dispatch]);

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
    playLoggerRef.current.checkPlayTime();
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
    playLoggerRef.current.checkPlayTime();
    const trackIndex = trackList.findIndex(({ _id }) => _id === trackId);

    if (trackList[trackIndex + 1]) {
      const { _id: nextTrackId, trackTitle } = trackList[trackIndex + 1];
      const cuedTrack = { releaseId, releaseTitle, trackId: nextTrackId, artistName, trackTitle };
      return void dispatch(playTrack(cuedTrack));
    }

    handleStop();
  }, [trackId, trackList, handleStop, releaseId, releaseTitle, artistName, dispatch]);

  const onPlaying = () => {
    playLoggerRef.current.setStartTime();
    setIsReady(true);
  };

  const onPlay = useCallback(() => {
    dispatch(playerPlay());
  }, [dispatch]);

  const onPause = () => {
    playLoggerRef.current.updatePlayTime();
    setIsReady(true);
  };

  const onWaiting = () => setIsReady(false);

  useEffect(() => {
    audioPlayerRef.current.addEventListener("playing", onPlaying);
    audioPlayerRef.current.addEventListener("play", onPlay);
    audioPlayerRef.current.addEventListener("pause", onPause);
    audioPlayerRef.current.addEventListener("waiting", onWaiting);
    audioPlayerRef.current.addEventListener("timeupdate", onTimeUpdate);
    audioPlayerRef.current.addEventListener("ended", onEnded);
    audioPlayerRef.current.addEventListener("onerror", onError);

    return () => {
      if (!audioPlayerRef.current) return;
      audioPlayerRef.current.removeEventListener("playing", onPlaying);
      audioPlayerRef.current.removeEventListener("play", onPlay);
      audioPlayerRef.current.removeEventListener("pause", onPause);
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

  const setMediaSession = useCallback(() => {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: trackTitle,
      artist: artistName,
      album: releaseTitle,
      artwork: [{ src: `${CLOUD_URL}/${artworkCid}`, sizes: "1000x1000", type: "image/png" }]
    });

    const trackIndex = trackList.findIndex(({ _id }) => _id === trackId);
    navigator.mediaSession.setActionHandler("play", handlePlay);
    navigator.mediaSession.setActionHandler("pause", () => void audioPlayerRef.current.pause());

    navigator.mediaSession.setActionHandler("previoustrack", function () {
      if (trackList[trackIndex - 1]) {
        const { _id: nextTrackId, trackTitle } = trackList[trackIndex - 1];
        const cuedTrack = { releaseId, releaseTitle, trackId: nextTrackId, artistName, trackTitle };
        return void dispatch(playTrack(cuedTrack));
      }
    });

    navigator.mediaSession.setActionHandler("nexttrack", function () {
      if (trackList[trackIndex + 1]) {
        const { _id: nextTrackId, trackTitle } = trackList[trackIndex + 1];
        const cuedTrack = { releaseId, releaseTitle, trackId: nextTrackId, artistName, trackTitle };
        return void dispatch(playTrack(cuedTrack));
      }
    });
  }, [artistName, artworkCid, dispatch, handlePlay, releaseId, releaseTitle, trackId, trackList, trackTitle]);

  useEffect(() => {
    if (trackId && trackId !== prevTrackId) {
      shaka.Player.probeSupport().then(supportInfo => {
        const urlStem = `${REACT_APP_IPFS_GATEWAY}/${mp4}`;
        if (supportInfo.manifest.mpd) {
          const mimeType = "application/dash+xml";
          shakaRef.current.load(`${urlStem}/dash.mpd`, null, mimeType).then(handlePlay).catch(onError);
        } else if (supportInfo.manifest.m3u8) {
          const mimeType = "application/vnd.apple.mpegurl";
          shakaRef.current.load(`${urlStem}/master.m3u8`, null, mimeType).then(handlePlay).catch(onError);
        }
      });

      if ("mediaSession" in navigator) {
        setMediaSession();
      }

      playLoggerRef.current = new PlayLogger(trackId);
    }
  }, [handlePlay, mp4, onError, prevTrackId, setMediaSession, trackId]);

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
