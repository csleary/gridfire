import { Box, Button, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "@/hooks";
import { toastWarning } from "@/state/toast";

import NameYourPriceModal from "../nameYourPriceModal";

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

interface TrackForPurchase {
  price: string;
  trackId: string;
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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isConnected = useSelector(state => state.web3.isConnected);
  const isFetchingAllowance = useSelector(state => state.web3.isFetchingAllowance);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Tooltip label={`Purchase '${trackTitle}', by ${artistName}.`}>
        <Button
          alignSelf="stretch"
          colorScheme={Number(price) === 0 ? nypColour : undefined}
          height="unset"
          isDisabled={!isConnected || isFetchingAllowance || inCollection || isPurchasing || trackInCollection}
          ml={1}
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
