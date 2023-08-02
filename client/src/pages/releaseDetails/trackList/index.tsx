import {
  Box,
  Button,
  ListItem,
  Spacer,
  UnorderedList,
  keyframes,
  useColorModeValue,
  Badge,
  Tooltip
} from "@chakra-ui/react";
import { faCloudDownload, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "hooks";
import { toastError, toastInfo, toastWarning } from "state/toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AddToBasketButton from "./addToBasketButton";
import PurchaseTrackButton from "./purchaseTrackButton";
import { TrackForPurchase } from "types";
import { addToBasket } from "state/web3";
import axios from "axios";
import { loadTrack } from "state/player";
import { parseEther } from "ethers";
import { purchaseRelease } from "web3";
import { shallowEqual } from "react-redux";
import Icon from "components/icon";
import { fadeAudio } from "utils";

const { REACT_APP_CDN_IMG } = process.env;
const pulsing = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const animation = `${pulsing} 500ms cubic-bezier(0, 0.85, 0.15, 1) alternate infinite 250ms`;

const TrackList = () => {
  const dispatch = useDispatch();
  const artistName = useSelector(state => state.releases.activeRelease.artistName);
  const basket = useSelector(state => state.web3.basket, shallowEqual);
  const daiAllowance = useSelector(state => state.web3.daiAllowance);
  const isPaused = useSelector(state => state.player.isPaused);
  const isPlaying = useSelector(state => state.player.isPlaying);
  const playerTrackId = useSelector(state => state.player.trackId, shallowEqual);
  const purchases = useSelector(state => state.user.purchases, shallowEqual);
  const releaseId = useSelector(state => state.releases.activeRelease._id);
  const releaseTitle = useSelector(state => state.releases.activeRelease.releaseTitle);
  const trackList = useSelector(state => state.releases.activeRelease.trackList, shallowEqual);
  const userId = useSelector(state => state.user.userId);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const secondaryColour = useColorModeValue("gray.400", "gray.500");
  const titleColour = useColorModeValue("gray.500", "gray.300");

  const handleAddToBasket = useCallback(
    async ({ price, trackId, trackTitle }: { price: string; trackId: string; trackTitle: string }) => {
      try {
        const res = await axios.get(`/api/release/${releaseId}/purchase`);
        const { paymentAddress } = res.data;
        const priceInWei = parseEther(price);

        dispatch(
          addToBasket({
            artistName,
            releaseId: trackId,
            imageUrl: `${REACT_APP_CDN_IMG}/${releaseId}`,
            paymentAddress,
            price: priceInWei.toString(),
            title: trackTitle
          })
        );
      } catch (error) {
        console.error(error);
      }
    },
    [artistName, dispatch, releaseId]
  );

  const handlePurchaseTrack = useCallback(
    async ({ price, trackId }: TrackForPurchase) => {
      try {
        setIsPurchasing(true);
        const res = await axios.get(`/api/release/${releaseId}/purchase`);
        const { paymentAddress } = res.data;
        await purchaseRelease({ paymentAddress, price, releaseId: trackId, userId });
      } catch (error: any) {
        if (error.code === "ACTION_REJECTED") {
          return void dispatch(toastWarning({ message: "Purchase cancelled.", title: "Cancelled" }));
        }

        if (error.code === -32603) {
          return void dispatch(
            toastError({
              message: "DAI balance too low. Please add more DAI or use a different account.",
              title: "Payment Error"
            })
          );
        }

        dispatch(toastError({ message: error.data?.message || error.message || error.toString(), title: "Error" }));
        console.error(error);
      } finally {
        setIsPurchasing(false);
      }
    },
    [dispatch, releaseId, userId]
  );

  const handleClick = useCallback(
    (trackId: string, trackTitle: string) => () => {
      if (trackId !== playerTrackId) {
        const audioPlayer = document.getElementById("player") as HTMLAudioElement;

        if (audioPlayer.paused) {
          audioPlayer.muted = true; // Prevents buffered audio from playing when loading a new track.
          audioPlayer.play().catch(console.warn); // Use click event to start playback on iOS.
        }

        fadeAudio(audioPlayer, "out").then(() => {
          dispatch(loadTrack({ artistName, releaseId, releaseTitle, trackId, trackTitle }));
          dispatch(toastInfo({ message: `'${trackTitle}'`, title: "Loading" }));
        });
      }
    },
    [artistName, dispatch, playerTrackId, releaseId, releaseTitle]
  );

  return (
    <UnorderedList marginInlineStart={0} mb={8} styleType="none" stylePosition="inside">
      {trackList.map(({ _id: trackId, duration, isBonus, isEditionOnly, price, trackTitle }, index) => {
        const allowanceTooLow = parseEther(price.toString()) > BigInt(daiAllowance) || BigInt(daiAllowance) === 0n;
        const inBasket = basket.some(item => item.releaseId === trackId);
        const inCollection = purchases.some(sale => sale.release === releaseId);
        const trackInCollection = purchases.some(sale => sale.release === trackId);

        return (
          <ListItem key={trackId} display="flex" alignItems="center" role="group">
            <Box as="span" color={secondaryColour} fontWeight="600" mr="2">
              {(index + 1).toString(10).padStart(2, "0")}
            </Box>
            {isBonus ? (
              <Box color={secondaryColour} fontWeight="500" minWidth={2} textAlign="left" whiteSpace="break-spaces">
                {trackTitle}
              </Box>
            ) : (
              <Button
                color={titleColour}
                minWidth={2}
                textAlign="left"
                variant="link"
                whiteSpace="break-spaces"
                onClick={handleClick(trackId, trackTitle)}
              >
                {trackTitle}
              </Button>
            )}
            {duration ? (
              <Box as="span" color={secondaryColour} fontWeight="600" ml="2">
                ({Math.floor(duration / 60)}:{(Math.ceil(duration) % 60).toString(10).padStart(2, "0")})
              </Box>
            ) : null}
            {isBonus ? null : trackId === playerTrackId && isPlaying ? (
              <Box as={FontAwesomeIcon} icon={faPlay} animation={animation} ml={2} />
            ) : trackId === playerTrackId && isPaused ? (
              <Box as={FontAwesomeIcon} icon={faPause} animation={animation} ml={2} />
            ) : null}
            {isBonus ? (
              <Tooltip label={`\u2018${trackTitle}\u2019 is a download exclusive.`}>
                <Icon color="gray.300" icon={faCloudDownload} ml={2} />
              </Tooltip>
            ) : null}
            {isEditionOnly ? (
              <Tooltip label={`\u2018${trackTitle}\u2019 is an exclusive for one or more Editions.`}>
                <Badge
                  _before={{
                    content: '""',
                    zIndex: "-1",
                    position: "absolute",
                    inset: "0",
                    background:
                      "linear-gradient(45deg, var(--chakra-colors-green-200) 0%, var(--chakra-colors-blue-600) 40%, var(--chakra-colors-purple-600) 100% )",
                    opacity: "0.65",
                    transition: "opacity 0.3s",
                    borderRadius: "inherit",
                    _hover: {
                      opacity: "1.0"
                    }
                  }}
                  _after={{
                    content: '""',
                    zIndex: "-1",
                    position: "absolute",
                    inset: "0",
                    background: "inherit",
                    borderRadius: "inherit"
                  }}
                  boxShadow="none"
                  color="whiteAlpha.800"
                  ml={2}
                  position="relative"
                  variant="outline"
                  zIndex="1"
                >
                  Edition
                </Badge>
              </Tooltip>
            ) : null}
            <Spacer />
            {isBonus || isEditionOnly ? null : (
              <PurchaseTrackButton
                allowanceTooLow={allowanceTooLow}
                artistName={artistName}
                handlePurchaseTrack={handlePurchaseTrack}
                inCollection={inCollection}
                isPurchasing={isPurchasing}
                price={price}
                trackId={trackId}
                trackInCollection={trackInCollection}
                trackTitle={trackTitle}
              />
            )}
            {isBonus || isEditionOnly ? null : (
              <AddToBasketButton
                artistName={artistName}
                handleAddToBasket={handleAddToBasket}
                inBasket={inBasket}
                inCollection={inCollection}
                price={price}
                trackId={trackId}
                trackInCollection={trackInCollection}
                trackTitle={trackTitle}
              />
            )}
          </ListItem>
        );
      })}
    </UnorderedList>
  );
};

export default TrackList;
