import { IconButton, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { faCheck, faShoppingBasket } from "@fortawesome/free-solid-svg-icons";
import Icon from "components/icon";
import NameYourPriceModal from "../nameYourPriceModal";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface Props {
  artistName: string;
  handleAddToBasket: (item: { price: string; trackId: string; trackTitle: string }) => Promise<void>;
  inBasket: boolean;
  inCollection: boolean;
  price: string;
  trackId: string;
  trackInCollection: boolean;
  trackTitle: string;
}

const AddToBasketButton = ({
  artistName,
  handleAddToBasket,
  inBasket,
  inCollection,
  price,
  trackId,
  trackInCollection,
  trackTitle
}: Props) => {
  const checkColour = useColorModeValue("yellow.400", "purple.200");
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isAddingToBasket, setIsAddingToBasket] = useState(false);

  const handleSubmit = async (price: string) => {
    try {
      setIsAddingToBasket(true);
      await handleAddToBasket({ price, trackId, trackTitle });
    } finally {
      setIsAddingToBasket(false);
    }
  };

  const handleClick = () => {
    if (trackInCollection) return void navigate("/dashboard/collection");
    if (Number(price) === 0) return void setShowModal(true);
    handleSubmit(price);
  };

  if (inCollection) return null;

  return (
    <>
      <Tooltip
        label={
          trackInCollection ? "You own this track." : `Add \u2018${trackTitle}\u2019, by ${artistName}, to your basket.`
        }
      >
        <IconButton
          aria-label="Set a price for a release and add it to the basket."
          isDisabled={inBasket}
          icon={
            <Icon
              color={trackInCollection ? checkColour : undefined}
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
        submitButton="Add to Basket"
        submitButtonLoading="Adding…"
      />
    </>
  );
};

export default AddToBasketButton;
