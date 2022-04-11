import { Box, Button, ListItem, UnorderedList, keyframes } from "@chakra-ui/react";
import { batch, shallowEqual, useDispatch, useSelector } from "react-redux";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { playTrack, playerPlay } from "features/player";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toastInfo } from "features/toast";

const pulsing = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const animation = `${pulsing} 500ms cubic-bezier(0, 0.85, 0.15, 1) alternate infinite 250ms`;

const TrackList = () => {
  const dispatch = useDispatch();
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const { isPlaying, isPaused, trackId: playerTrackId } = useSelector(state => state.player, shallowEqual);
  const { _id: releaseId, artistName, trackList } = release;

  return (
    <UnorderedList marginInlineStart={0} mb={8} styleType="none" stylePosition="inside">
      {trackList.map(({ _id: trackId, duration, trackTitle }, index) => (
        <ListItem key={trackId}>
          <Box as="span" color="gray.400" fontWeight="600" mr="2">
            {(index + 1).toString(10).padStart(2, "0")}
          </Box>
          <Button
            color="gray.500"
            variant="link"
            onClick={async () => {
              if (trackId !== playerTrackId) {
                dispatch(playTrack({ releaseId, trackId, artistName, trackTitle }));
                dispatch(toastInfo({ message: `'${trackTitle}'`, title: "Loading" }));
              } else if (!isPlaying) {
                const audioPlayer = document.getElementById("player");
                await audioPlayer.play().catch(console.log);
                dispatch(playerPlay());
              }
            }}
          >
            {trackTitle}
          </Button>
          <Box as="span" color="gray.400" fontWeight="600" ml="2">
            ({Math.floor(duration / 60)}:{(Math.ceil(duration) % 60).toString(10).padStart(2, "0")})
          </Box>
          {trackId === playerTrackId && isPlaying ? (
            <Box as={FontAwesomeIcon} icon={faPlay} animation={animation} ml={2} />
          ) : trackId === playerTrackId && isPaused ? (
            <Box as={FontAwesomeIcon} icon={faPause} animation={animation} ml={2} />
          ) : null}
        </ListItem>
      ))}
    </UnorderedList>
  );
};

export default TrackList;
