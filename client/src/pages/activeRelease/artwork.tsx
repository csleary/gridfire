import { Box, Flex, IconButton, Square, Image } from "@chakra-ui/react";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { playTrack, playerPause, playerPlay } from "state/player";
import { useDispatch, useSelector } from "hooks";
import { CLOUD_URL } from "index";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import placeholder from "placeholder.svg";
import { shallowEqual } from "react-redux";
import { toastInfo } from "state/toast";

const Artwork = () => {
  const dispatch = useDispatch();
  const { isLoading, activeRelease: release } = useSelector(state => state.releases, shallowEqual);
  const { isPlaying, releaseId: playerReleaseId } = useSelector(state => state.player, shallowEqual);
  const { _id: releaseId, artistName, artwork, releaseTitle, trackList } = release;
  const { cid } = artwork;

  const handlePlayRelease = () => {
    const audioPlayer = document.getElementById("player") as HTMLAudioElement;

    if (isPlaying && playerReleaseId === releaseId) {
      audioPlayer.pause();
      dispatch(playerPause());
    } else if (playerReleaseId === releaseId) {
      audioPlayer.play();
      dispatch(playerPlay());
    } else {
      const [{ _id: trackId, trackTitle }] = trackList;
      dispatch(playTrack({ artistName, releaseId, releaseTitle, trackId, trackTitle }));
      dispatch(toastInfo({ message: `'${trackTitle}'`, title: "Loading" }));
    }
  };

  return (
    <Square
      key={releaseId}
      position={"relative"}
      _hover={{
        "> *": {
          boxShadow: "lg",
          opacity: 1,
          transition: "0.5s cubic-bezier(0.2, 0.8, 0.4, 1)",
          visibility: "visible"
        }
      }}
    >
      <Image
        alt={releaseTitle}
        fallbackSrc={placeholder}
        loading="lazy"
        src={
          artwork.status === "stored" && !isLoading
            ? `${CLOUD_URL}/${cid}`
            : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        }
      />
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
      </Flex>
    </Square>
  );
};

export default Artwork;
