import { Box, Flex, IconButton, Image, Square } from "@chakra-ui/react";
import { batch, shallowEqual, useDispatch, useSelector } from "react-redux";
import { faEllipsisH, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { playTrack, playerPause, playerPlay } from "features/player";
import { CLOUD_URL } from "index";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link as RouterLink } from "react-router-dom";
import OverlayDownloadButton from "./downloadButton";
import PropTypes from "prop-types";
import { fetchRelease } from "features/releases";
import placeholder from "placeholder.svg";
import { toastInfo } from "features/toast";

const RenderRelease = ({ release, showArtist = true, showTitle = true, type }) => {
  const dispatch = useDispatch();
  const { isPlaying, releaseId: playerReleaseId } = useSelector(state => state.player, shallowEqual);

  if (!release) {
    return (
      <Square position="relative">
        <Image alt="Release not found." loading="lazy" src={placeholder} />
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
      </Square>
    );
  }

  const { _id: releaseId, artist, artistName, artwork = {}, releaseTitle, trackList } = release;
  const { cid } = artwork;

  const handlePlayTrack = () => {
    const audioPlayer = document.getElementById("player");

    if (isPlaying && playerReleaseId === releaseId) {
      audioPlayer.pause();
      dispatch(playerPause());
    } else if (playerReleaseId === releaseId) {
      audioPlayer.play();
      dispatch(playerPlay());
    } else {
      const [{ _id: trackId, trackTitle }] = trackList;

      batch(() => {
        dispatch(playTrack({ releaseId, trackId, artistName, trackTitle }));
        dispatch(fetchRelease(releaseId));
        dispatch(toastInfo({ message: `${artistName} - '${trackTitle}'`, title: "Loading" }));
      });
    }
  };

  return (
    <Square
      key={releaseId}
      position={"relative"}
      _hover={{
        "> *": { boxShadow: "lg", opacity: 1, transition: "0.5s cubic-bezier(0.2, 0.8, 0.4, 1)", visibility: "visible" }
      }}
    >
      <Image
        alt={`${artistName} - ${releaseTitle}`}
        fallbackSrc={placeholder}
        loading="lazy"
        src={artwork.status === "stored" ? `${CLOUD_URL}/${cid}` : placeholder}
      />
      <Flex
        background="rgba(0, 0, 0, 0.5)"
        bottom={0}
        direction="column"
        left={0}
        opacity={0}
        position="absolute"
        right={0}
        title={`${artistName} - ${releaseTitle}`}
        top={0}
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
          <IconButton
            alignItems="center"
            color="hsla(233, 10%, 75%, 1)"
            display="flex"
            flex="0 1 50%"
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
            onClick={handlePlayTrack}
            title={`Play '${releaseTitle}', by ${artistName}`}
            variant="unstyled"
            _hover={{ color: "#fff" }}
          />
          <IconButton
            as={RouterLink}
            to={`/release/${releaseId}`}
            alignItems="center"
            color="hsla(233, 10%, 75%, 1)"
            display="flex"
            flex="0 1 50%"
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
            role="group"
            title={`More information on '${releaseTitle}', by ${artistName}`}
            transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
            variant="unstyled"
            _hover={{ color: "#fff" }}
          />
          {type === "collection" ? (
            <OverlayDownloadButton
              artistName={artistName}
              artworkCID={cid}
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
            py={3}
            px={5}
            transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
            _hover={{ color: "#fff" }}
          >
            {releaseTitle}
          </Flex>
        ) : null}
      </Flex>
    </Square>
  );
};

RenderRelease.propTypes = {
  className: PropTypes.string,
  release: PropTypes.object,
  showArtist: PropTypes.bool,
  showTitle: PropTypes.bool,
  type: PropTypes.string
};

export default RenderRelease;
