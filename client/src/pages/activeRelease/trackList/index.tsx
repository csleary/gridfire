import { Box, Button, ListItem, Spacer, UnorderedList, keyframes, useColorModeValue } from "@chakra-ui/react";
import { constants, utils } from "ethers";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { playTrack, playerPlay } from "state/player";
import { useDispatch, useSelector } from "hooks";
import { toastError, toastInfo, toastWarning } from "state/toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AddToBasketButton from "./addToBasketButton";
import { CLOUD_URL } from "index";
import PurchaseTrackButton from "./purchaseTrackButton";
import { addToBasket } from "state/web3";
import axios from "axios";
import { purchaseRelease } from "web3/contract";
import { shallowEqual } from "react-redux";
import { useState } from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

export interface BasketItem {
  price: string;
  releaseId?: string;
  trackId?: string;
  trackTitle: string;
}

interface ReleaseTrack {
  _id: string;
  duration: number;
  price: string;
  trackTitle: string;
}

interface TrackForPurchase {
  price: string;
  trackId: string;
}

interface Sale {
  release: string;
}

const pulsing = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const animation = `${pulsing} 500ms cubic-bezier(0, 0.85, 0.15, 1) alternate infinite 250ms`;

const TrackList = () => {
  const dispatch = useDispatch();
  const { basket, daiAllowance } = useSelector(state => state.web3, shallowEqual);
  const { purchases, userId } = useSelector(state => state.user, shallowEqual);
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const { isPlaying, isPaused, trackId: playerTrackId } = useSelector(state => state.player, shallowEqual);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { _id: releaseId, artistName, artwork, releaseTitle, trackList } = release;
  const secondaryColour = useColorModeValue("gray.400", "gray.500");
  const titleColour = useColorModeValue("gray.500", "gray.300");

  const handleAddToBasket = async ({ price, trackId, trackTitle }: BasketItem) => {
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

  const handlePurchaseTrack = async ({ price, trackId }: TrackForPurchase) => {
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
  };

  return (
    <UnorderedList marginInlineStart={0} mb={8} styleType="none" stylePosition="inside">
      {trackList.map(({ _id: trackId, duration, price, trackTitle }: ReleaseTrack, index) => {
        const allowanceTooLow = utils.parseEther(price.toString()).gt(daiAllowance) || daiAllowance.eq(constants.Zero);
        const inBasket = basket.some((item: BasketItem) => item.releaseId === trackId);
        const inCollection = purchases.some((sale: Sale) => sale.release === releaseId);
        const trackInCollection = purchases.some((sale: Sale) => sale.release === trackId);

        return (
          <ListItem key={trackId} display="flex" alignItems="center" role="group">
            <Box as="span" color={secondaryColour} fontWeight="600" mr="2">
              {(index + 1).toString(10).padStart(2, "0")}
            </Box>
            <Button
              color={titleColour}
              minWidth={2}
              textAlign="left"
              variant="link"
              whiteSpace="break-spaces"
              onClick={async () => {
                if (trackId !== playerTrackId) {
                  dispatch(playTrack({ artistName, releaseId, releaseTitle, trackId, trackTitle }));
                  dispatch(toastInfo({ message: `'${trackTitle}'`, title: "Loading" }));
                } else if (!isPlaying) {
                  const audioPlayer = document.getElementById("player") as HTMLAudioElement;
                  await audioPlayer.play().catch(console.log);
                  dispatch(playerPlay());
                }
              }}
            >
              {trackTitle}
            </Button>
            {duration ? (
              <Box as="span" color={secondaryColour} fontWeight="600" ml="2">
                ({Math.floor(duration / 60)}:{(Math.ceil(duration) % 60).toString(10).padStart(2, "0")})
              </Box>
            ) : null}
            {trackId === playerTrackId && isPlaying ? (
              <Box as={FontAwesomeIcon} icon={faPlay as IconProp} animation={animation} ml={2} />
            ) : trackId === playerTrackId && isPaused ? (
              <Box as={FontAwesomeIcon} icon={faPause as IconProp} animation={animation} ml={2} />
            ) : null}
            <Spacer />
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
          </ListItem>
        );
      })}
    </UnorderedList>
  );
};

export default TrackList;
