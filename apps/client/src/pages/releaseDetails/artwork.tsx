import { Box, Fade, Flex, IconButton, Image, Skeleton, Spinner, useDisclosure } from "@chakra-ui/react";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReleaseTrack } from "@gridfire/shared/types";
import { useCallback } from "react";
import { shallowEqual } from "react-redux";

import { useDispatch, useSelector } from "@/hooks";
import placeholder from "@/placeholder.svg";
import { loadTrack, playerPause, playerPlay } from "@/state/player";
import { toastInfo } from "@/state/toast";
import { fadeAudio, getGainNode } from "@/utils/audio";

const VITE_CDN_IMG = import.meta.env.VITE_CDN_IMG;

const Artwork = () => {
  const { isOpen, onOpen } = useDisclosure();
  const dispatch = useDispatch();
  const artistName = useSelector(state => state.releases.activeRelease.artistName);
  const artwork = useSelector(state => state.releases.activeRelease.artwork, shallowEqual);
  const isLoading = useSelector(state => state.releases.isLoading);
  const isPlaying = useSelector(state => state.player.isPlaying);
  const playerIsInitialised = useSelector(state => state.player.isInitialised);
  const playerReleaseId = useSelector(state => state.player.releaseId);
  const releaseId = useSelector(state => state.releases.activeRelease._id);
  const releaseTitle = useSelector(state => state.releases.activeRelease.releaseTitle);
  const trackList = useSelector(state => state.releases.activeRelease.trackList);
  const hasNoPlayableTracks = trackList.every(({ isBonus }: ReleaseTrack) => isBonus === true);

  const handlePlayRelease = useCallback(() => {
    const audioPlayer = document.getElementById("player") as HTMLAudioElement;

    if (!audioPlayer.paused && playerReleaseId === releaseId) {
      dispatch(playerPause());
      fadeAudio("out").then(() => audioPlayer.pause());
    } else if (audioPlayer.paused && playerReleaseId === releaseId) {
      audioPlayer.play();
      fadeAudio("in");
      dispatch(playerPlay());
    } else {
      if (audioPlayer.paused) {
        getGainNode().gain.value = 0; // Prevents buffered audio from playing when loading a new track.
        audioPlayer.play().catch(console.warn); // Use click event to start playback on iOS.
      }

      const [{ _id: trackId, trackTitle }] = trackList;
      dispatch(loadTrack({ artistName, releaseId, releaseTitle, trackId, trackTitle }));
      dispatch(toastInfo({ message: `'${trackTitle}'`, title: "Loading" }));
    }
  }, [artistName, dispatch, playerReleaseId, releaseId, releaseTitle, trackList]);

  return (
    <Skeleton isLoaded={!isLoading && isOpen}>
      <Box
        _hover={
          hasNoPlayableTracks
            ? undefined
            : {
                "> *": {
                  boxShadow: "lg",
                  opacity: 1,
                  transition: "0.5s cubic-bezier(0.2, 0.8, 0.4, 1)",
                  visibility: "visible"
                }
              }
        }
        key={releaseId}
        position={"relative"}
      >
        <Fade in={isOpen}>
          <Box display="block" position="relative" pt="100%">
            <Image
              alt={releaseTitle}
              fallbackSrc={placeholder}
              inset={0}
              loading="lazy"
              onError={onOpen}
              onLoad={onOpen}
              position="absolute"
              src={
                artwork.status === "stored"
                  ? `${VITE_CDN_IMG}/${releaseId}`
                  : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              }
            />
          </Box>
        </Fade>
        <Flex
          alignItems="stretch"
          background="rgba(0, 0, 0, 0.5)"
          bottom={0}
          left={0}
          opacity={0}
          position="absolute"
          right={0}
          title={`${artistName} - ${releaseTitle}`}
          top={0}
          transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
          visibility="hidden"
        >
          {hasNoPlayableTracks ? null : (
            <IconButton
              _hover={{ color: "#fff" }}
              alignItems="center"
              aria-label="Start audio playback."
              color="hsla(233, 10%, 75%, 1)"
              display="flex"
              flex="1"
              fontSize="5rem"
              height="unset"
              icon={
                !playerIsInitialised ? (
                  <Spinner size="xl" />
                ) : (
                  <Box
                    _groupHover={{ transform: "scale(1.2)" }}
                    as={FontAwesomeIcon}
                    icon={isPlaying && releaseId === playerReleaseId ? faPause : faPlay}
                    transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
                  />
                )
              }
              isDisabled={!playerIsInitialised}
              justifyContent="center"
              onClick={handlePlayRelease}
              role="group"
              title={`${artistName} - ${releaseTitle}`}
              variant="unstyled"
            />
          )}
        </Flex>
      </Box>
    </Skeleton>
  );
};

export default Artwork;
