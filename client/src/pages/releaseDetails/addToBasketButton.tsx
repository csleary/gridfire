import { addToBasket, setIsAddingToBasket } from "state/web3";
import { useDispatch, useSelector } from "hooks";
import { BasketItem } from "types";
import { Button } from "@chakra-ui/react";
import Icon from "components/icon";
import NameYourPriceModal from "./nameYourPriceModal";
import axios from "axios";
import { faShoppingBasket } from "@fortawesome/free-solid-svg-icons";
import { parseEther } from "ethers";
import { shallowEqual } from "react-redux";
import { toastError } from "state/toast";
import { useState } from "react";

interface Props {
  artistName: string;
  imageUrl: string;
  inCollection: boolean;
  price: string;
  releaseId: string;
  title: string;
}

const AddToBasketButton = ({ artistName, imageUrl, inCollection, price, releaseId, title }: Props) => {
  const dispatch = useDispatch();
  const basket = useSelector(state => state.web3.basket, shallowEqual);
  const isAddingToBasket = useSelector(state => state.web3.isAddingToBasket);
  const isLoading = useSelector(state => state.releases.isLoading);
  const [showModal, setShowModal] = useState(false);
  const isInBasket = basket.some((item: BasketItem) => item.releaseId === releaseId);

  const handleAddToBasket = async (price: string) => {
    try {
      dispatch(setIsAddingToBasket(true));
      const res = await axios.get(`/api/release/${releaseId}/purchase`);
      const { paymentAddress, price: releasePrice } = res.data;

      if (Number(price) < Number(releasePrice)) {
        throw new Error(`Price must be at least ◈${releasePrice}.`);
      }

      const priceInWei = parseEther(price);
      dispatch(addToBasket({ artistName, releaseId, imageUrl, paymentAddress, price: priceInWei.toString(), title }));
    } catch (error: any) {
      dispatch(toastError({ message: error.message, title: "Error" }));
      console.error(error);
    } finally {
      dispatch(setIsAddingToBasket(false));
    }
  };

  const handleClick = () => {
    if (Number(price) === 0) {
      return void setShowModal(true);
    }

    handleAddToBasket(Number(price).toFixed(2));
  };

  return (
    <>
      <Button
        isDisabled={isLoading || inCollection || isAddingToBasket || isInBasket}
        leftIcon={<Icon icon={faShoppingBasket} />}
        isLoading={isAddingToBasket}
        minW="8rem"
        onClick={handleClick}
      >
        {isInBasket ? "Added" : "Add"}
      </Button>
      <NameYourPriceModal
        handleCloseModal={() => setShowModal(false)}
        handleSubmit={handleAddToBasket}
        initialPrice="10.00"
        info="Enter the amount you wish to pay for this release, before adding it to your basket."
        isSubmitting={isAddingToBasket}
        showModal={showModal}
        submitInfo=""
        submitButton="Add to Basket"
        submitButtonLoading="Adding…"
      />
    </>
  );
};

export default AddToBasketButton;
