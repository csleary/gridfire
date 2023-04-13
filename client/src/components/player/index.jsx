import { Box, Flex, Spacer } from "@chakra-ui/react";
import { addToFavourites, removeFromFavourites } from "state/user";
import { faChevronDown, faCog, faHeart, faPause, faPlay, faStop } from "@fortawesome/free-solid-svg-icons";
import { playerHide, playerPlay, playerPause, playerStop, playTrack } from "state/player";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "hooks";
import PlaybackTime from "./playbackTime";
import PlayerButton from "./playerButton";
import PlayLogger from "./playLogger";
import SeekBar from "./seekbar";
import TrackInfo from "./trackInfo";
import { faHeart as heartOutline } from "@fortawesome/free-regular-svg-icons";
import shaka from "shaka-player";
import { shallowEqual } from "react-redux";
import { toastWarning } from "state/toast";
import { usePrevious } from "hooks/usePrevious";

const { REACT_APP_CDN_IMG, REACT_APP_CDN_MP4 } = process.env;

const Player = () => {
  const dispatch = useDispatch();
  const audioPlayerRef = useRef();
  const playLoggerRef = useRef();
  const seekBarRef = useRef();
  const shakaRef = useRef();
  const player = useSelector(state => state.player, shallowEqual);
  const { activeRelease } = useSelector(state => state.releases, shallowEqual);
  const { favourites } = useSelector(state => state.user, shallowEqual);
  const [bufferRanges, setBufferRanges] = useState([]);
  const [elapsedTime, setElapsedTime] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [remainingTime, setRemainingTime] = useState("");
  const { artistName, isPlaying, releaseId, showPlayer, trackId, trackTitle } = player;
  const prevTrackId = usePrevious(trackId);
  const { releaseTitle, trackList } = activeRelease;
  const trackIndex = useMemo(() => trackList.findIndex(({ _id }) => _id === trackId), [trackId, trackList]);
  const { isBonus = false } = trackList.find(({ _id }) => _id === trackId) || {};
  const isInFaves = favourites.some(({ release }) => release === releaseId);

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
    const remaining = Math.floor(duration - (currentTime || 0)) || 0;
    const remainingMins = Math.floor(remaining / 60) || 0;
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

  const cueNextTrack = useCallback(
    (skip = 1) => {
      if (trackList[trackIndex + skip]) {
        const { _id: nextTrackId, isBonus, trackTitle } = trackList[trackIndex + skip];
        if (isBonus) return void cueNextTrack(++skip);
        const cuedTrack = { releaseId, releaseTitle, trackId: nextTrackId, artistName, trackTitle };
        return void dispatch(playTrack(cuedTrack));
      }

      handleStop();
      setIsReady(true);
    },
    [artistName, dispatch, handleStop, releaseId, releaseTitle, trackIndex, trackList]
  );

  const onEnded = useCallback(() => {
    playLoggerRef.current.checkPlayTime();
    cueNextTrack();
  }, [cueNextTrack]);

  const onPlaying = () => {
    playLoggerRef.current.setStartTime();
    setIsReady(true);
  };

  const onPlay = useCallback(() => {
    dispatch(playerPlay());
    navigator.mediaSession.playbackState = "playing";
  }, [dispatch]);

  const onPause = useCallback(() => {
    dispatch(playerPause());
    navigator.mediaSession.playbackState = "paused";
    playLoggerRef.current.updatePlayTime();
  }, [dispatch]);

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
  }, [onEnded, onError, onPause, onPlay, onTimeUpdate]);

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
      artwork: [{ src: `${REACT_APP_CDN_IMG}/${releaseId}`, sizes: "1000x1000", type: "image/png" }]
    });

    navigator.mediaSession.setActionHandler("play", handlePlay);
    navigator.mediaSession.setActionHandler("pause", () => void audioPlayerRef.current.pause());

    navigator.mediaSession.setActionHandler("seekbackward", ({ seekOffset }) => {
      audioPlayerRef.current.currentTime -= seekOffset || 10;
    });

    navigator.mediaSession.setActionHandler("seekforward", ({ seekOffset }) => {
      audioPlayerRef.current.currentTime += seekOffset || 10;
    });

    navigator.mediaSession.setActionHandler("seekto", ({ fastSeek, seekTime }) => {
      if (fastSeek && "fastSeek" in audioPlayerRef.current) {
        return void audioPlayerRef.current.fastSeek(seekTime);
      }

      audioPlayerRef.current.currentTime = seekTime || audioPlayerRef.current.currentTime;
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      if (trackList[trackIndex - 1]) {
        const { _id: nextTrackId, trackTitle } = trackList[trackIndex - 1];
        const cuedTrack = { releaseId, releaseTitle, trackId: nextTrackId, artistName, trackTitle };
        dispatch(playTrack(cuedTrack));
      } else {
        audioPlayerRef.current.currentTime = 0;
      }
    });

    navigator.mediaSession.setActionHandler("nexttrack", cueNextTrack);
  }, [artistName, cueNextTrack, dispatch, handlePlay, releaseId, releaseTitle, trackIndex, trackList, trackTitle]);

  useEffect(() => {
    if (trackId && trackId !== prevTrackId) {
      if (isBonus) {
        // Skip non-streaming tracks.
        return void cueNextTrack();
      }

      shaka.Player.probeSupport().then(supportInfo => {
        const urlStem = `${REACT_APP_CDN_MP4}/${releaseId}/${trackId}`;

        if (supportInfo.manifest.mpd) {
          const mimeType = "application/dash+xml";
          shakaRef.current.load(`${urlStem}/dash.mpd`, null, mimeType).then(handlePlay).catch(onError);
        } else if (supportInfo.manifest.m3u8) {
          const mimeType = "application/vnd.apple.mpegurl";
          shakaRef.current.load(`${urlStem}/master.m3u8`, null, mimeType).then(handlePlay).catch(onError);
        }

        playLoggerRef.current = new PlayLogger(trackId);

        if ("mediaSession" in navigator) {
          setMediaSession();
        }
      });
    }
  }, [cueNextTrack, handlePlay, isBonus, onError, prevTrackId, releaseId, setMediaSession, trackId]);

  const handleClickFavourites = () => {
    if (isInFaves) {
      return void dispatch(removeFromFavourites(releaseId));
    }
    dispatch(addToFavourites(releaseId));
  };

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
      <SeekBar
        audioPlayerRef={audioPlayerRef}
        bufferRanges={bufferRanges}
        handleSeek={handleSeek}
        progressPercent={progressPercent}
        seekBarRef={seekBarRef}
      />
      <Flex alignItems="center" flex="1" justifyContent="space-between" height="3.25rem">
        <Flex flex="1 1 50%" justifyContent="flex-end">
          <PlayerButton
            ariaLabel="Start/resume playback."
            icon={!isReady ? faCog : isPlaying ? faPause : faPlay}
            onClick={handlePlay}
            spin={!isReady}
            mr={2}
          />
          <PlayerButton ariaLabel="Stop audio playback." icon={faStop} onClick={handleStop} mr={2} />
          <PlayerButton
            ariaLabel="Save this track to your favourites."
            color={isInFaves ? "red" : null}
            icon={isInFaves ? faHeart : heartOutline}
            onClick={handleClickFavourites}
            mr={2}
          />
        </Flex>
        <PlaybackTime elapsedTime={elapsedTime} remainingTime={remainingTime} />
        <TrackInfo artistName={artistName} releaseId={releaseId} trackTitle={trackTitle} />
        <Spacer />
        <PlayerButton
          ariaLabel="Hide the audio player (will stop audio)."
          icon={faChevronDown}
          mx={[1, 4]}
          onClick={handleHidePlayer}
          title="Hide player (will stop audio)"
        />
      </Flex>
    </Box>
  );
};

export default Player;
