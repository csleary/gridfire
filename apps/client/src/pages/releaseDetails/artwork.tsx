import { useDispatch, useSelector } from "@/hooks";
import placeholder from "@/placeholder.svg";
import { loadTrack, playerPause, playerPlay } from "@/state/player";
import { toastInfo } from "@/state/toast";
import { ReleaseTrack } from "@/types";
import { fadeAudio, getGainNode } from "@/utils/audio";
import { Box, Fade, Flex, IconButton, Image, Skeleton, useDisclosure } from "@chakra-ui/react";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback } from "react";
import { shallowEqual } from "react-redux";

const VITE_CDN_IMG = import.meta.env.VITE_CDN_IMG;

const Artwork = () => {
  const { isOpen, onOpen } = useDisclosure();
  const dispatch = useDispatch();
  const artistName = useSelector(state => state.releases.activeRelease.artistName);
  const artwork = useSelector(state => state.releases.activeRelease.artwork, shallowEqual);
  const isLoading = useSelector(state => state.releases.isLoading);
  const isPlaying = useSelector(state => state.player.isPlaying);
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
        key={releaseId}
        position={"relative"}
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
      >
        <Fade in={isOpen}>
          <Box display="block" pt="100%" position="relative">
            <Image
              alt={releaseTitle}
              fallbackSrc={placeholder}
              inset={0}
              loading="lazy"
              onLoad={onOpen}
              onError={onOpen}
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
              aria-label="Start audio playback."
              alignItems="center"
              color="hsla(233, 10%, 75%, 1)"
              display="flex"
              flex="1"
              fontSize="5rem"
              height="unset"
              justifyContent="center"
              role="group"
              icon={
                <Box
                  as={FontAwesomeIcon}
                  icon={isPlaying && releaseId === playerReleaseId ? faPause : faPlay}
                  transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
                  _groupHover={{ transform: "scale(1.2)" }}
                />
              }
              onClick={handlePlayRelease}
              title={`${artistName} - ${releaseTitle}`}
              variant="unstyled"
              _hover={{ color: "#fff" }}
            />
          )}
        </Flex>
      </Box>
    </Skeleton>
  );
};

export default Artwork;
