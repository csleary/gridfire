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
      {trackList.map(({ _id: trackId, trackTitle }) => (
        <ListItem key={trackId}>
          <Button
            color="gray.500"
            variant="link"
            onClick={() => {
              if (trackId !== playerTrackId) {
                batch(() => {
                  dispatch(playTrack({ releaseId, trackId, artistName, trackTitle }));
                  dispatch(toastInfo({ message: `'${trackTitle}'`, title: "Loading" }));
                });
              } else if (!isPlaying) {
                const audioPlayer = document.getElementById("player");
                audioPlayer.play();
                return dispatch(playerPlay());
              }
            }}
          >
            {trackTitle}
          </Button>
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
