import { useDispatch, useSelector } from "@/hooks";
import { usePrevious } from "@/hooks/usePrevious";
import { loadTrack, playerHide, playerPause, playerPlay, playerStop, setIsInitialised } from "@/state/player";
import { toastWarning } from "@/state/toast";
import { addToFavourites, removeFromFavourites } from "@/state/user";
import { fadeAudio, getGainNode } from "@/utils/audio";
import { Box, Flex, Spacer } from "@chakra-ui/react";
import { faHeart as heartOutline } from "@fortawesome/free-regular-svg-icons";
import { faChevronDown, faHeart, faPause, faPlay, faSpinner, faStop } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shallowEqual } from "react-redux";
import shaka from "shaka-player";
import PlaybackTime from "./playbackTime";
import PlayerButton from "./playerButton";
import PlayLogger from "./playLogger";
import SeekBar from "./seekbar";
import TrackInfo from "./trackInfo";

const DASH_MIME = "application/dash+xml";
const M3U_MIME = "application/vnd.apple.mpegurl";
const VITE_CDN_IMG = import.meta.env.VITE_CDN_IMG;
const VITE_CDN_MP4 = import.meta.env.VITE_CDN_MP4;

const Player = () => {
  const dispatch = useDispatch();
  const audioPlayerRef = useRef(new Audio());
  const preloadManagerRef = useRef<shaka.media.PreloadManager | null>(null);
  const preloadedTrackIdRef = useRef("");
  const seekBarRef = useRef(document.createElement("div"));
  const shakaRef = useRef(new shaka.Player());
  const activeRelease = useSelector(state => state.releases.activeRelease, shallowEqual);
  const favourites = useSelector(state => state.user.favourites, shallowEqual);
  const artistName = useSelector(state => state.player.artistName);
  const isInitialised = useSelector(state => state.player.isInitialised);
  const isPlaying = useSelector(state => state.player.isPlaying);
  const releaseId = useSelector(state => state.player.releaseId);
  const showPlayer = useSelector(state => state.player.showPlayer);
  const trackId = useSelector(state => state.player.trackId);
  const trackTitle = useSelector(state => state.player.trackTitle);
  const [bufferRanges, setBufferRanges] = useState<shaka.extern.BufferedRange[]>([]);
  const [elapsedTime, setElapsedTime] = useState("");
  const [isBuffering, setIsBuffering] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [remainingTime, setRemainingTime] = useState("");
  const [requiresGesture, setRequiresGesture] = useState(false);
  const [shakaIsLoading, setShakaIsLoading] = useState(false);
  const [supportInfo, setSupportInfo] = useState<shaka.extern.SupportType | null>(null);
  const prevTrackId = usePrevious(trackId);
  const { releaseTitle, trackList } = activeRelease;
  const trackIndex = useMemo(() => trackList.findIndex(({ _id }) => _id === trackId), [trackId, trackList]);
  const { isBonus = false } = trackList.find(({ _id }) => _id === trackId) || {};
  const isInFaves = favourites.some(({ release }) => release === releaseId);
  const playLoggerRef = useRef(new PlayLogger(trackId));

  const onBuffering = useCallback(({ buffering }: { buffering: boolean }) => {
    setIsBuffering(buffering);
    const { audio } = shakaRef.current.getBufferedInfo();
    setBufferRanges(audio);
  }, []);

  useEffect(() => {
    shaka.polyfill.installAll();
    shaka.Player.probeSupport()
      .then(info => {
        setSupportInfo(info);
        dispatch(setIsInitialised(true));
      })
      .catch(error => {
        console.error("Error probing Shaka Player support:", error);
      });

    if (!shaka.Player.isBrowserSupported()) {
      return void dispatch(
        toastWarning({ message: "Audio playback is not supported by this browser.", title: "Warning" })
      );
    }

    shakaRef.current = new shaka.Player();
    shakaRef.current.attach(audioPlayerRef.current);
    const eventManager = new shaka.util.EventManager();
    eventManager.listen(shakaRef.current, `buffering`, e => onBuffering(e as Event & { buffering: boolean }));
    eventManager.listen(shakaRef.current, `loaded`, () => setShakaIsLoading(false));
    eventManager.listen(shakaRef.current, `loading`, () => setShakaIsLoading(true));
  }, [dispatch, onBuffering]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    fadeAudio("out").then(() => {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      dispatch(playerStop());
    });
  }, [dispatch]);

  const cueNextTrack = useCallback(
    (skip = 1) => {
      if (trackList[trackIndex + skip]) {
        const { _id: nextTrackId, isBonus, trackTitle } = trackList[trackIndex + skip];

        if (isBonus) {
          cueNextTrack(++skip);
          return;
        }

        const cuedTrack = { releaseId, releaseTitle, trackId: nextTrackId, artistName, trackTitle };
        dispatch(loadTrack(cuedTrack));
        return;
      }

      handleStop();
      dispatch(playerStop());
    },
    [artistName, dispatch, handleStop, releaseId, releaseTitle, trackIndex, trackList]
  );

  const handlePlay = useCallback(() => {
    const playPromise = audioPlayerRef.current.play();

    if (playPromise) {
      playPromise
        .then(() => {
          if (getGainNode().gain.value === 0) fadeAudio("in");
          setRequiresGesture(false);
        })
        .catch(() => setRequiresGesture(true));
    }
  }, []);

  const setMediaSession = useCallback(() => {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: trackTitle,
      artist: artistName,
      album: releaseTitle,
      artwork: [{ src: `${VITE_CDN_IMG}/${releaseId}`, sizes: "1000x1000", type: "image/png" }]
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
      if (fastSeek && "fastSeek" in audioPlayerRef.current && seekTime) {
        return void audioPlayerRef.current.fastSeek(seekTime);
      }

      audioPlayerRef.current.currentTime = seekTime || audioPlayerRef.current.currentTime;
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      if (trackList[trackIndex - 1]) {
        const { _id: nextTrackId, trackTitle } = trackList[trackIndex - 1];
        const cuedTrack = { releaseId, releaseTitle, trackId: nextTrackId, artistName, trackTitle };
        dispatch(loadTrack(cuedTrack));
      } else {
        audioPlayerRef.current.currentTime = 0;
      }
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => cueNextTrack());
  }, [artistName, cueNextTrack, dispatch, handlePlay, releaseId, releaseTitle, trackIndex, trackList, trackTitle]);

  useEffect(() => {
    if ("mediaSession" in navigator) setMediaSession();
  }, [setMediaSession]);

  const onEnded = useCallback(() => {
    playLoggerRef.current.checkPlayTime();
    cueNextTrack();
  }, [cueNextTrack]);

  const onError = useCallback((error: unknown) => {
    console.error(error);
    navigator.mediaSession.playbackState = "none";
  }, []);

  const onPause = useCallback(() => {
    playLoggerRef.current.updatePlayTime();
    navigator.mediaSession.playbackState = "paused";
  }, []);

  const onPlay = useCallback(() => {
    dispatch(playerPlay());
  }, [dispatch]);

  const onPlaying = useCallback(() => {
    navigator.mediaSession.playbackState = "playing";
    playLoggerRef.current.setStartTime();
  }, []);

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

  useEffect(() => {
    const audioPlayer = audioPlayerRef.current;
    audioPlayer.addEventListener("playing", onPlaying);
    audioPlayer.addEventListener("play", onPlay);
    audioPlayer.addEventListener("pause", onPause);
    audioPlayer.addEventListener("timeupdate", onTimeUpdate);
    audioPlayer.addEventListener("ended", onEnded);
    audioPlayer.addEventListener("onerror", onError);

    return () => {
      if (!audioPlayer) return;
      audioPlayer.removeEventListener("playing", onPlaying);
      audioPlayer.removeEventListener("play", onPlay);
      audioPlayer.removeEventListener("pause", onPause);
      audioPlayer.removeEventListener("timeupdate", onTimeUpdate);
      audioPlayer.removeEventListener("ended", onEnded);
      audioPlayer.removeEventListener("onerror", onError);
    };
  }, [onEnded, onError, onPause, onPlay, onPlaying, onTimeUpdate]);

  const handleClickPlay = useCallback(() => {
    if (!audioPlayerRef.current.paused) {
      dispatch(playerPause());
      fadeAudio("out").then(() => audioPlayerRef.current.pause());
      return;
    }

    handlePlay();
  }, [dispatch, handlePlay]);

  const getManifestUri = useCallback(
    (manifestTrackId: string) => {
      if (!supportInfo || !releaseId) return null;
      const urlStem = `${VITE_CDN_MP4}/${releaseId}`;
      if (supportInfo.manifest[DASH_MIME]) return `${urlStem}/${manifestTrackId}/dash.mpd`;
      if (supportInfo.manifest[M3U_MIME]) return `${urlStem}/${manifestTrackId}/master.m3u8`;
      return null;
    },
    [releaseId, supportInfo]
  );

  const getMimeType = useCallback(() => {
    if (!supportInfo) return null;
    if (supportInfo.manifest[DASH_MIME]) return DASH_MIME;
    if (supportInfo.manifest[M3U_MIME]) return M3U_MIME;
    return null;
  }, [supportInfo]);

  const preloadTrackById = useCallback(
    async (preloadTrackId: string) => {
      try {
        const assetUri = getManifestUri(preloadTrackId);
        if (!assetUri) return;
        const manager = await shakaRef.current.preload(assetUri, null, getMimeType());
        preloadManagerRef.current = manager;
        preloadedTrackIdRef.current = preloadTrackId;
      } catch (error) {
        onError(error);
      }
    },
    [getManifestUri, getMimeType, onError]
  );

  useEffect(() => {
    let nextTrackId;
    for (let i = trackIndex + 1; i < trackList.length; i++) {
      const { _id, isBonus } = trackList[i];
      if (!isBonus) {
        nextTrackId = _id;
        break;
      }
    }

    if (!nextTrackId) return;
    preloadTrackById(nextTrackId);
  }, [preloadTrackById, trackIndex, trackList]);

  const loadPlayer = useCallback(
    async (assetUriOrPreloader: string | shaka.media.PreloadManager) => {
      try {
        await shakaRef.current.load(assetUriOrPreloader, null, getMimeType());
        getGainNode().gain.value = 1; // Turn gain back up after loading a new track.
        handlePlay();
      } catch (error) {
        onError(error);
      }
    },
    [getMimeType, handlePlay, onError]
  );

  useEffect(() => {
    if (!trackId) return;
    if (!isInitialised) return;
    if (trackId === prevTrackId) return;
    if (isBonus) return void cueNextTrack();

    if (preloadManagerRef.current && trackId === preloadedTrackIdRef.current) {
      // We have a preloaded track; load and play.
      return void loadPlayer(preloadManagerRef.current);
    }

    if (prevTrackId) {
      // Pause while we load non-preloaded track.
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current.pause();
    }

    const assetUri = getManifestUri(trackId);
    if (!assetUri) return;
    loadPlayer(assetUri);
  }, [cueNextTrack, getManifestUri, isBonus, isInitialised, loadPlayer, prevTrackId, shakaIsLoading, trackId]);

  useEffect(() => {
    if (!trackId || trackId === prevTrackId) return;
    playLoggerRef.current = new PlayLogger(trackId);
  }, [prevTrackId, trackId]);

  const handleClickFavourites = () => {
    if (isInFaves) {
      return void dispatch(removeFromFavourites(releaseId));
    }
    dispatch(addToFavourites(releaseId));
  };

  const handleSeek = ({ clientX }: { clientX: number }) => {
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
      <audio id="player" ref={audioPlayerRef} />
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
            isDisabled={!isInitialised || shakaIsLoading}
            isLoading={!isInitialised || (!requiresGesture && isBuffering)}
            icon={!requiresGesture && isBuffering ? faSpinner : isPlaying ? faPause : faPlay}
            onClick={handleClickPlay}
            mr={2}
          />
          <PlayerButton ariaLabel="Stop audio playback." icon={faStop} onClick={handleStop} mr={2} />
          <PlayerButton
            ariaLabel="Save this track to your favourites."
            color={isInFaves ? "red.400" : undefined}
            icon={isInFaves ? faHeart : heartOutline}
            onClick={handleClickFavourites}
            mr={2}
            _hover={{ color: undefined }}
            transition="color 0.3s ease-in-out"
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
