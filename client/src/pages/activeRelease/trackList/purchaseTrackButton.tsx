import { Box, Button, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { useDispatch, useSelector } from "hooks";
import NameYourPriceModal from "../nameYourPriceModal";
import { shallowEqual } from "react-redux";
import { toastWarning } from "state/toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface TrackForPurchase {
  price: string;
  trackId: string;
}

interface Props {
  allowanceTooLow: boolean;
  artistName: string;
  handlePurchaseTrack: (trackForPurchase: TrackForPurchase) => Promise<void>;
  inCollection: boolean;
  isPurchasing: boolean;
  price: string;
  trackId: string;
  trackInCollection: boolean;
  trackTitle: string;
}

const PurchaseTrackButton = ({
  allowanceTooLow,
  artistName,
  handlePurchaseTrack,
  inCollection,
  isPurchasing,
  price,
  trackId,
  trackInCollection,
  trackTitle
}: Props) => {
  const nypColour = useColorModeValue("yellow", "purple");
  const tooltipBgColour = useColorModeValue("gray.200", "gray.800");
  const tooltipColour = useColorModeValue("gray.800", "gray.100");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isConnected, isFetchingAllowance } = useSelector(state => state.web3, shallowEqual);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Tooltip
        hasArrow
        openDelay={500}
        label={`Purchase \u2018${trackTitle}\u2019, by ${artistName}.`}
        bg={tooltipBgColour}
        color={tooltipColour}
      >
        <Button
          colorScheme={Number(price) === 0 ? nypColour : undefined}
          isDisabled={!isConnected || isFetchingAllowance || inCollection || isPurchasing || trackInCollection}
          onClick={
            allowanceTooLow
              ? () => {
                  dispatch(
                    toastWarning({
                      message: "Please increase your DAI allowance in order to purchase tracks.",
                      title: "Allowance too low."
                    })
                  );
                  navigate("/dashboard/payment/approvals");
                }
              : Number(price) === 0
              ? () => setShowModal(true)
              : () => handlePurchaseTrack({ price, trackId })
          }
          size="sm"
          alignSelf="stretch"
          height="unset"
          ml={1}
          variant="ghost"
        >
          {Number(price) === 0 ? (
            "N.Y.P."
          ) : (
            <>
              <Box as="span" color="gray.500" mr="0.2rem">
                ◈
              </Box>
              {price}
            </>
          )}
        </Button>
      </Tooltip>
      <NameYourPriceModal
        handleCloseModal={() => setShowModal(false)}
        handleSubmit={price => handlePurchaseTrack({ price, trackId })}
        info="Enter the amount you wish to pay for this track."
        initialPrice="1.50"
        isSubmitting={isPurchasing}
        showModal={showModal}
      />
    </>
  );
};

export default PurchaseTrackButton;
