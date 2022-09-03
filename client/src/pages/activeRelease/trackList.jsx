import {
  Box,
  Button,
  IconButton,
  ListItem,
  Spacer,
  Tooltip,
  UnorderedList,
  keyframes,
  useColorModeValue
} from "@chakra-ui/react";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { playTrack, playerPlay } from "state/player";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Icon from "components/icon";
import { addToBasket } from "state/web3";
import { CLOUD_URL } from "index";
import axios from "axios";
import { faCheck, faShoppingBasket } from "@fortawesome/free-solid-svg-icons";
import { toastInfo } from "state/toast";
import { utils } from "ethers";

const pulsing = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const animation = `${pulsing} 500ms cubic-bezier(0, 0.85, 0.15, 1) alternate infinite 250ms`;

const TrackList = () => {
  const dispatch = useDispatch();
  const { basket } = useSelector(state => state.web3, shallowEqual);
  const { purchases } = useSelector(state => state.user, shallowEqual);
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const { isPlaying, isPaused, trackId: playerTrackId } = useSelector(state => state.player, shallowEqual);
  const { _id: releaseId, artistName, artwork, releaseTitle, trackList } = release;
  const secondaryColor = useColorModeValue("gray.400", "gray.500");
  const titleColor = useColorModeValue("gray.500", "gray.300");
  const tooltipBgColor = useColorModeValue("gray.200", "gray.800");
  const tooltipColor = useColorModeValue("gray.800", "gray.100");

  const handleAddToBasket = async ({ price, trackId, trackTitle }) => {
    try {
      const res = await axios.get(`/api/release/${releaseId}/purchase`);
      const { paymentAddress } = res.data;
      const priceInWei = utils.parseEther(price.toString());

      dispatch(
        addToBasket({
          artistName,
          releaseId: trackId,
          imageUrl: `${CLOUD_URL}/${artwork.cid}`,
          paymentAddress,
          price: priceInWei,
          title: trackTitle
        })
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <UnorderedList marginInlineStart={0} mb={8} styleType="none" stylePosition="inside">
      {trackList.map(({ _id: trackId, duration, price, trackTitle }, index) => (
        <ListItem key={trackId} display="flex" alignItems="center" role="group">
          <Box as="span" color={secondaryColor} fontWeight="600" mr="2">
            {(index + 1).toString(10).padStart(2, "0")}
          </Box>
          <Button
            color={titleColor}
            minWidth={2}
            textAlign="left"
            variant="link"
            whiteSpace="break-spaces"
            onClick={async () => {
              if (trackId !== playerTrackId) {
                dispatch(playTrack({ artistName, releaseId, releaseTitle, trackId, trackTitle }));
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
          {duration ? (
            <Box as="span" color={secondaryColor} fontWeight="600" ml="2">
              ({Math.floor(duration / 60)}:{(Math.ceil(duration) % 60).toString(10).padStart(2, "0")})
            </Box>
          ) : null}
          {trackId === playerTrackId && isPlaying ? (
            <Box as={FontAwesomeIcon} icon={faPlay} animation={animation} ml={2} />
          ) : trackId === playerTrackId && isPaused ? (
            <Box as={FontAwesomeIcon} icon={faPause} animation={animation} ml={2} />
          ) : null}
          <Spacer />
          <Tooltip
            hasArrow
            openDelay="500"
            label={`Add \u2018${trackTitle}\u2019, by ${artistName}, to your basket.`}
            bg={tooltipBgColor}
            color={tooltipColor}
          >
            <IconButton
              isDisabled={
                basket.some(item => item.releaseId === trackId) ||
                purchases.some(sale => sale.release === trackId) ||
                purchases.some(sale => sale.release === releaseId)
              }
              icon={
                <Icon
                  icon={
                    purchases.some(sale => sale.release === trackId) ||
                    purchases.some(sale => sale.release === releaseId)
                      ? faCheck
                      : faShoppingBasket
                  }
                />
              }
              onClick={handleAddToBasket.bind(null, { price, trackId, trackTitle })}
              size="sm"
              alignSelf="stretch"
              height="unset"
              ml={2}
              variant="ghost"
            />
          </Tooltip>
        </ListItem>
      ))}
    </UnorderedList>
  );
};

export default TrackList;
