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
import { faCheck, faPause, faPlay, faShoppingBasket } from "@fortawesome/free-solid-svg-icons";
import { playTrack, playerPlay } from "state/player";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Icon from "components/icon";
import { addToBasket } from "state/web3";
import { CLOUD_URL } from "index";
import axios from "axios";
import { purchaseRelease } from "web3/contract";
import { toastInfo } from "state/toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { utils } from "ethers";

const pulsing = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const animation = `${pulsing} 500ms cubic-bezier(0, 0.85, 0.15, 1) alternate infinite 250ms`;

const TrackList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { basket, daiAllowance, isConnected, isFetchingAllowance } = useSelector(state => state.web3, shallowEqual);
  const { purchases, userId } = useSelector(state => state.user, shallowEqual);
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const { isPlaying, isPaused, trackId: playerTrackId } = useSelector(state => state.player, shallowEqual);
  const [isPurchasing, setIsPurchasing] = useState(false);
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

  const handlePurchaseTrack = async ({ price, trackId }) => {
    try {
      setIsPurchasing(true);
      const res = await axios.get(`/api/release/${releaseId}/purchase`);
      const { paymentAddress } = res.data;
      await purchaseRelease({ paymentAddress, price, releaseId: trackId, userId });
    } catch (error) {
      console.error(error);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <UnorderedList marginInlineStart={0} mb={8} styleType="none" stylePosition="inside">
      {trackList.map(({ _id: trackId, duration, price, trackTitle }, index) => {
        const allowanceTooLow = utils.parseEther(price.toString()).gt(daiAllowance);
        const inBasket = basket.some(item => item.releaseId === trackId);
        const inCollection = purchases.some(sale => sale.release === releaseId);
        const trackInCollection = purchases.some(sale => sale.release === trackId);

        return (
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
              label={`Purchase \u2018${trackTitle}\u2019, by ${artistName}.`}
              bg={tooltipBgColor}
              color={tooltipColor}
            >
              <Button
                isDisabled={!isConnected || isFetchingAllowance || inCollection || isPurchasing || trackInCollection}
                icon={<Icon icon={inCollection || trackInCollection ? faCheck : faShoppingBasket} />}
                onClick={
                  allowanceTooLow
                    ? () => navigate("/dashboard/payment/approvals")
                    : handlePurchaseTrack.bind(null, { price, trackId })
                }
                size="sm"
                alignSelf="stretch"
                height="unset"
                ml={1}
                variant="ghost"
              >
                <Box as="span" color="gray.500" mr="0.2rem">
                  ◈
                </Box>
                {Number(price).toFixed(2)}
              </Button>
            </Tooltip>
            {inCollection ? null : (
              <Tooltip
                hasArrow
                openDelay="500"
                label={
                  trackInCollection
                    ? "You own this track."
                    : `Add \u2018${trackTitle}\u2019, by ${artistName}, to your basket.`
                }
                bg={tooltipBgColor}
                color={tooltipColor}
              >
                <IconButton
                  isDisabled={inBasket}
                  icon={
                    <Icon
                      color={trackInCollection ? "green.300" : null}
                      icon={trackInCollection ? faCheck : faShoppingBasket}
                    />
                  }
                  onClick={
                    trackInCollection
                      ? () => navigate("/dashboard/collection")
                      : handleAddToBasket.bind(null, { price, trackId, trackTitle })
                  }
                  size="sm"
                  alignSelf="stretch"
                  height="unset"
                  variant="ghost"
                />
              </Tooltip>
            )}
          </ListItem>
        );
      })}
    </UnorderedList>
  );
};

export default TrackList;
