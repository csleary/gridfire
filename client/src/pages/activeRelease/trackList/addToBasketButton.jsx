import { IconButton, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { faCheck, faShoppingBasket } from "@fortawesome/free-solid-svg-icons";
import Icon from "components/icon";
import NameYourPriceModal from "../nameYourPriceModal";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const AddToBasketButton = ({
  artistName,
  handleAddToBasket,
  inBasket,
  inCollection,
  price,
  trackId,
  trackInCollection,
  trackTitle
}) => {
  const tooltipBgColour = useColorModeValue("gray.200", "gray.800");
  const tooltipColour = useColorModeValue("gray.800", "gray.100");
  const checkColour = useColorModeValue("yellow.400", "purple.200");
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isAddingToBasket, setIsAddingToBasket] = useState(false);

  const handleSubmit = async price => {
    try {
      setIsAddingToBasket(true);
      await handleAddToBasket({ price, trackId, trackTitle });
    } finally {
      setIsAddingToBasket(false);
    }
  };

  const handleClick = () => {
    if (trackInCollection) return void navigate("/dashboard/collection");
    if (price === 0) return void setShowModal(true);
    handleSubmit(price);
  };

  if (inCollection) return null;

  return (
    <>
      <Tooltip
        hasArrow
        openDelay="500"
        label={
          trackInCollection ? "You own this track." : `Add \u2018${trackTitle}\u2019, by ${artistName}, to your basket.`
        }
        bg={tooltipBgColour}
        color={tooltipColour}
      >
        <IconButton
          isDisabled={inBasket}
          icon={
            <Icon
              color={trackInCollection ? checkColour : null}
              icon={trackInCollection ? faCheck : faShoppingBasket}
            />
          }
          onClick={handleClick}
          size="sm"
          alignSelf="stretch"
          height="unset"
          variant="ghost"
        />
      </Tooltip>
      <NameYourPriceModal
        handleCloseModal={() => setShowModal(false)}
        handleSubmit={handleSubmit}
        initialPrice="1.50"
        info="Enter the amount you wish to pay for this track, before adding it to your basket."
        isSubmitting={isAddingToBasket}
        showModal={showModal}
        submitInfo={null}
        submitButton="Add to Basket"
        submitButtonLoading="Adding…"
      />
    </>
  );
};

export default AddToBasketButton;
