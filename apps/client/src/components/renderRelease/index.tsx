import { Box, ChakraProps, Fade, Flex, IconButton, Image, Skeleton, Spinner, useDisclosure } from "@chakra-ui/react";
import { faEllipsisH, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Release, ReleaseTrack } from "@gridfire/shared/types";
import { Link as RouterLink } from "react-router-dom";

import OverlayDownloadButton from "@/components/renderRelease/downloadButton";
import { useDispatch, useSelector } from "@/hooks";
import placeholder from "@/placeholder.svg";
import { loadTrack, playerPause, playerPlay } from "@/state/player";
import { setIsLoading } from "@/state/releases";
import { toastInfo } from "@/state/toast";
import { fadeAudio, getGainNode } from "@/utils/audio";

const VITE_CDN_IMG = import.meta.env.VITE_CDN_IMG;

type DownloadRelease = Release & { purchaseId: string };

interface Props extends ChakraProps {
  release: DownloadRelease | Release;
  showArtist?: boolean;
  showTitle?: boolean;
  type?: string;
}

const isDownloadRelease = (release: Release): release is DownloadRelease => {
  if ("purchaseId" in release) return true;
  return false;
};

const RenderRelease = ({ release, showArtist = true, showTitle = true, type, ...rest }: Props) => {
  const { isOpen, onOpen } = useDisclosure();
  const dispatch = useDispatch();
  const isPlaying = useSelector(state => state.player.isPlaying);
  const playerIsInitialised = useSelector(state => state.player.isInitialised);
  const playerReleaseId = useSelector(state => state.player.releaseId);

  if (!release) {
    return (
      <Box position="relative" {...rest}>
        <Fade in={isOpen}>
          <Box display="block" position="relative" pt="100%">
            <Image
              alt="Release not found."
              inset={0}
              loading="lazy"
              onLoad={onOpen}
              position="absolute"
              src={placeholder}
            />
          </Box>
        </Fade>
        <Box
          bottom={0}
          color="gray.600"
          fontSize="1.2rem"
          fontWeight={500}
          padding="0.75rem 1.25rem"
          position="absolute"
          textAlign="center"
          textTransform="uppercase"
        >
          Release not found
        </Box>
      </Box>
    );
  }

  const { _id: releaseId, artist, artistName, artwork, releaseTitle, trackList } = release;
  const hasNoPlayableTracks = trackList.every(({ isBonus }: ReleaseTrack) => isBonus === true);

  const handleClick = () => {
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
      dispatch(toastInfo({ message: `${artistName} - '${trackTitle}'`, title: "Loading" }));
    }
  };

  const handleClickNavigate = () => dispatch(setIsLoading(true));

  return (
    <Box
      _hover={{
        "> *": { boxShadow: "lg", opacity: 1, transition: "0.5s cubic-bezier(0.2, 0.8, 0.4, 1)", visibility: "visible" }
      }}
      key={releaseId}
      position="relative"
      {...rest}
    >
      <Box display="flex" position="relative" pt="100%">
        <Skeleton inset={0} isLoaded={isOpen} position="absolute" />
        <Fade in={isOpen}>
          <Image
            alt={`${artistName} - ${releaseTitle}`}
            fallbackSrc={placeholder}
            inset={0}
            loading="lazy"
            onError={onOpen}
            onLoad={onOpen}
            position="absolute"
            src={artwork.status === "stored" ? `${VITE_CDN_IMG}/${releaseId}` : placeholder}
          />
        </Fade>
      </Box>
      <Flex
        background="rgba(0, 0, 0, 0.5)"
        direction="column"
        inset={0}
        opacity={0}
        position="absolute"
        title={`${artistName} - ${releaseTitle}`}
        transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
        visibility="hidden"
      >
        {showArtist ? (
          <Flex
            _active={{ background: "none" }}
            _hover={{ color: "#fff", textDecoration: "none" }}
            as={RouterLink}
            color="hsla(233, 10%, 75%, 1)"
            fontSize="1.2rem"
            fontWeight={500}
            justifyContent="center"
            px={5}
            py={3}
            title={`Visit the artist page for ${artistName}`}
            to={`/artist/${artist}`}
            transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
          >
            {artistName}
          </Flex>
        ) : null}
        <Flex flex="1 0 auto" flexWrap="wrap">
          {hasNoPlayableTracks ? null : (
            <IconButton
              _hover={{ color: "#fff" }}
              alignItems="center"
              aria-label={`Play '${releaseTitle}', by ${artistName}`}
              color="hsla(233, 10%, 75%, 1)"
              display="flex"
              flex="1 1 auto"
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
              onClick={handleClick}
              role="group"
              title={`Play '${releaseTitle}', by ${artistName}`}
              variant="unstyled"
            />
          )}
          <IconButton
            _hover={{ color: "#fff" }}
            alignItems="center"
            aria-label={`More information on '${releaseTitle}', by ${artistName}`}
            as={RouterLink}
            color="hsla(233, 10%, 75%, 1)"
            display="flex"
            flex="1 1 auto"
            fontSize="5rem"
            height="unset"
            icon={
              <Box
                _groupHover={{ transform: "scale(1.2)" }}
                as={FontAwesomeIcon}
                icon={faEllipsisH}
                transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
              />
            }
            justifyContent="center"
            onClick={handleClickNavigate}
            role="group"
            title={`More information on '${releaseTitle}', by ${artistName}`}
            to={`/release/${releaseId}`}
            transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
            variant="unstyled"
          />
          {type === "collection" && isDownloadRelease(release) ? (
            <OverlayDownloadButton
              artistName={artistName}
              purchaseId={release.purchaseId}
              releaseId={releaseId}
              releaseTitle={releaseTitle}
            />
          ) : null}
        </Flex>
        {showTitle ? (
          <Flex
            _hover={{ color: "#fff" }}
            as={RouterLink}
            color="hsla(233, 10%, 75%, 1)"
            fontSize="1.2rem"
            fontWeight={500}
            justifyContent="center"
            onClick={handleClickNavigate}
            px={5}
            py={3}
            title={`More information on '${releaseTitle}', by ${artistName}`}
            to={`/release/${releaseId}`}
            transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
          >
            {releaseTitle}
          </Flex>
        ) : null}
      </Flex>
    </Box>
  );
};

export default RenderRelease;
