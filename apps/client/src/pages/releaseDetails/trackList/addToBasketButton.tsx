import { IconButton, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { faCheck, faShoppingBasket } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Icon from "@/components/icon";

import NameYourPriceModal from "../nameYourPriceModal";

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
        label={trackInCollection ? "You own this track." : `Add '${trackTitle}', by ${artistName}, to your basket.`}
      >
        <IconButton
          alignSelf="stretch"
          aria-label="Set a price for a release and add it to the basket."
          height="unset"
          icon={
            <Icon
              color={trackInCollection ? checkColour : undefined}
              icon={trackInCollection ? faCheck : faShoppingBasket}
            />
          }
          isDisabled={inBasket}
          onClick={handleClick}
          size="sm"
          variant="ghost"
        />
      </Tooltip>
      <NameYourPriceModal
        handleCloseModal={() => setShowModal(false)}
        handleSubmit={handleSubmit}
        info="Enter the amount you wish to pay for this track, before adding it to your basket."
        initialPrice="1.50"
        isSubmitting={isAddingToBasket}
        showModal={showModal}
        submitButton="Add to Basket"
        submitButtonLoading="Adding…"
      />
    </>
  );
};

export default AddToBasketButton;
