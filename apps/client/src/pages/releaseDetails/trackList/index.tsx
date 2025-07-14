import {
  Badge,
  Box,
  Button,
  IconButton,
  ListItem,
  Spacer,
  Tooltip,
  UnorderedList,
  useColorModeValue
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { faCloudDownload, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TrackForPurchase } from "@gridfire/shared/types";
import axios from "axios";
import { parseEther } from "ethers";
import { lazy, useCallback, useState } from "react";
import { shallowEqual } from "react-redux";

import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { loadTrack } from "@/state/player";
import { toastError, toastInfo, toastWarning } from "@/state/toast";
import { addToBasket } from "@/state/web3";
import { fadeAudio, getGainNode } from "@/utils/audio";
import { purchaseRelease } from "@/web3";
const AddToBasketButton = lazy(() => import("./addToBasketButton"));
const PurchaseTrackButton = lazy(() => import("./purchaseTrackButton"));

const VITE_CDN_IMG = import.meta.env.VITE_CDN_IMG;
const pulsing = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const animation = `${pulsing} 500ms cubic-bezier(0, 0.85, 0.15, 1) alternate infinite 250ms`;

const TrackList = () => {
  const dispatch = useDispatch();
  const artistName = useSelector(state => state.releases.activeRelease.artistName);
  const basket = useSelector(state => state.web3.basket, shallowEqual);
  const daiAllowance = useSelector(state => state.web3.daiAllowance);
  const isPaused = useSelector(state => state.player.isPaused);
  const isPlaying = useSelector(state => state.player.isPlaying);
  const isStopped = !isPlaying && !isPaused;
  const playerIsInitialised = useSelector(state => state.player.isInitialised);
  const playerTrackId = useSelector(state => state.player.trackId, shallowEqual);
  const purchases = useSelector(state => state.user.purchases, shallowEqual);
  const releaseId = useSelector(state => state.releases.activeRelease._id);
  const releaseTitle = useSelector(state => state.releases.activeRelease.releaseTitle);
  const trackList = useSelector(state => state.releases.activeRelease.trackList, shallowEqual);
  const userId = useSelector(state => state.user.userId);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const secondaryColour = useColorModeValue("gray.400", "gray.500");
  const titleColour = useColorModeValue("gray.500", "gray.300");
  const downloadExclusiveColour = useColorModeValue("gray.400", "gray.500");

  const handleAddToBasket = useCallback(
    async ({ price, trackId, trackTitle }: { price: string; trackId: string; trackTitle: string }) => {
      try {
        const res = await axios.get(`/api/release/${releaseId}/purchase`);
        const { paymentAddress } = res.data;
        const priceInWei = parseEther(price);

        dispatch(
          addToBasket({
            artistName,
            imageUrl: `${VITE_CDN_IMG}/${releaseId}`,
            paymentAddress,
            price: priceInWei.toString(),
            releaseId: trackId,
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
    (trackId: string, trackTitle: string) => async () => {
      try {
        const audioPlayer = document.getElementById("player") as HTMLAudioElement;

        if (isStopped && trackId === playerTrackId) {
          getGainNode().gain.value = 1; // Starting playback; no fade.
          return void audioPlayer.play();
        }

        if (isPaused && trackId === playerTrackId) {
          await audioPlayer.play();
          return void fadeAudio("in");
        }

        if (isPaused && playerTrackId && trackId !== playerTrackId) {
          getGainNode().gain.value = 0; // Switching tracks; prevent buffered audio from playing when loading new track.
          dispatch(loadTrack({ artistName, releaseId, releaseTitle, trackId, trackTitle }));
          dispatch(toastInfo({ message: `'${trackTitle}'`, title: "Loading" }));
          return;
        }

        if (trackId !== playerTrackId) {
          if (isPlaying) {
            await fadeAudio("out");
          }

          dispatch(loadTrack({ artistName, releaseId, releaseTitle, trackId, trackTitle }));
          dispatch(toastInfo({ message: `'${trackTitle}'`, title: "Loading" }));
        }
      } catch (error) {
        console.error(error);
      }
    },
    [artistName, dispatch, isPaused, isPlaying, isStopped, playerTrackId, releaseId, releaseTitle]
  );

  return (
    <UnorderedList marginInlineStart={0} mb={8} stylePosition="inside" styleType="none">
      {trackList.map(({ _id: trackId, duration, isBonus, isEditionOnly, price, trackTitle }, index) => {
        const allowanceTooLow = parseEther(price.toString()) > BigInt(daiAllowance) || BigInt(daiAllowance) === 0n;
        const inBasket = basket.some(item => item.releaseId === trackId);
        const inCollection = purchases.some(sale => sale.release === releaseId);
        const trackInCollection = purchases.some(sale => sale.release === trackId);

        return (
          <ListItem alignItems="center" display="flex" key={trackId} role="group">
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
                disabled={!playerIsInitialised}
                minWidth={2}
                onClick={handleClick(trackId, trackTitle)}
                textAlign="left"
                variant="link"
                whiteSpace="break-spaces"
              >
                {trackTitle}
              </Button>
            )}
            {duration ? (
              <Box as="span" color={secondaryColour} fontWeight="600" ml="2">
                ({Math.floor(duration / 60)}:{(Math.ceil(duration) % 60).toString(10).padStart(2, "0")})
              </Box>
            ) : null}
            <Spacer />
            {isBonus ? null : trackId === playerTrackId && isPlaying ? (
              <Box animation={animation} as={FontAwesomeIcon} icon={faPlay} ml={2} />
            ) : trackId === playerTrackId && isPaused ? (
              <Box animation={animation} as={FontAwesomeIcon} icon={faPause} ml={2} />
            ) : null}
            {isBonus ? (
              <Tooltip label={`'${trackTitle}' is a download exclusive.`}>
                <IconButton
                  alignSelf="stretch"
                  aria-label={`'${trackTitle}' is a download exclusive.`}
                  cursor="unset"
                  height="unset"
                  icon={<Icon color={downloadExclusiveColour} fixedWidth icon={faCloudDownload} />}
                  size="sm"
                  variant="unstyled"
                />
              </Tooltip>
            ) : null}
            {isEditionOnly ? (
              <Tooltip label={`'${trackTitle}' is an exclusive for one or more Editions.`}>
                <IconButton
                  alignItems="center"
                  alignSelf="stretch"
                  aria-label={`'${trackTitle}' is an exclusive for one or more Editions.`}
                  cursor="unset"
                  display="flex"
                  height="unset"
                  icon={
                    <Badge
                      _after={{
                        background: "inherit",
                        borderRadius: "inherit",
                        content: '""',
                        inset: "0",
                        position: "absolute",
                        zIndex: "-1"
                      }}
                      _before={{
                        _hover: {
                          opacity: "1.0"
                        },
                        background:
                          "linear-gradient(45deg, var(--chakra-colors-green-200) 0%, var(--chakra-colors-blue-600) 40%, var(--chakra-colors-purple-600) 100% )",
                        borderRadius: "inherit",
                        content: '""',
                        inset: "0",
                        opacity: "0.65",
                        position: "absolute",
                        transition: "opacity 0.3s",
                        zIndex: "-1"
                      }}
                      boxShadow="none"
                      color="whiteAlpha.800"
                      position="relative"
                      variant="outline"
                      zIndex="1"
                    >
                      Edition
                    </Badge>
                  }
                  size="sm"
                  variant="unstyled"
                />
              </Tooltip>
            ) : null}
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
