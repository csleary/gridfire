import { Box, Button, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { faCheck, faShoppingBasket } from "@fortawesome/free-solid-svg-icons";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import Icon from "components/icon";
import NameYourPriceModal from "../nameYourPriceModal";
import { toastWarning } from "state/toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
}) => {
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
        openDelay="500"
        label={`Purchase \u2018${trackTitle}\u2019, by ${artistName}.`}
        bg={tooltipBgColour}
        color={tooltipColour}
      >
        <Button
          colorScheme={price === 0 ? nypColour : null}
          isDisabled={!isConnected || isFetchingAllowance || inCollection || isPurchasing || trackInCollection}
          icon={<Icon icon={inCollection || trackInCollection ? faCheck : faShoppingBasket} />}
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
              : price === 0
              ? () => setShowModal(true)
              : handlePurchaseTrack.bind(null, { price, trackId })
          }
          size="sm"
          alignSelf="stretch"
          height="unset"
          ml={1}
          variant="ghost"
        >
          {price === 0 ? (
            "N.Y.P."
          ) : (
            <>
              <Box as="span" color="gray.500" mr="0.2rem">
                ◈
              </Box>
              {Number(price).toFixed(2)}
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
