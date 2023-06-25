import { Box, Fade, Flex, IconButton, Image, Skeleton, useDisclosure } from "@chakra-ui/react";
import { PurchasedRelease, Release, ReleaseTrack } from "types";
import { faEllipsisH, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { loadTrack, playerPause, playerPlay } from "state/player";
import { useDispatch, useSelector } from "hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link as RouterLink } from "react-router-dom";
import OverlayDownloadButton from "./downloadButton";
import { fadeAudio } from "utils";
import placeholder from "placeholder.svg";
import { setIsLoading } from "state/releases";
import { shallowEqual } from "react-redux";
import { toastInfo } from "state/toast";

const { REACT_APP_CDN_IMG } = process.env;

interface Props {
  release: Release | PurchasedRelease;
  showArtist?: boolean;
  showTitle?: boolean;
  type?: string;
  [key: string]: any;
}

const isPurchasedRelease = (release: Release | PurchasedRelease): release is PurchasedRelease => {
  return (release as PurchasedRelease).purchaseId !== undefined;
};

const RenderRelease = ({ release, showArtist = true, showTitle = true, type, ...rest }: Props) => {
  const { isOpen, onOpen } = useDisclosure();
  const dispatch = useDispatch();
  const { isPlaying, releaseId: playerReleaseId } = useSelector(state => state.player, shallowEqual);

  if (!release) {
    return (
      <Box position="relative" {...rest}>
        <Fade in={isOpen}>
          <Box display="block" pt="100%" position="relative">
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

      fadeAudio(audioPlayer, "out").then(() => {
        audioPlayer.pause();
      });
    } else if (audioPlayer.paused && playerReleaseId === releaseId) {
      audioPlayer.play();
      fadeAudio(audioPlayer, "in");
      dispatch(playerPlay());
    } else {
      if (audioPlayer.paused) {
        audioPlayer.muted = true; // Prevents buffered audio from playing when loading a new track.
        audioPlayer.play().catch(console.warn); // Use click event to start playback on iOS.
      }

      const [{ _id: trackId, trackTitle }] = trackList;
      dispatch(toastInfo({ message: `${artistName} - '${trackTitle}'`, title: "Loading" }));
      dispatch(loadTrack({ artistName, releaseId, releaseTitle, trackId, trackTitle }));
    }
  };

  const handleClickNavigate = () => dispatch(setIsLoading(true));

  return (
    <Box
      key={releaseId}
      position="relative"
      _hover={{
        "> *": { boxShadow: "lg", opacity: 1, transition: "0.5s cubic-bezier(0.2, 0.8, 0.4, 1)", visibility: "visible" }
      }}
      {...rest}
    >
      <Box display="flex" pt="100%" position="relative">
        <Skeleton inset={0} isLoaded={isOpen} position="absolute" />
        <Fade in={isOpen}>
          <Image
            alt={`${artistName} - ${releaseTitle}`}
            fallbackSrc={placeholder}
            inset={0}
            loading="lazy"
            onLoad={onOpen}
            onError={onOpen}
            position="absolute"
            src={artwork.status === "stored" ? `${REACT_APP_CDN_IMG}/${releaseId}` : placeholder}
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
            as={RouterLink}
            to={`/artist/${artist}`}
            justifyContent="center"
            color="hsla(233, 10%, 75%, 1)"
            fontSize="1.2rem"
            fontWeight={500}
            py={3}
            px={5}
            transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
            title={`Visit the artist page for ${artistName}`}
            _active={{ background: "none" }}
            _hover={{ color: "#fff", textDecoration: "none" }}
          >
            {artistName}
          </Flex>
        ) : null}
        <Flex flex="1 0 auto" flexWrap="wrap">
          {hasNoPlayableTracks ? null : (
            <IconButton
              alignItems="center"
              aria-label={`Play '${releaseTitle}', by ${artistName}`}
              color="hsla(233, 10%, 75%, 1)"
              display="flex"
              flex="1 1 auto"
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
              onClick={handleClick}
              title={`Play '${releaseTitle}', by ${artistName}`}
              variant="unstyled"
              _hover={{ color: "#fff" }}
            />
          )}
          <IconButton
            as={RouterLink}
            to={`/release/${releaseId}`}
            alignItems="center"
            aria-label={`More information on '${releaseTitle}', by ${artistName}`}
            color="hsla(233, 10%, 75%, 1)"
            display="flex"
            flex="1 1 auto"
            fontSize="5rem"
            height="unset"
            justifyContent="center"
            icon={
              <Box
                as={FontAwesomeIcon}
                icon={faEllipsisH}
                transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
                _groupHover={{ transform: "scale(1.2)" }}
              />
            }
            onClick={handleClickNavigate}
            role="group"
            title={`More information on '${releaseTitle}', by ${artistName}`}
            transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
            variant="unstyled"
            _hover={{ color: "#fff" }}
          />
          {type === "collection" && isPurchasedRelease(release) ? (
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
            as={RouterLink}
            to={`/release/${releaseId}`}
            justifyContent="center"
            title={`More information on '${releaseTitle}', by ${artistName}`}
            color="hsla(233, 10%, 75%, 1)"
            fontSize="1.2rem"
            fontWeight={500}
            onClick={handleClickNavigate}
            py={3}
            px={5}
            transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
            _hover={{ color: "#fff" }}
          >
            {releaseTitle}
          </Flex>
        ) : null}
      </Flex>
    </Box>
  );
};

export default RenderRelease;
